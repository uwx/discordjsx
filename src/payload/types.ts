import type { APIModalInteractionResponseCallbackData, BaseMessageOptions, MessageFlags } from "discord.js";
import { DJSXEventHandlerMap } from "src/types/events";

export type InteractionMessageFlags = MessageFlags.Ephemeral
    | MessageFlags.SuppressEmbeds
    | MessageFlags.SuppressNotifications
    | MessageFlags.IsComponentsV2;

export type MessagePayloadOutput = {
    payload: BaseMessageOptions;
    flags: InteractionMessageFlags[];
    eventHandlers: Pick<DJSXEventHandlerMap, "button" | "select">;
};

export type ModalPayloadOutput = {
    payload: APIModalInteractionResponseCallbackData;
    eventHandlers: Pick<DJSXEventHandlerMap, "modalSubmit">;
};
