import { type BaseChannel, type ChatInputCommandInteraction, Collection, type Interaction, type Message, type ModalSubmitInteraction, type SendableChannels, type TextBasedChannel, type User } from "discord.js";
import { DJSXRenderer, type MessageUpdateableInteraction } from "../renderer";
import type { ReactNode } from "react";
import { v4 } from "uuid";

export class DJSXRendererManager {
    renderers: Collection<string, DJSXRenderer> = new Collection();

    constructor() {}

    create(
        interaction: MessageUpdateableInteraction,
        node?: ReactNode,
        options?: { disableInteractivity?: boolean },
    ) {
        const renderer = new DJSXRenderer(
            interaction,
            node,
            undefined,
            options,
        );

        if (!options?.disableInteractivity) {
            renderer.on("inactivity", () => {
            	this.renderers.delete(renderer.key!);
            });

            this.add(renderer);
        }

        return renderer;
    }
    
    add(renderer: DJSXRenderer) {
        if(!renderer.key) renderer.key = v4();
        this.renderers.set(renderer.key, renderer);
    };

    dispatchInteraction(int: Interaction) {
        this.renderers.forEach((renderer) => renderer.dispatchInteraction(int));
    }

    disable() {
        return Promise.all(this.renderers.map((renderer) => renderer.disable()));
    }
}
