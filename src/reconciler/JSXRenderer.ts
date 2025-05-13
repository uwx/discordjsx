import { OpaqueRoot } from "react-reconciler";
import { HostContainer, InternalNode } from "./types.js";
import { createNanoEvents } from "nanoevents";
import { ConcurrentRoot } from "react-reconciler/constants.js";
import { reconciler } from "./reconciler.js";

export type JSXRendererEventMap = {
    render: (container: HostContainer) => void;
    renderError: (e: Error) => void;
    caughtError: (e: Error) => void;
    recoverableError: (e: Error) => void;
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

        // WARNING: Typings are outdeated
        this.fiberRoot = (reconciler.createContainer as any)(
            // containerInfo: Container
            this.container,
            // tag: RootTag
            ConcurrentRoot,
            // hydrationCallbacks: null | SuspenseHydrationCallbacks<SuspenseInstance>
            null,
            // isStrictMode: boolean
            false,
            // concurrentUpdatesByDefaultOverride: null | boolean
            null,
            // identifierPrefix: string
            "discordjsx",
            // onUncaughtError: (error: Error) => void
            (e: Error, errorInfo: React.ErrorInfo) => this.emitter.emit("renderError", e),
            // onCaughtError: (error: Error) => void
            (e: Error, errorInfo: React.ErrorInfo) => this.emitter.emit("caughtError", e),
            // onRecoverableError: (error: Error) => void
            (e: Error, errorInfo: React.ErrorInfo) => this.emitter.emit("recoverableError", e),
            // onDefaultTransitionIndicator: () => (void | (() => void))
            () => {},
            // transitionCallbacks: null | TransitionTracingCallbacks
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
