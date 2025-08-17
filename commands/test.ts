import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Check if the bot is online."),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("I'm online!");
  },
};
