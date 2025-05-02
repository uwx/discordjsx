import { type BaseChannel, type ChatInputCommandInteraction, Collection, type Interaction, type Message, type ModalSubmitInteraction, type SendableChannels, type TextBasedChannel } from "discord.js";
import { DJSXRenderer } from "../renderer";
import type { ReactNode } from "react";
import { v4 } from "uuid";

export class DJSXRendererManager {
    renderers: Collection<string, DJSXRenderer> = new Collection();

    constructor() {}

    create(
        interaction: ChatInputCommandInteraction | ModalSubmitInteraction | (BaseChannel & TextBasedChannel & SendableChannels) | Message,
        node?: ReactNode,
    ) {
        const renderer = new DJSXRenderer(
            interaction,
            node,
        );

        renderer.on("inactivity", () => {
            renderer.setNode(null);
            this.renderers.delete(renderer.key!);
        });

        this.add(renderer);

        return renderer;
    }
    
    add(renderer: DJSXRenderer) {
        if(!renderer.key) renderer.key = v4();
        this.renderers.set(renderer.key, renderer);
    };

    dispatchInteraction(int: Interaction) {
        this.renderers.forEach((renderer) => renderer.dispatchInteraction(int));
    }
}
