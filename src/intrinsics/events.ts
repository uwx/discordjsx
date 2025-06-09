import type { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, Snowflake } from "discord.js";
import type { DJSXForm } from "./form.js";

export type DJSXEventHandler<TValue, TInteraction> = TValue extends void ? (
    (interaction: TInteraction) => any
) : (
    (value: TValue, interaction: TInteraction) => any
);

export type DJSXEventHandlerMap = {
    button: Map<string, DJSXEventHandler<void, ButtonInteraction>>;
    select: Map<string, DJSXEventHandler<Snowflake[], AnySelectMenuInteraction>>;
    modalSubmit: Map<string, DJSXEventHandler<DJSXForm, ModalSubmitInteraction>>;
};
