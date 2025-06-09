import { type AttachmentPayload, type Interaction, MessageFlags, type SelectMenuInteraction } from "discord.js";
import { v4 } from "uuid";
import { createNanoEvents, Unsubscribe } from "nanoevents";
import type { DJSXMessageRendererEventMap, DJSXRendererOptions } from "./types.js";
import { type InternalNode, JSXRenderer } from "../reconciler/index.js";
import { MessageUpdater, REPLY_TIMEOUT, type MessageUpdateable } from "../updater/index.js";
import { PayloadBuilder } from "../payload/index.js";
import { resolveFile } from "../utils/resolve.js";
import { defaultLog } from "../utils/log.js";
import { DJSXEventHandlerMap } from "../intrinsics/events.js";

abstract class AbstractDJSXRenderer {
    private renderer = new JSXRenderer();

    protected abstract onRender(node: InternalNode | null): unknown;
    protected abstract onError(error: Error): unknown;

    constructor(
        node?: React.ReactNode,
        readonly key = v4(),
    ) {
        this.node = node;
        
        this.renderer.on("render", (container, node) => this.onRender(node));
        this.renderer.on("renderError", error => this.onError(error));
    }
    
    private _node: React.ReactNode = null;
    
    set node(node: React.ReactNode) {
        this._node = node;
        this.renderer.setRoot(this.node);
    }

    get node() {
        return this._node;
    }

    protected get prefixCustomId() {
        return `djsx:${this.key || "auto"}`;
    }
}

export class DJSXMessageRenderer extends AbstractDJSXRenderer {
    private events: DJSXEventHandlerMap = {
        button: new Map(),
        select: new Map(),
        modalSubmit: new Map(),
    };

    emitter = createNanoEvents<DJSXMessageRendererEventMap>();

    updater: MessageUpdater;

    interactible: boolean;

    private readonly log: (level: "message" | "warn" | "error" | "trace", category: string, message: string, ...args: any[]) => void;
    private readonly defaultFlags: MessageFlags[];

    constructor(
        interaction: MessageUpdateable,
        node?: React.ReactNode,
        {
            key = v4(),
            interactible = true,
            defaultFlags = [MessageFlags.IsComponentsV2],
            deferAfter = REPLY_TIMEOUT,
            disableAfter,
            createErrorMessage,
            log = defaultLog
        }: DJSXRendererOptions = {},
    ) {
        super(node, key);
        this.updater = new MessageUpdater(interaction, defaultFlags, deferAfter, disableAfter, createErrorMessage, log);

        this.log = log;
        this.defaultFlags = defaultFlags;
        
        this.interactible = interactible;

        this.updater.emitter.on("tokenExpired", () => {
            this.node = null;
            this.emitter.emit("inactivity");
        });
        this.updater.emitter.on('timeout', () => {
            this.node = null;
            this.emitter.emit('inactivity');
        });
    }

    async dispatchInteraction(interaction: Interaction) {
        if (this.key
            && "customId" in interaction
            && !interaction.customId.startsWith(this.prefixCustomId)
        ) {
            return;
        }

        if (!this.interactible) {
            return;
        }

        if (interaction.isButton()) {
            const cb = this.events.button.get(interaction.customId);
            cb?.(interaction);
        } else if ('isAnySelectMenu' in interaction
            ? interaction.isAnySelectMenu() // discord.js@14
            : (interaction as any).isSelectMenu() // discord.js@15
        ) {
            const cb = this.events.select.get((interaction as SelectMenuInteraction).customId);
            cb?.((interaction as SelectMenuInteraction).values, (interaction as SelectMenuInteraction));
        }

        if (interaction.isMessageComponent() || (interaction.isModalSubmit() && interaction.isFromMessage())) {
            this.updater.target = interaction;
        }
    }

    protected async onError(error: Error) {
        this.updater.handleError(error);
    }

    protected async onRender(node: InternalNode | null) {
        if (!node) return;

        this.log('trace', 'jsx/renderer', 'Rendering node', node);
        
        try {
            const payload = PayloadBuilder.createMessage(this.prefixCustomId, this.defaultFlags, node)
            this.events = payload.eventHandlers;

            // TODO: don't re-upload files from last message version
            const files: AttachmentPayload[] = [];
            for (const [name, attachment] of payload.attachments) {
                files.push({
                    name,
                    attachment: await resolveFile(attachment),
                });
            }

            await this.updater.updateMessage(payload.flags, { ...payload.options, files });
        } catch (e) {
            this.updater.handleError(e as Error);
        };
    }

    on<K extends keyof DJSXMessageRendererEventMap>(event: K, cb: DJSXMessageRendererEventMap[K]): Unsubscribe {
        return this.emitter.on(event, cb);
    }

    async disable() {
        return await this.updater.disable();
    }
}
