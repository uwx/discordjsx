import type { APIModalInteractionResponseCallbackData, BaseMessageOptions, BufferResolvable, MessageFlags } from "discord.js";
import type { DJSXEventHandlerMap } from "../types/events.js";
import type Stream from "node:stream";

export type MessagePayloadOutput = {
    options: BaseMessageOptions;
    flags: MessageFlags[];
    eventHandlers: DJSXEventHandlerMap;
    attachments: Map<string, BufferResolvable | Stream | Blob | File>;
};

export type ModalPayloadOutput = {
    payload: APIModalInteractionResponseCallbackData;
    eventHandlers: DJSXEventHandlerMap;
};
