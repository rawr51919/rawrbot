import { ChatInputCommandInteraction, SlashCommandBuilder, ActivityType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Set the bot's custom status text with optional emoji")
    .addStringOption(opt =>
      opt
        .setName("text")
        .setDescription("Custom status text")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("emoji")
        .setDescription("Optional emoji to prepend to the custom status")
        .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    const ownerId = interaction.client.application?.owner?.id;
    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: "❌ Only the bot owner can set a custom status.", ephemeral: true });
      return;
    }

    const text = interaction.options.getString("text", true);
    const emoji = interaction.options.getString("emoji") ?? "";

    // Set custom status only, without affecting online presence
    interaction.client.user?.setPresence({
      activities: [
        {
          name: `${emoji} ${text}`.trim(),
          type: ActivityType.Custom,
        },
      ],
    });

    await interaction.reply({
      content: `✅ Custom status set: "${emoji} ${text}".`,
      ephemeral: true,
    });
  },
};
