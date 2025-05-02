import { AnySelectMenuInteraction, ButtonInteraction } from "discord.js";
import { DJSXEventHandler } from "src/types";

export type DJSXRendererEventMap = {
    inactivity: () => void;
    updatedMessage: (using: "reply" | "interaction" | "component") => void;
};

export interface IComponentEventHolder {
    addButtonHandler: (callback: DJSXEventHandler<void, ButtonInteraction>) => void;
    addSelectHandler: (callback: DJSXEventHandler<string[], AnySelectMenuInteraction>) => void;
};
