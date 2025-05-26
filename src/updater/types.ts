import type { AnySelectMenuInteraction, BaseChannel, ButtonInteraction, ChatInputCommandInteraction, Message, ModalSubmitInteraction, SendableChannels, TextBasedChannel, User } from "discord.js";

export const INTERACTION_TOKEN_EXPIRY = 15 * 60 * 1000;
export const INTERACTION_REPLY_EXPIRY = 3 * 1000;

export type MessageUpdateable =
    | ChatInputCommandInteraction
    | ButtonInteraction
    | AnySelectMenuInteraction
    | ModalSubmitInteraction
    | (BaseChannel & TextBasedChannel & SendableChannels)
    | Message
    | User;
