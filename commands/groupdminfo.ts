import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("groupdminfo")
    .setDescription("Shows information about this group DM"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.channel?.type !== ChannelType.GroupDM) {
      await interaction.reply({
        content: "❌ This command can only be used in a group DM.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;

    // Convert recipients collection to array and get safe display names
    const recipients = Array.from(channel.recipients.values()).map(u => {
      return u.username ?? "<unknown>";
    });

    const embed: any = {
      title: `Group DM Info: ${channel.name || "Unnamed Group DM"}`,
      fields: [
        { name: "Group DM Name", value: channel.name || "Unnamed", inline: true },
        { name: "Group DM ID", value: channel.id, inline: true },
        { name: "Recipients", value: recipients.join(", ") || "None" },
        { name: "Owner ID", value: channel.ownerId ?? "Unknown", inline: true },
      ],
      footer: { text: `Group DM ID: ${channel.id}` },
    };

    await interaction.editReply({
      content: `Here's the info for this group DM:`,
      embeds: [embed],
    });
  },
};
