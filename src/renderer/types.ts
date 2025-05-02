import { AnySelectMenuInteraction, BaseMessageOptions, ButtonInteraction } from "discord.js";
import { DJSXEventHandler } from "../types/index.js";

export type DJSXRendererEventMap = {
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component" | "message" | "channelReply") => void;
};

export interface IComponentEventHandler {
    addButtonHandler: (callback: DJSXEventHandler<void, ButtonInteraction>) => void;
    addSelectHandler: (callback: DJSXEventHandler<string[], AnySelectMenuInteraction>) => void;
};

export type DJSXRendererOptions = {
    events: IComponentEventHandler;
    deferAfter?: number;
    disableAfter?: number;
    createErrorMessage?: (error: Error) => BaseMessageOptions;
};
