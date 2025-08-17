import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Shows information about this server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const owner = await guild.fetchOwner(); // fetch full owner info

    const embed: any = {
      title: `Server Info: ${guild.name}`,
      thumbnail: { url: guild.iconURL({ extension: "png", size: 1024 }) ?? undefined },
      fields: [
        { name: "Server Name", value: guild.name, inline: true },
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Owner", value: owner.user.tag, inline: true },
        { name: "Created On", value: guild.createdAt.toLocaleString(), inline: true },
        { name: "Members", value: guild.memberCount.toString(), inline: true },
        { name: "Bots", value: guild.members.cache.filter((m: any) => m.user.bot).size.toString(), inline: true },
        { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
        { name: "Emojis", value: guild.emojis.cache.size.toString(), inline: true },
        { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
        { name: "Features", value: guild.features.join(", ") || "None" },
      ],
      footer: { text: `Server ID: ${guild.id}` },
    };

    await interaction.editReply({ content: `Here's the info for **${guild.name}**:`, embeds: [embed] });
  },
};
