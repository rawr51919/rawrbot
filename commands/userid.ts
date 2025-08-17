import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userid")
    .setDescription("Find a Discord user by their ID.")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("The Discord user ID to look up")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("id", true);

    // Validate the ID (Discord IDs are 17-19 digits)
    const idRegex = /^\d{17,19}$/;
    if (!idRegex.test(userId)) {
      await interaction.reply({
        content: "Invalid user ID. Please provide a valid Discord user ID.",
        ephemeral: true,
      });
      return;
    }

    try {
      const user = await interaction.client.users.fetch(userId);

      if (user) {
        await interaction.reply(`Found user: <@${user.id}> (${user.tag}).`);
      } else {
        await interaction.reply({
          content: "User not found in this bot's cache.",
          ephemeral: true,
        });
      }
    } catch (err) {
      await interaction.reply({
        content: "User not found or invalid ID. " + err,
        ephemeral: true,
      });
    }
  },
};
