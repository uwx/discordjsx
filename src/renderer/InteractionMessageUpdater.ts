import { AnySelectMenuInteraction, BaseChannel, ButtonInteraction, ChatInputCommandInteraction, Message, MessageFlags, ModalSubmitInteraction, SendableChannels, TextBasedChannel, User } from "discord.js";
import { MessagePayloadOutput } from "../payload/types";
import TypedEventEmitter from "typed-emitter";
import EventEmitter from "node:events";
import { debounceAsync } from "../utils/debounceAsync";
import { markComponentsDisabled } from "../utils/markComponentsDisabled";

const INTERACTION_TOKEN_EXPIRY = 15 * 60 * 1000;
// const INTERACTION_TOKEN_EXPIRY = 40 * 1000;
const REPLY_EXPIRY = 3 * 1000;

const REPLY_TIMEOUT = REPLY_EXPIRY - 1000;
const INTERACTION_TOKEN_TIMEOUT = INTERACTION_TOKEN_EXPIRY - 30 * 1000;

export type MessageUpdateableInteraction = ChatInputCommandInteraction | ModalSubmitInteraction | ButtonInteraction | AnySelectMenuInteraction | (BaseChannel & TextBasedChannel & SendableChannels) | Message | User;

export type InteractionMessageUpdaterEventMap = {
    tokenExpired: () => void;
    messageUpdated: (method: "reply" | "editReply" | "update") => void;
    error: (e: Error) => void;
};

export class InteractionMessageUpdater extends (EventEmitter as new () => TypedEventEmitter<InteractionMessageUpdaterEventMap>) {
    interaction: MessageUpdateableInteraction;
    tokenExpired: boolean = false;

    private tokenExpiryTimeout: NodeJS.Timeout | null = null;

    private disableInteractivity = false;

    constructor(
        interaction: MessageUpdateableInteraction,
        options?: { disableInteractivity?: boolean },
    ) {
        super();
        this.disableInteractivity = options?.disableInteractivity ?? false;
        this.interaction = interaction;
        this.setInteraction(interaction);
    }

    setInteraction(interaction: MessageUpdateableInteraction) {
        this.interaction = interaction;

        if (this.tokenExpiryTimeout) {
            clearTimeout(this.tokenExpiryTimeout);
        };

        if (!this.disableInteractivity) {
            this.tokenExpiryTimeout = setTimeout(this.onTokenExpired.bind(this), INTERACTION_TOKEN_TIMEOUT);
        }

        if (interaction.isMessageComponent() || (interaction.isModalSubmit() && interaction.isFromMessage())) {
            setTimeout(async () => {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.deferUpdate();
                }
            }, REPLY_TIMEOUT);
        }
    }

    updateMessageDebounced = debounceAsync(async (payload) => {
        try {
            await this.updateMessage(payload);
        } catch(e) {
            this.emit("error", e as Error);
        }
    });

    private lastPayload: MessagePayloadOutput | null = null;
    async updateMessage(payload: MessagePayloadOutput) {
        if(this.tokenExpired) {
            console.log("[discord-jsx-renderer] Tried to updateMessage on an expired interaction");
            return;
        };

        this.lastPayload = payload;
        await this._updateMessage(payload);
    }

    async _updateMessage(payload: MessagePayloadOutput) {
        if (this.interaction instanceof Message) {
            await this.interaction.edit({
                ...payload.options,
                flags: payload.flags.includes(MessageFlags.SuppressEmbeds) ? MessageFlags.SuppressEmbeds : undefined,
            });
        } else if (this.interaction instanceof BaseChannel || this.interaction instanceof User) {
            this.interaction = await this.interaction.send({
                ...payload.options,
                flags: (payload.flags.includes(MessageFlags.SuppressEmbeds) ? MessageFlags.SuppressEmbeds : 0)
                    | (payload.flags.includes(MessageFlags.SuppressNotifications) ? MessageFlags.SuppressNotifications : 0)
                    | (payload.flags.includes(MessageFlags.IsComponentsV2) ? MessageFlags.IsComponentsV2 : 0),
            });
        } else if (this.interaction.replied || this.interaction.deferred) {
            await this.interaction.editReply(payload.options);
            this.emit("messageUpdated", "editReply");
        } else {
            if (
                this.interaction.isChatInputCommand()
                || (this.interaction.isModalSubmit() && !this.interaction.isFromMessage())
            ) {
                await this.interaction.reply({
                    ...payload.options,
                    flags: payload.flags,
                });
                this.emit("messageUpdated", "reply");
            } else if (
                this.interaction.isMessageComponent()
                || (this.interaction.isModalSubmit() && this.interaction.isFromMessage())
            ) {
                await this.interaction.update(payload.options);
                this.emit("messageUpdated", "update");
            }
        }
    }

    private async onTokenExpired() {
        await this.disable();
        this.tokenExpired = true;
        this.emit("tokenExpired");
    }

    async disable() {
        if(!this.lastPayload) return;
        if(this.tokenExpired) return;

        try {
            await this.updateMessage({
                ...this.lastPayload,
                options: markComponentsDisabled(this.lastPayload.options),
            });
        } catch(e) {
            console.log(e);
        }
    }
};
