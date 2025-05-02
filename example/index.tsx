import "dotenv/config";
import { Client, Events } from "discord.js";
import { DJSXRendererManager } from "../src";
import { Counter } from "./counter";
import React from "react";

const client = new Client({
    intents: [],
});

client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag} !`);
});

const djsx = new DJSXRendererManager();

client.on(Events.InteractionCreate, (interaction) => {
    if(interaction.isChatInputCommand()) {
        djsx.create(interaction, <Counter />);
    } else {
        djsx.dispatchInteraction(interaction);
    }
});

client.login(process.env.TOKEN);

const beforeExit = () => {
    djsx.disable()
        .catch(e => console.log(e))
        .finally(() => process.exit(0));
};

process.on("SIGTERM", beforeExit);
process.on("SIGINT", beforeExit);
