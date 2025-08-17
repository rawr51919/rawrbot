import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the bot's invite link."),

  async execute(interaction: ChatInputCommandInteraction) {
    // Replace the client ID and permissions as needed
    const clientId = interaction.client.user?.id;
    const inviteLink = clientId
      ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`
      : "Bot ID not found.";

    await interaction.reply(inviteLink);
  },
};
