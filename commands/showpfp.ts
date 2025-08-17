import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("showicon")
    .setDescription("Shows the avatar/icon for a user, server, or group DM")
    .addUserOption(opt =>
      opt.setName("user").setDescription("Show this user's avatar").setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user");
    let imageUrl: string | null = null;
    let title = "";

    // User avatar
    if (targetUser) {
      imageUrl = targetUser.displayAvatarURL({
        size: 1024,
        extension: targetUser.displayAvatarURL().endsWith(".gif") ? "gif" : "png"
      });
      title = `${targetUser.tag}'s Avatar`;
    }
    // Server icon
    else if (interaction.guild) {
      const guildIcon = interaction.guild.icon;
      if (!guildIcon) {
        await interaction.editReply("ℹ️ This server has no icon set.");
        return;
      }
      imageUrl = interaction.guild.iconURL({
        size: 1024,
        extension: guildIcon.startsWith("a_") ? "gif" : "png"
      });
      title = `${interaction.guild.name} Server Icon`;
    }
    // Group DM
    else if (interaction.channel?.type === ChannelType.GroupDM) {
      const groupChannel = interaction.channel;
      const icon = (groupChannel as any).icon;
      if (!icon) {
        await interaction.editReply("ℹ️ This group DM has no icon set.");
        return;
      }
      imageUrl = (groupChannel as any).iconURL({
        size: 1024,
        extension: icon.startsWith("a_") ? "gif" : "png"
      });
      title = "Group DM Icon";
    }
    else {
      await interaction.editReply("❌ Could not find an avatar/icon to display.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setImage(imageUrl);

    await interaction.editReply({ embeds: [embed] });
  },
};
