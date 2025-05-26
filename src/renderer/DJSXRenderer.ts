import type { AttachmentPayload, Interaction, SelectMenuInteraction } from "discord.js";
import { v4 } from "uuid";
import { createNanoEvents } from "nanoevents";
import type { DJSXRendererEventMap, DJSXRendererOptions } from "./types.js";
import { type HostContainer, JSXRenderer } from "../reconciler/index.js";
import type { DJSXEventHandlerMap } from "../types/index.js";
import { MessageUpdater, type MessageUpdateable } from "../updater/index.js";
import { PayloadBuilder } from "../payload/index.js";
import { inspect } from "node:util";
import { resolveFile } from "../utils/resolve.js";
import { defaultLog } from "src/utils/log.js";

export class DJSXRenderer {
    private renderer = new JSXRenderer();
    private events: DJSXEventHandlerMap = {
        button: new Map(),
        select: new Map(),
        modalSubmit: new Map(),
    };

    emitter = createNanoEvents<DJSXRendererEventMap>();

    updater: MessageUpdater;

    interactible: boolean;

    /** Unique per renderer. Used to prevent filenames from being guessable. */
    private readonly fileNameSalt = v4();

    constructor(
        interaction: MessageUpdateable,
        node?: React.ReactNode,
        readonly key = v4(),
        { interactible = true, deferFlags, deferAfter, disableAfter, createErrorMessage, log = defaultLog }: DJSXRendererOptions = {},
    ) {
        this.updater = new MessageUpdater(interaction, deferFlags, deferAfter, disableAfter, createErrorMessage, log);
        this.node = node;
        
        this.interactible = interactible;

        this.renderer.emitter.on("render", container => this.onRender(container));
        this.renderer.emitter.on("renderError", error => this.updater.handleError(error));
        this.updater.emitter.on("tokenExpired", () => {
            this.node = null;
            this.emitter.emit("inactivity");
        });
        this.updater.emitter.on('timeout', () => {
            this.node = null;
            this.emitter.emit('inactivity');
        });
    }

    private _node: React.ReactNode = null;
    
    set node(node: React.ReactNode) {
        this._node = node;
        this.renderer.setRoot(this.node);
    }

    get node() {
        return this._node;
    }

    private get prefixCustomId {
        return `djsx:${this.key || "auto"}`;
    }

    async dispatchInteraction(interaction: Interaction) {
        if (this.key
            && "customId" in interaction
            && !interaction.customId.startsWith(this.prefixCustomId)
        ) return;

        if (!this.interactible) {
            return;
        }

        if (interaction.isButton()) {
            const cb = this.events.button.get(interaction.customId);
            cb?.(interaction);
        } else if ('isAnySelectMenu' in interaction
            ? (interaction as any).isAnySelectMenu() // discord.js@14
            : interaction.isSelectMenu() // discord.js@15
        ) {
            const cb = this.events.select.get((interaction as SelectMenuInteraction).customId);
            cb?.((interaction as SelectMenuInteraction).values, interaction);
        } else if (interaction.isModalSubmit()) {
            const cb = this.events.modalSubmit.get(interaction.customId);
            const form: Record<string, string> = {};
            for (const [name, component] of interaction.fields.fields) {
                form[name] = component.value;
            }
            cb?.(form, interaction);
        };

        if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
            this.updater.target = interaction;
        }
    }

    private async onRender(container: HostContainer) {
        if (!container.node) return;
        
        try {
            const payload = new PayloadBuilder(this.prefixCustomId, this.fileNameSalt)
                .createMessage(container.node);
            this.events = payload.eventHandlers;

            // TODO: don't re-upload files from last message version
            const files: AttachmentPayload[] = [];
            for (const [name, attachment] of payload.attachments) {
                files.push({
                    name,
                    attachment: await resolveFile(attachment),
                });
            }

            this.updater.updateMessage(payload.flags, { ...payload.options, files });
        } catch (e) {
            this.updater.handleError(e as Error);
        };
    }

    async disable() {
        return await this.updater.disable();
    }
}
