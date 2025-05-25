import { AttachmentPayload, Interaction } from "discord.js";
import { v4 } from "uuid";
import { createNanoEvents } from "nanoevents";
import { DJSXRendererEventMap } from "./types.js";
import { HostContainer, JSXRenderer } from "../reconciler/index.js";
import { DJSXEventHandlerMap } from "../types/index.js";
import { MessageUpdater, MessageUpdateable } from "../updater/index.js";
import { PayloadBuilder } from "../payload/index.js";
import { inspect } from "node:util";
import { resolveFile } from "../utils/resolve.js";

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
        } else if ('isAnySelectMenu' in interaction ? interaction.isAnySelectMenu() : interaction.isSelectMenu()) {
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
        console.log('onRender', inspect(container, { depth: Infinity }));
        if (!container.node) return;
        
        try {
            const payload = new PayloadBuilder(this.prefixCustomId.bind(this))
                .createMessage(container.node);
            this.events = payload.eventHandlers;
            this.updater.setFlags(payload.flags);

            // TODO: don't re-upload files from last message version
            const files: AttachmentPayload[] = [];
            for (const [name, attachment] of payload.attachments) {
                files.push({
                    name,
                    attachment: await resolveFile(attachment),
                });
            }

            this.updater.updateMessageDebounced({
                ...payload.options,
                files
            });
        } catch (e) {
            this.updater.handleError(e as Error);
        };
    }

    disable() {
        return this.updater.disable();
    }
}
