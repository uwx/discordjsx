import { type ChatInputCommandInteraction, Collection, type Interaction, type ModalSubmitInteraction } from "discord.js";
import { DJSXRenderer, type DJSXRendererOptions } from "../renderer/index.js";
import type { ReactNode } from "react";
import type { MessageUpdateable } from "../updater/types.js";

export class DJSXRendererManager {
    renderers: Collection<string, DJSXRenderer> = new Collection();

    create(
        interaction: MessageUpdateable,
        node?: ReactNode,
        key?: string,
        options?: DJSXRendererOptions,
    ) {
        const renderer = new DJSXRenderer(
            interaction,
            node,
            key,
            options,
        );

        renderer.emitter.on("inactivity", () => {
            this.renderers.delete(renderer.key!);
        });

        this.add(renderer);

        return renderer;
    }
    
    add(renderer: DJSXRenderer) {
        this.renderers.set(renderer.key, renderer);
    }

    dispatchInteraction(int: Interaction) {
        for (const renderer of this.renderers.values()) {
            renderer.dispatchInteraction(int);
        }
    }

    disable() {
        return Promise.all(this.renderers.map((renderer) => renderer.disable()));
    }
}
