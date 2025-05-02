import { AnySelectMenuInteraction, BaseChannel, BaseMessageOptions, ButtonInteraction, ChatInputCommandInteraction, Message, ModalSubmitInteraction, SendableChannels, TextBasedChannel, User } from "discord.js";
import { DJSXEventHandler } from "../types";

export type DJSXRendererEventMap = {
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component") => void;
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
