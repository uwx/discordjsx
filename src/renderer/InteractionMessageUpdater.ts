import { AnySelectMenuInteraction, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";
import { MessagePayloadOutput } from "src/payload/types";
import TypedEventEmitter from "typed-emitter";
import EventEmitter from "node:events";
import { debounceAsync } from "src/utils/debounceAsync";
import { markComponentsDisabled } from "src/utils/markComponentsDisabled";

const INTERACTION_TOKEN_EXPIRY = 15 * 60 * 1000;
// const INTERACTION_TOKEN_EXPIRY = 40 * 1000;
const REPLY_EXPIRY = 3 * 1000;

const REPLY_TIMEOUT = REPLY_EXPIRY - 1000;
const INTERACTION_TOKEN_TIMEOUT = INTERACTION_TOKEN_EXPIRY - 30 * 1000;

export type MessageUpdateableInteraction = ChatInputCommandInteraction | ModalSubmitInteraction | ButtonInteraction | AnySelectMenuInteraction;

export type InteractionMessageUpdaterEventMap = {
    tokenExpired: () => void;
    messageUpdated: (method: "reply" | "editReply" | "update") => void;
};

export class InteractionMessageUpdater extends (EventEmitter as new () => TypedEventEmitter<InteractionMessageUpdaterEventMap>) {
    interaction: MessageUpdateableInteraction;
    tokenExpired: boolean = false;

    private tokenExpiryTimeout: NodeJS.Timeout | null = null;

    constructor(interaction: MessageUpdateableInteraction) {
        super();
        this.interaction = interaction;
        this.setInteraction(interaction);
    }

    setInteraction(interaction: MessageUpdateableInteraction) {
        this.interaction = interaction;

        if (this.tokenExpiryTimeout) {
            clearTimeout(this.tokenExpiryTimeout);
        };

        this.tokenExpiryTimeout = setTimeout(this.onTokenExpired.bind(this), INTERACTION_TOKEN_TIMEOUT);

        if (interaction.isMessageComponent() || (interaction.isModalSubmit() && interaction.isFromMessage())) {
            setTimeout(async () => {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.deferUpdate();
                    console.log("deferUpdate called on component interaction");
                }
            }, REPLY_TIMEOUT);
        }
    }

    updateMessage = debounceAsync(this._updateMessage);

    private lastPayload: MessagePayloadOutput | null = null;
    private async _updateMessage(payload: MessagePayloadOutput) {
        if(this.tokenExpired) {
            console.log("[discord-jsx-renderer] Tried to updateMessage on an expired interaction");
            return;
        };

        this.lastPayload = payload;
        if (this.interaction.replied || this.interaction.deferred) {
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
        if(this.lastPayload) {
            try {
                await this._updateMessage({
                    ...this.lastPayload,
                    options: markComponentsDisabled(this.lastPayload.options),
                });
            } catch(e) {
                console.log(e);
            }
        };
    }
};
