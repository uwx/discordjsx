import { BaseChannel, BaseInteraction, BaseMessageOptions, blockQuote, codeBlock, ComponentType, DiscordAPIError, Message, MessageFlags, resolveColor, User } from "discord.js";
import { debounceAsync } from "../utils/debounceAsync.js";
import { markComponentsDisabled } from "../utils/markComponentsDisabled.js";
import { inspect } from "node:util";
import { createNanoEvents } from "nanoevents";
import { INTERACTION_TOKEN_EXPIRY, MessageUpdateable, INTERACTION_REPLY_EXPIRY } from "./types.js";
import { pickMessageFlags, isUpdateableNeedsReply } from "./utils.js";

const REPLY_TIMEOUT = INTERACTION_REPLY_EXPIRY - 1000;
const INTERACTION_TOKEN_TIMEOUT = INTERACTION_TOKEN_EXPIRY - 30 * 1000;

export type InteractionMessageUpdaterEventMap = {
    tokenExpired: () => void;
    messageUpdated: (method: "reply" | "editReply" | "update") => void;
};

export class MessageUpdater {
    target: MessageUpdateable;
    tokenExpired: boolean = false;
    emitter = createNanoEvents<InteractionMessageUpdaterEventMap>();

    flags: MessageFlags[] = [MessageFlags.IsComponentsV2];

    private tokenExpiryTimeout: NodeJS.Timeout | null = null;

    constructor(target: MessageUpdateable) {
        this.target = target;
        this.setTarget(target);

        if (target instanceof BaseInteraction && target.isRepliable()) {
            setTimeout(async () => {
                if (!target.replied && !target.deferred) {
                    await target.deferReply({
                        flags: this.flags
                    });
                }
            }, REPLY_TIMEOUT);
        }
    }

    setTarget(target: MessageUpdateable) {
        this.target = target;

        this.setExpiry();

        if (isUpdateableNeedsReply(target)) {
            setTimeout(async () => {
                if (!target.replied && !target.deferred) {
                    await target.deferUpdate();
                }
            }, REPLY_TIMEOUT);
        }
    }

    private setExpiry() {
        if (this.tokenExpiryTimeout) {
            clearTimeout(this.tokenExpiryTimeout);
        };

        this.tokenExpired = false;
        this.tokenExpiryTimeout = setTimeout(this.onTokenExpired.bind(this), INTERACTION_TOKEN_TIMEOUT);
    }

    setFlags(flags: MessageFlags[]) {
        this.flags = flags;
    }

    updateMessageDebounced = debounceAsync(async (options: BaseMessageOptions) => {
        return await this.updateMessage(options);
    });

    private lastPayload: BaseMessageOptions | null = null;
    async updateMessage(options: BaseMessageOptions) {
        if (this.tokenExpired) {
            console.log("[discord-jsx-renderer] Tried to updateMessage on an expired interaction");
            return;
        };

        try {
            await this.updateMessageRaw(options);
            this.lastPayload = options;
        } catch (e) {
            await this.handleError(e as Error);
        }
    }

    // Error handling

    async handleError(error: Error) {
        if (error instanceof DiscordAPIError && error.code == 10062) {
            this.tokenExpired = true;
            return;
        }

        if (error instanceof DiscordAPIError) console.log(inspect(error.requestBody, { depth: Infinity }));

        await this.showErrorMessage(error);
    }

    async showErrorMessage(error: Error) {
        const options = this.createErrorPayload(error);

        try {
            await this.updateMessageRaw(options);
        } catch (e) {
            console.log("[jsx/updater] Couldn't show render-error message for:", error);
            console.log("[jsx/updater] Error thrown while trying to show error message:", e);
            if (e instanceof DiscordAPIError) console.log(inspect(e.requestBody, { depth: Infinity }));
        }
    }

    private createErrorPayload(e: Error): BaseMessageOptions {
        let content = [
            "-# `discord-jsx-renderer`: failed to render",
            "### ⚠️ **Error**",
            "",
            codeBlock(e.toString()),
        ].join("\n");

        if (this.flags.includes(MessageFlags.IsComponentsV2)) {
            return {
                components: [
                    {
                        type: ComponentType.Container,
                        accent_color: resolveColor("Yellow"),
                        components: [
                            {
                                type: ComponentType.TextDisplay,
                                content,
                            },
                        ],
                    },
                ],
            };
        } else {
            return {
                content: blockQuote(content),
            };
        };
    }

    // Raw

    async updateMessageRaw(options: BaseMessageOptions) {
        if (this.target instanceof BaseInteraction) {
            if (this.target.isRepliable() && (this.target.replied || this.target.deferred)) {
                await this.target.editReply({
                    ...options,
                    flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
                });
            } else {
                if (
                    this.target.isChatInputCommand()
                    || (this.target.isModalSubmit() && !this.target.isFromMessage())
                ) {
                    await this.target.reply({
                        ...options,
                        flags: pickMessageFlags(this.flags, [
                            MessageFlags.Ephemeral,
                            MessageFlags.SuppressEmbeds,
                            MessageFlags.SuppressNotifications,
                            MessageFlags.IsComponentsV2,
                        ]),
                    });
                } else if (
                    this.target.isMessageComponent()
                    || (this.target.isModalSubmit() && this.target.isFromMessage())
                ) {
                    await this.target.update({
                        ...options,
                        flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
                    });
                }
            }
        } else if (this.target instanceof Message) {
            await this.target.edit({
                ...options,
                flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
            });
        } else if (this.target instanceof BaseChannel && this.target.isSendable()) {
            this.target = await this.target.send({
                ...options,
                flags: pickMessageFlags(this.flags, [
                    MessageFlags.SuppressEmbeds,
                    MessageFlags.SuppressNotifications,
                    MessageFlags.IsComponentsV2,
                ]),
            });
        } else if (this.target instanceof User) {
            this.target = await (await this.target.createDM()).send({
                ...options,
                flags: pickMessageFlags(this.flags, [
                    MessageFlags.SuppressEmbeds,
                    MessageFlags.SuppressNotifications,
                    MessageFlags.IsComponentsV2,
                ]),
            });
        }
    }

    // Expiry and disabling

    private async onTokenExpired() {
        await this.disable();
        this.tokenExpired = true;
        this.emitter.emit("tokenExpired");
    }

    async disable() {
        if (!this.lastPayload) return;
        if (this.tokenExpired) return;

        try {
            await this.updateMessage(markComponentsDisabled(this.lastPayload));
        } catch (e) {
            console.log(e);
        }
    }
};
