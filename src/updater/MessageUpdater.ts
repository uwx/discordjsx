import { BaseChannel, BaseInteraction, type BaseMessageOptions, blockQuote, codeBlock, ComponentType, DiscordAPIError, Message, MessageFlags, resolveColor, User } from "discord.js";
import { debounceAsync } from "../utils/debounceAsync.js";
import { markComponentsDisabled } from "../utils/markComponentsDisabled.js";
import { inspect } from "node:util";
import { createNanoEvents, type Unsubscribe } from "nanoevents";
import { INTERACTION_TOKEN_EXPIRY, type MessageUpdateable, INTERACTION_REPLY_EXPIRY } from "./types.js";
import { pickMessageFlags, isUpdateableNeedsReply } from "./utils.js";
import { DJSXRendererOptions } from "../renderer/types.js";
import { defaultLog } from "src/utils/log.js";

const REPLY_TIMEOUT = INTERACTION_REPLY_EXPIRY - 1000;
const INTERACTION_TOKEN_TIMEOUT = INTERACTION_TOKEN_EXPIRY - 30 * 1000;

export type InteractionMessageUpdaterEventMap = {
    tokenExpired(): void;
    timeout(): void;
    messageUpdated(method: "reply" | "editReply" | "update"): void;
};

export class MessageUpdater {
    tokenExpired = false;
    timedOut = false;
    emitter = createNanoEvents<InteractionMessageUpdaterEventMap>();

    private payload: BaseMessageOptions | null = null;

    private tokenExpiryTimeout: NodeJS.Timeout | null = null;

    constructor(
        target: MessageUpdateable,
        private flags: MessageFlags[] = [MessageFlags.IsComponentsV2],
        disableAfter?: number,
        private readonly deferAfter = REPLY_TIMEOUT,
        private readonly createErrorMessage: (error: Error) => BaseMessageOptions = this.createErrorPayload.bind(this),
        private readonly log: (level: 'message' | 'warn' | 'error', category: string, message: string, ...args: any[]) => void = defaultLog,
    ) {
        this.target = target;

        if (deferAfter && target instanceof BaseInteraction && target.isRepliable()) {
            setTimeout(async () => {
                if (!target.replied && !target.deferred) {
                    await target.deferReply({
                        // HACK: type assertion until discord.js typings are updated to include MessageFlags.IsComponentsV2
                        flags: pickMessageFlags(this.flags, [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]) as [MessageFlags.Ephemeral]
                    });
                }
            }, REPLY_TIMEOUT);
        }

        if (disableAfter) {
            setTimeout(() => this.onTimeout(), disableAfter);
        }
    }

    private _target: MessageUpdateable;
    set target(target: MessageUpdateable) {
        this._target = target;

        this.resetExpiry();

        if (this.deferAfter && isUpdateableNeedsReply(target)) {
            setTimeout(async () => {
                if (!target.replied && !target.deferred) {
                    await target.deferUpdate();
                }
            }, this.deferAfter);
        }
    }
    get target() {
        return this._target;
    }

    private resetExpiry() {
        if (this.tokenExpiryTimeout) {
            clearTimeout(this.tokenExpiryTimeout);
        }

        this.tokenExpired = false;
        this.tokenExpiryTimeout = setTimeout(() => this.onTokenExpired(), INTERACTION_TOKEN_TIMEOUT);
    }

    updateMessage = debounceAsync(async (...args: Parameters<MessageUpdater['_updateMessage']>) => {
        return await this._updateMessage(...args);
    });

    private async _updateMessage(flags: MessageFlags[], options: BaseMessageOptions) {
        if (this.tokenExpired) {
            this.log('message', 'jsx/updater', "Tried to updateMessage on an expired interaction");
            return;
        }

        this.flags = flags;
        this.payload = options;

        try {
            await this.updateMessageRaw();
        } catch (e) {
            await this.handleError(e as Error);
        }
    }

    // Error handling

    async handleError(error: Error) {
        if (error instanceof DiscordAPIError && error.code === 10062) {
            this.tokenExpired = true;
            return;
        }

        this.payload = this.createErrorMessage(error);

        try {
            await this.updateMessageRaw();
        } catch (e) {
            this.log('error', "jsx/updater", "Couldn't show render-error message for:", error);
            this.log('error', "jsx/updater", "Error thrown while trying to show error message:", e);
        }
    }

    private createErrorPayload(e: Error): BaseMessageOptions {
        const content = [
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
        }

        return {
            content: blockQuote(content),
        };
    }

    // Raw

    async updateMessageRaw() {
        if (!this.payload) {
            throw new Error('Missing payload!');
        }

        if (this.target instanceof BaseInteraction) {
            if (this.target.replied || this.target.deferred) {
                await this.target.editReply({
                    ...this.payload,
                    flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
                });
            } else {
                if (
                    this.target.isChatInputCommand()
                    || (this.target.isModalSubmit() && !this.target.isFromMessage())
                ) {
                    await this.target.reply({
                        ...this.payload,
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
                        ...this.payload,
                        flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
                    });
                }
            }
        } else if (this.target instanceof Message) {
            await this.target.edit({
                ...this.payload,
                flags: pickMessageFlags(this.flags, [MessageFlags.SuppressEmbeds, MessageFlags.IsComponentsV2]),
            });
        } else if (this.target instanceof BaseChannel || this.target instanceof User) {
            this.target = await this.target.send({
                ...this.payload,
                flags: pickMessageFlags(this.flags, [
                    MessageFlags.SuppressEmbeds,
                    MessageFlags.SuppressNotifications,
                    MessageFlags.IsComponentsV2,
                ]),
            });
        } else if (this.target instanceof User) {
            this.target = await (await this.target.createDM()).send({
                ...this.payload,
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
        this.timedOut = true;
        this.emitter.emit("tokenExpired");
    }

    private async onTimeout() {
        await this.disable();
        this.timedOut = true;
        this.emitter.emit("timeout");
    }

    async disable() {
        if (!this.payload || this.tokenExpired || this.timedOut) return;

        this.payload = markComponentsDisabled(this.payload);

        try {
            await this.updateMessageRaw();
        } catch (e) {
            this.log('error', 'jsx/updater', 'While trying to disable message components', e);
        }
    }

    // Events

    on<K extends keyof InteractionMessageUpdaterEventMap>(this: this, event: K, cb: InteractionMessageUpdaterEventMap[K]): Unsubscribe {
        return this.emitter.on(event, cb);
    }
};
