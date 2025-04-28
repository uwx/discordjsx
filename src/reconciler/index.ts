import Reconciler, { type OpaqueRoot } from "react-reconciler";
import { InternalHostConfig } from "./HostConfig";
import type { HostContainer, InternalNode } from "./types";
import { ConcurrentRoot } from "react-reconciler/constants.js";
import EventEmitter from "node:events";
import type TypedEmitter from "typed-emitter";
import { version } from "react";

export * from "./types";

export const reconciler = Reconciler(InternalHostConfig);

// why not -deniz
reconciler.injectIntoDevTools({
    bundleType: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ? 1 : 0,
    rendererPackageName: "discordjsx",
    version: version,
});

export type JSXRendererEventMap = {
    render: (container: HostContainer) => void;
    renderError: (e: Error) => void;
    containerUpdated: () => void;
};

export class JSXRenderer extends (EventEmitter as new () => TypedEmitter<JSXRendererEventMap>) {
    container: HostContainer;
    private fiberRoot: OpaqueRoot;

    constructor() {
        super();

        this.container = {
            node: null,
            onRender: () => this.emit("render", this.container),
        };

        this.fiberRoot = reconciler.createContainer(
            this.container,
            ConcurrentRoot,
            null,
            false,
            null,
            "discordjsx",
            (e) => this.emit("renderError", e),
            null
        );
    }

    setRoot(node: React.ReactNode) {
        reconciler.updateContainer(node, this.fiberRoot, null, () => {
            this.emit("containerUpdated");
        });
    }

    static renderOnce(node: React.ReactNode) {
        return new Promise<InternalNode | null>((res) => {
            let renderer = new JSXRenderer();
            renderer.on("render", (continer) => {
                res(continer.node);
            });
            renderer.setRoot(node);
        });
    }
};
