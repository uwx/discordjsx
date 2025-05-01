import TypedEventEmitter from "typed-emitter";
import { EventEmitter } from "node:events";
import { DJSXRendererEventMap } from "./types";
import { v4 } from "uuid";
import { HostContainer, JSXRenderer } from "src/reconciler";
import { DJSXEventHandlerMap } from "src/types";
import { InteractionMessageUpdater, MessageUpdateableInteraction } from "./InteractionMessageUpdater";
import { Interaction, MessageFlags } from "discord.js";
import { PayloadBuilder } from "src/payload";

export class DJSXRenderer extends (EventEmitter as new () => TypedEventEmitter<DJSXRendererEventMap>) {
    key?: string = v4();
    private renderer: JSXRenderer;
    private events: Partial<DJSXEventHandlerMap> | null = null;

    updater: InteractionMessageUpdater;

    constructor(
        interaction: MessageUpdateableInteraction,
        node?: React.ReactNode,
        key?: string,
    ) {
        super();
        this.key = key;
        this.updater = new InteractionMessageUpdater(interaction);
        this.renderer = new JSXRenderer();
        this.setNode(node);

        this.renderer.on("render", this.onRender.bind(this));
        this.renderer.on("renderError", this.handleError.bind(this));
        this.updater.on("tokenExpired", () => this.emit("inactivity"));
    }

    private node: React.ReactNode = null;
    
    setNode(node: React.ReactNode) {
        this.node = node;
        this.renderer.setRoot(this.node);
    }

    getNode() {
        return this.node;
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

        if (
            interaction.isMessageComponent()
            || interaction.isModalSubmit()
        ) this.updater.setInteraction(interaction);
    }

    private async onRender(container: HostContainer) {
        if (!container.node) return;
        
        try {
            let builder = new PayloadBuilder(this.prefixCustomId.bind(this));
            let payload = builder.createMessage(container.node);
            this.events = builder.eventHandlers;
            this.updater.updateMessage(payload);
        } catch (e) {
            this.handleError(e as Error);
        };
    }

    async handleError(error: Error) {
        try {
            this.emit("error", error);

            const content = `-# discordjsx\n:warning: **Error**\n\`\`\`\n${error.toString()}\n\`\`\``;

            await this.updater.updateMessage({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                options: {
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
