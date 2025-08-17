import { ChatInputCommandInteraction, SlashCommandBuilder, ActivityType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("activity")
    .setDescription("Set the bot's Rich Presence status (owner only)")
    .addStringOption(opt =>
      opt
        .setName("type")
        .setDescription("Type of activity")
        .setRequired(true)
        .setChoices(
          { name: "Playing", value: "PLAYING" },
          { name: "Streaming", value: "STREAMING" },
          { name: "Listening", value: "LISTENING" },
          { name: "Watching", value: "WATCHING" },
          { name: "Competing", value: "COMPETING" }
        )
    )
    .addStringOption(opt =>
      opt
        .setName("text")
        .setDescription("Status text")
        .setRequired(true)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {

    // Fetch dynamic owner ID
    const app = await interaction.client.application?.fetch();
    const ownerId = app?.owner?.id;

    if (interaction.user.id !== ownerId) {
      await interaction.editReply({ content: "❌ Only the bot owner can use this command." });
      return;
    }

    const typeString = interaction.options.getString("type", true);
    const text = interaction.options.getString("text", true);

    const type = typeString as unknown as ActivityType;

    try {
      interaction.client.user?.setPresence({
        activities: [{ name: text, type }],
        status: "online",
      });

      await interaction.reply({ content: `✅ Status updated to: ${type} **${text}**`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to update status: ${(err as Error).message}`, ephemeral: true });
    }
  },
};
