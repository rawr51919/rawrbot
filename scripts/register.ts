import { configDotenv } from "dotenv";
configDotenv();

import { REST, Routes, SlashCommandBuilder } from "discord.js";
import rawCommands from "../.discraft/commands/index.ts";

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APP_ID;

if (!token) {
  console.error("DISCORD_TOKEN is not set in your environment variables.");
  process.exit(1);
}
if (!applicationId) {
  console.error("DISCORD_APP_ID is not set in your environment variables.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

// Filter to only commands that have a `.data` property of type SlashCommandBuilder
const commands = Object.values(rawCommands).filter(
  (c): c is { data: SlashCommandBuilder; execute: ({ interaction }: { interaction: any }) => Promise<void> } =>
    typeof c === "object" &&
    "data" in c &&
    c.data instanceof SlashCommandBuilder &&
    "execute" in c &&
    typeof c.execute === "function"
);

const commandData = commands.map((cmd) => cmd.data.toJSON());

(async () => {
  try {
    console.log(`Started refreshing ${commandData.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commandData }
    );

    console.log(`Successfully reloaded ${(data as any[]).length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
