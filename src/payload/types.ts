import type { APIModalInteractionResponseCallbackData, BaseMessageOptions, MessageFlags } from "discord.js";

export type PayloadBuilderOptions = {
    disabled?: boolean;
};

export type MessagePayloadOutput = {
    options: BaseMessageOptions;
    flags: MessageFlags[];
};

export type ModalPayloadOutput = {
    payload: APIModalInteractionResponseCallbackData;
};
