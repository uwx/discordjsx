import type {  BaseChannel, ButtonInteraction, ChannelSelectMenuInteraction, ChatInputCommandInteraction, MentionableSelectMenuInteraction, Message, ModalSubmitInteraction, RoleSelectMenuInteraction, SendableChannels, StringSelectMenuInteraction, TextBasedChannel, User, UserSelectMenuInteraction } from "discord.js";

export const INTERACTION_TOKEN_EXPIRY = 15 * 60 * 1000;
export const INTERACTION_REPLY_EXPIRY = 3 * 1000;

export type MessageUpdateable =
    | ChatInputCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction
    | RoleSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | ModalSubmitInteraction
    | (BaseChannel & TextBasedChannel & SendableChannels)
    | Message
    | User;
