import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("botpfp")
    .setDescription("Change the bot's profile picture")
    .addStringOption(opt =>
      opt
        .setName("url")
        .setDescription("URL of the new avatar image")
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt
        .setName("file")
        .setDescription("Upload a file to set as the new avatar")
        .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    const ownerId = interaction.client.application?.owner?.id;

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: "❌ Only the bot owner can change the avatar.",
        ephemeral: true,
      });
      return;
    }

    const attachment = interaction.options.getAttachment("file");
    const url = attachment?.url ?? interaction.options.getString("url");

    if (!url) {
      await interaction.reply({
        content: "❌ You must provide either a URL or an attachment.",
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.client.user?.setAvatar(url);
      await interaction.reply({
        content: `✅ Bot avatar updated successfully!`,
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "❌ Failed to update avatar. Make sure the URL or file is valid and points to an image.",
        ephemeral: true,
      });
    }
  },
};
