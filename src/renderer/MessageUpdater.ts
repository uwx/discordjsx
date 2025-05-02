import { AnySelectMenuInteraction, BaseMessageOptions, blockQuote, ButtonInteraction, ChatInputCommandInteraction, codeBlock, ComponentType, DiscordAPIError, DiscordjsErrorCodes, MessageEditOptions, MessageFlags, ModalSubmitInteraction, resolveColor } from "discord.js";
import { InteractionMessageFlags } from "../payload/types";
import TypedEventEmitter from "typed-emitter";
import EventEmitter from "node:events";
import { debounceAsync } from "../utils/debounceAsync";
import { markComponentsDisabled } from "../utils/markComponentsDisabled";
import { inspect } from "node:util";

const INTERACTION_TOKEN_EXPIRY = 15 * 60 * 1000;
// const INTERACTION_TOKEN_EXPIRY = 40 * 1000;
const REPLY_EXPIRY = 3 * 1000;

const REPLY_TIMEOUT = REPLY_EXPIRY - 1000;
const INTERACTION_TOKEN_TIMEOUT = INTERACTION_TOKEN_EXPIRY - 30 * 1000;

export type MessageUpdateable = ChatInputCommandInteraction | ModalSubmitInteraction | ButtonInteraction | AnySelectMenuInteraction;

export type InteractionMessageUpdaterEventMap = {
    tokenExpired: () => void;
    messageUpdated: (method: "reply" | "editReply" | "update") => void;
};

export class MessageUpdater extends (EventEmitter as new () => TypedEventEmitter<InteractionMessageUpdaterEventMap>) {
    interaction: MessageUpdateable;
    tokenExpired: boolean = false;

    flags: InteractionMessageFlags[] = [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral];

    private tokenExpiryTimeout: NodeJS.Timeout | null = null;

    constructor(interaction: MessageUpdateable) {
        super();
        this.interaction = interaction;
        this.setInteraction(interaction);
    }

    setInteraction(interaction: MessageUpdateable) {
        this.interaction = interaction;

        this.setExpiry();

        if (interaction.isMessageComponent() || (interaction.isModalSubmit() && interaction.isFromMessage())) {
            setTimeout(async () => {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.deferUpdate();
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

    setFlags(flags: InteractionMessageFlags[]) {
        this.flags = flags;
    }

    updateMessageDebounced = debounceAsync(async (options: BaseMessageOptions) => {
        return await this.updateMessage(options);
    });

    private lastPayload: BaseMessageOptions | null = null;
    async updateMessage(options: BaseMessageOptions) {
        if(this.tokenExpired) {
            console.log("[discord-jsx-renderer] Tried to updateMessage on an expired interaction");
            return;
        };

        try {
            await this.updateMessageRaw(options);
            this.lastPayload = options;
        } catch(e) {
            await this.handleError(e as Error);
        }
    }

    // Error handling

    async handleError(error: Error) {
        if(error instanceof DiscordAPIError && error.code == 10062) {
            this.tokenExpired = true;
            return;
        }

        if(error instanceof DiscordAPIError) console.log(inspect(error.requestBody, { depth: Infinity }));

        await this.showErrorMessage(error);
    }

    async showErrorMessage(error: Error) {
        const options = this.createErrorPayload(error);

        try {
            await this.updateMessageRaw(options);
        } catch(e) {
            console.log("[jsx/updater] Couldn't show render-error message for:", error);
            console.log("[jsx/updater] Error thrown while trying to show error message:", e);
            if(e instanceof DiscordAPIError) console.log(inspect(e.requestBody, { depth: Infinity }));
        }
    }

    private createErrorPayload(e: Error): BaseMessageOptions {
        let content = [
            "-# `discord-jsx-renderer`: failed to render",
            "### ⚠️ **Error**",
            "",
            codeBlock(e.toString()),
        ].join("\n");

        if(this.flags.includes(MessageFlags.IsComponentsV2)) {
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
        console.log("updateMessageRaw", inspect(options, { depth: Infinity }))

        if (this.interaction.replied || this.interaction.deferred) {
            await this.interaction.editReply(options);
            this.emit("messageUpdated", "editReply");
        } else {
            if (
                this.interaction.isChatInputCommand()
                || (this.interaction.isModalSubmit() && !this.interaction.isFromMessage())
            ) {
                await this.interaction.reply({
                    ...options,
                    flags: this.flags,
                });
                this.emit("messageUpdated", "reply");
            } else if (
                this.interaction.isMessageComponent()
                || (this.interaction.isModalSubmit() && this.interaction.isFromMessage())
            ) {
                await this.interaction.update(options);
                this.emit("messageUpdated", "update");
            }
        }
    }

    // Expiry and disabling

    private async onTokenExpired() {
        await this.disable();
        this.tokenExpired = true;
        this.emit("tokenExpired");
    }

    async disable() {
        if(!this.lastPayload) return;
        if(this.tokenExpired) return;

        try {
            await this.updateMessage(markComponentsDisabled(this.lastPayload));
        } catch(e) {
            console.log(e);
        }
    }
};
