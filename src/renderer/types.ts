import type { BaseMessageOptions, BaseInteraction, BitFieldResolvable, MessageFlags } from "discord.js";
import type { DJSXRenderer } from "./DJSXRenderer.js";

export type DJSXRendererEventMap = {
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component" | "message" | "channelReply") => void;
};

export type DJSXRendererOptions = {
    /**
     * The amount of time (in milliseconds) to wait before deferring a reply to either a component interaction on the
     * rendered message, or the initial interaction if passing an {@link BaseInteraction} to {@link DJSXRenderer}.
     * 
     * Default: 2 seconds.
     */
    deferAfter?: number;

    /**
     * The amount of time (in milliseconds) to wait before disabling components on the message.
     * 
     * Default: none.
     */
    disableAfter?: number;

    createErrorMessage?: (error: Error) => BaseMessageOptions;

    log?: (level: 'message' | 'warn' | 'error', category: string, message: string, ...args: any[]) => void;
    
    /**
     * Whether to respond to interaction events tied to components in the message.
     * 
     * Default: `true`
     */
    interactible?: boolean;

    /**
     * Message flags to respond with if the component doesn't render a <message> element in time to respond to the
     * interaction.
     * 
     * Default: `MessageFlags.IsComponentsV2`
     */
    deferFlags?: (MessageFlags.Ephemeral | MessageFlags.IsComponentsV2)[];
};
