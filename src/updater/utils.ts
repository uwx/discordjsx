import { BaseInteraction, ButtonInteraction, ModalMessageModalSubmitInteraction } from "discord.js";
import { MessageUpdateable } from "./types.js";

export const isUpdateableNeedsReply = (
    interaction: MessageUpdateable
): interaction is ButtonInteraction | ModalMessageModalSubmitInteraction => {
    return (
        interaction instanceof BaseInteraction
        && (
            interaction.isMessageComponent()
            || (interaction.isModalSubmit() && interaction.isFromMessage()) 
        )
    );
};

export const pickMessageFlags = <
    T extends number,
    Allowed extends readonly T[],
>(flags: T[], allowedFlags: Allowed): Allowed[number][] => {
    return flags.filter((flag): flag is Allowed[number] => allowedFlags.includes(flag));
};
