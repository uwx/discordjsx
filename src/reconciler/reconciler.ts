import { version } from "react";
import ReactReconciler from "react-reconciler";
import { InternalHostConfig } from "./HostConfig.js";

export const reconciler = ReactReconciler(InternalHostConfig as any);

// why not -deniz
reconciler.injectIntoDevTools({
    bundleType: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ? 1 : 0,
    rendererPackageName: "discordjsx",
    version: version,
});
