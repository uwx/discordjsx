import type { APIModalInteractionResponseCallbackData, BaseMessageOptions, MessageFlags } from "discord.js";

export type PayloadBuilderOptions = {
    disabled?: boolean;
};

export type InteractionMessageFlags = MessageFlags.Ephemeral
    | MessageFlags.SuppressEmbeds
    | MessageFlags.SuppressNotifications
    | MessageFlags.IsComponentsV2;

export type MessagePayloadOutput = {
    options: BaseMessageOptions;
    flags: InteractionMessageFlags[];
};

export type ModalPayloadOutput = {
    payload: APIModalInteractionResponseCallbackData;
};
