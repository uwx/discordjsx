import { MessageFlags, ModalSubmitInteraction, type AnySelectMenuInteraction, type ButtonInteraction, type ChatInputCommandInteraction, type Interaction } from "discord.js";
import { JSXRenderer } from "../reconciler";
import type { HostContainer } from "../reconciler/types";
import EventEmitter from "node:events";
import TypedEventEmitter from "typed-emitter";
import { debounceAsync } from "src/utils/debounceAsync";
import { DJSXEventHandlerMap } from "src/types/events";
import { PayloadBuilder } from "src/payload";
import { MessagePayloadOutput } from "src/payload/types";
import { DJSXRendererEventMap } from "./types";
import { v4 } from "uuid";

export class DJSXRenderer extends (EventEmitter as new () => TypedEventEmitter<DJSXRendererEventMap>) {
    key?: string = v4();
    private renderer: JSXRenderer;
    private events: Partial<DJSXEventHandlerMap> | null = null;

    interaction: ChatInputCommandInteraction | ModalSubmitInteraction;
    lastInteraction: ButtonInteraction | AnySelectMenuInteraction | null = null;

    private inactivityTimer: NodeJS.Timeout;
    private INTERACTION_TOKEN_LIFE = 15 * 60 * 1000; // 15 minutes
    private deferUpdateTimeout: NodeJS.Timeout | null = null;
    private DEFER_TIME = 2 * 1000; // actually 3 seconds but we compromise

    constructor(
        interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
        node?: React.ReactNode,
        key?: string,
    ) {
        super();
        this.key = key;
        this.interaction = interaction;
        this.renderer = new JSXRenderer();
        this.setNode(node);

        this.inactivityTimer = setTimeout(
            () => this.emit("inactivity"),
            this.INTERACTION_TOKEN_LIFE
        );

        this.renderer.on("render", this.render.bind(this));
        this.renderer.on("renderError", this.handleError.bind(this));
    }

    private node: React.ReactNode = null;
    setNode(node: React.ReactNode) {
        this.node = node;
        this.renderer.setRoot(node);
    }

    private prefixCustomId() {
        return `djsx:${this.key || "auto"}`;
    }

    async dispatchInteraction(interaction: Interaction) {
        if (this.key
            && "customId" in interaction
            && !interaction.customId.startsWith(this.prefixCustomId())
        ) return;

        if (interaction.isButton()) {
            let cb = this.events?.button?.get(interaction.customId);
            cb?.(interaction);
        } else if (interaction.isAnySelectMenu()) {
            let cb = this.events?.select?.get(interaction.customId);
            cb?.(interaction.values, interaction);
        } else if (interaction.isModalSubmit()) {
            let cb = this.events?.modalSubmit?.get(interaction.customId);
            let form: Record<string, string> = {};
            for (let [name, component] of interaction.fields.fields) {
                form[name] = component.value;
            }
            cb?.(form, interaction);
        };

        if (interaction.isButton() || interaction.isAnySelectMenu()) {
            let before = this.lastInteraction;
            this.lastInteraction = interaction;

            if (this.deferUpdateTimeout)
                clearTimeout(this.deferUpdateTimeout);
            this.deferUpdateTimeout = setTimeout(() => {
                this.lastInteraction?.deferUpdate();
                this.lastInteraction = null;
            }, this.DEFER_TIME);

            await before?.deferUpdate();
        }
    }

    private async render(container: HostContainer) {
        if (!container.node) return;
        try {
            let payload = new PayloadBuilder(this.prefixCustomId.bind(this))
                .createMessage(container.node);
            if ('suspended' in payload && payload.suspended) {
                return;
            }
            this.events = payload.eventHandlers;
            this.updateMessageDebounced(payload);
        } catch (e) {
            this.handleError(e as Error);
        };
    }


    private readonly updateMessageDebounced = debounceAsync(async (payload: MessagePayloadOutput) => {
        try {
            await this.updateMessage(payload);
        } catch (e) {
            await this.handleError(e as Error);
        }
    }, 0);

    private async updateMessage(output: MessagePayloadOutput) {
        const { flags, payload } = output;

        if (this.lastInteraction) {
            await this.lastInteraction.update({
                ...payload,
            });

            this.lastInteraction = null;
            if (this.deferUpdateTimeout)
                clearTimeout(this.deferUpdateTimeout);

            this.emit("updatedMessage", "component");
        } else if (this.interaction.replied || this.interaction.deferred) {
            await this.interaction.editReply({
                withComponents: true,
                ...payload,
            });

            this.emit("updatedMessage", "interaction");
        } else {
            await this.interaction.reply({
                withResponse: true,
                flags,
                ...payload,
            });

            this.emit("updatedMessage", "reply");
        }

        this.inactivityTimer.refresh();
    }

    async handleError(error: Error) {
        try {
            this.emit("error", error);

            const content = `-# discordjsx\n:warning: **Error**\n\`\`\`\n${error.toString()}\n\`\`\``;

            await this.updateMessage({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                eventHandlers: {
                    button: new Map(),
                    select: new Map(),
                },
                payload: {
                    components: [
                        {
                            type: 10,
                            content,
                        }
                    ],
                },
            });
        } catch (e) {
            this.emit("fatalError", e as Error);
            console.log("[discordjsx/renderer] (fatal) Error", e);
        }
    }
}
