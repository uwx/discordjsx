import { ChatInputCommandInteraction, Collection, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, type Interaction } from "discord.js";
import { DJSXMessageRenderer, type DJSXRendererOptions } from "../renderer/index.js";
import type { ReactNode } from "react";
import type { MessageUpdateable } from "../updater/types.js";
import { JSXRenderer } from "../reconciler/JSXRenderer.js";
import { PayloadBuilder } from "../payload/PayloadBuilder.js";
import { v4 } from "uuid";
import { DJSXEventHandler } from "../intrinsics/events.js";
import { DJSXForm } from "../intrinsics/form.js";

export class DJSXRendererManager {
    renderers: Collection<string, DJSXMessageRenderer> = new Collection();
    private modalListeners: Collection<string, DJSXEventHandler<Record<string, string>, ModalSubmitInteraction>> = new Collection();

    create(
        interaction: MessageUpdateable,
        node?: ReactNode,
        options?: DJSXRendererOptions,
    ) {
        const renderer = new DJSXMessageRenderer(
            interaction,
            node,
            options,
        );

        if (options?.interactible !== false) { 
            renderer.emitter.on("inactivity", () => {
                this.remove(renderer);
            });

            this.add(renderer);
        }

        return renderer;
    }

    async openModal(
        interaction: CommandInteraction | MessageComponentInteraction,
        modal: ReactNode,
        prefixCustomId: string = `djsx:${v4()}`,
    ) {
        const internalNode = await JSXRenderer.renderOnce(modal);
        if(!internalNode) throw new Error("Didn't render anything");
        const { body, eventHandlers } = PayloadBuilder.createModal(prefixCustomId, internalNode);
        await interaction.showModal(body);
        const [customId, callback] = [...eventHandlers.modalSubmit.entries()][0];
        // memory leak? maybe a timeout here
        this.modalListeners.set(customId, (...args) => {
            callback?.(...args);
            // and then maybe a timeout cleanup here idk
        });
        return {
            customId,
            callback,
        };
        // const promise = Promise.withResolvers<{
        //     form: Record<string, string>,
        //     interaction: ModalSubmitInteraction,
        //     timedOut?: undefined,
        // } | { timedOut: true }>();
        
        // renderer.on('error', err => promise.reject(err));
        // renderer.on('modalResponded', (interaction, form) => promise.resolve({ form, interaction }));
        // renderer.on('inactivity', () => {
        //     this.remove(renderer);
        //     promise.resolve({ timedOut: true });
        // });

        // return await promise.promise;
    }

    async awaitModal(
        interaction: CommandInteraction | MessageComponentInteraction,
        modal: ReactNode,
    ) {
        const prefixCustomId: string = `djsx:${v4()}`;
        
    }
    
    add(renderer: DJSXMessageRenderer) {
        this.renderers.set(renderer.key, renderer);
    }

    remove(renderer: DJSXMessageRenderer) {
        this.renderers.delete(renderer.key);
    }

    dispatchInteraction(int: Interaction) {
        for (const renderer of this.renderers.values()) {
            renderer.dispatchInteraction(int);
        }

        if(int.isModalSubmit() && this.modalListeners.has(int.customId)) {
            const callback = this.modalListeners.get(int.customId);
            let form: DJSXForm = {};
            for(let [k,v] of int.fields.fields) form[k] = v.value;
            callback?.(form, int);
            this.modalListeners.delete(int.customId);
        }
    }

    disable() {
        return Promise.all(this.renderers.map((renderer) => 'disable' in renderer && renderer.disable()));
    }
}
