export type DJSXRendererEventMap = {
    error: (e: Error) => void;
    fatalError: (e: Error) => void;
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component" | "message" | "channelReply") => void;
};
