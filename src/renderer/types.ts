export type DJSXRendererEventMap = {
    renderError: (e: Error) => void;
    fatalError: (e: Error) => void;
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component") => void;
};
