import { DJSXRendererEventMap } from "./types";
import { v4 } from "uuid";
import { HostContainer, JSXRenderer } from "../reconciler";
import { DJSXEventHandlerMap } from "../types";
import { MessageUpdater } from "../updater/MessageUpdater";
import { Interaction, MessageFlags } from "discord.js";
import { PayloadBuilder } from "../payload";
import { createNanoEvents } from "nanoevents";
import { MessageUpdateable } from "../updater";

export class DJSXRenderer {
    key?: string = v4();
    private renderer = new JSXRenderer();
    private events: Partial<DJSXEventHandlerMap> | null = null;

    emitter = createNanoEvents<DJSXRendererEventMap>();

    updater: MessageUpdater;

    constructor(
        interaction: MessageUpdateable,
        node?: React.ReactNode,
        key?: string,
    ) {
        this.key = key;
        this.updater = new MessageUpdater(interaction);
        this.setNode(node);

        this.renderer.emitter.on("render", this.onRender.bind(this));
        this.renderer.emitter.on("renderError", this.updater.handleError.bind(this.updater));
        this.updater.emitter.on("tokenExpired", () => {
            this.setNode(null);
            this.emitter.emit("inactivity");
        });
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
        ) this.updater.setTarget(interaction);
    }

    private async onRender(container: HostContainer) {
        if (!container.node) return;
        
        try {
            let builder = new PayloadBuilder(this.prefixCustomId.bind(this));
            let payload = builder.createMessage(container.node);
            this.events = builder.eventHandlers;
            this.updater.setFlags(payload.flags);
            this.updater.updateMessageDebounced(payload.options);
        } catch (e) {
            this.updater.handleError(e as Error);
        };
    }

    disable() {
        return this.updater.disable();
    }
}
