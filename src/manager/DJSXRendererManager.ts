import { Collection, type Interaction } from "discord.js";
import { DJSXMessageRenderer, DJSXModalRenderer, type DJSXRendererOptions } from "../renderer/index.js";
import type { ReactNode } from "react";
import type { MessageUpdateable } from "../updater/types.js";

export class DJSXRendererManager {
    renderers: Collection<string, DJSXMessageRenderer | DJSXModalRenderer> = new Collection();

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

        if (options?.interactible === false) { 
            renderer.emitter.on("inactivity", () => {
                this.renderers.delete(renderer.key!);
            });

            this.add(renderer);
        }

        return renderer;
    }

    async createModal(node?: ReactNode) {
        const renderer = new DJSXModalRenderer(node);

        this.add(renderer);

        return await renderer.promise;
    }
    
    add(renderer: DJSXMessageRenderer | DJSXModalRenderer) {
        this.renderers.set(renderer.key, renderer);
    }

    dispatchInteraction(int: Interaction) {
        for (const renderer of this.renderers.values()) {
            renderer.dispatchInteraction(int);
        }
    }

    disable() {
        return Promise.all(this.renderers.map((renderer) => 'disable' in renderer && renderer.disable()));
    }
}
