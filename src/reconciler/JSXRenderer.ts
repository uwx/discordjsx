import { OpaqueRoot } from "react-reconciler";
import { HostContainer, InternalNode } from "./types";
import { createNanoEvents } from "nanoevents";
import { ConcurrentRoot } from "react-reconciler/constants";
import { reconciler } from "./reconciler";

export type JSXRendererEventMap = {
    render: (container: HostContainer) => void;
    renderError: (e: Error) => void;
    containerUpdated: () => void;
};

export class JSXRenderer {
    container: HostContainer;
    private fiberRoot: OpaqueRoot;

    emitter = createNanoEvents<JSXRendererEventMap>();

    constructor() {
        this.container = {
            node: null,
            onRender: () => this.emitter.emit("render", this.container),
        };

        this.fiberRoot = reconciler.createContainer(
            this.container,
            ConcurrentRoot,
            null,
            false,
            null,
            "discordjsx",
            (e) => this.emitter.emit("renderError", e),
            null
        );
    }

    setRoot(node: React.ReactNode) {
        reconciler.updateContainer(node, this.fiberRoot, null, () => {
            this.emitter.emit("containerUpdated");
        });
    }

    static renderOnce(node: React.ReactNode) {
        return new Promise<InternalNode | null>((res) => {
            let renderer = new JSXRenderer();
            renderer.emitter.on("render", (continer) => {
                res(continer.node);
            });
            renderer.setRoot(node);
        });
    }
};
