import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, User } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Get information about a bot (this bot or another bot)")
    .addUserOption(opt =>
      opt
        .setName("bot")
        .setDescription("Select a bot (defaults to this bot)")
        .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply({ ephemeral: true });

    const selectedUser: User | null = interaction.options.getUser("bot") ?? interaction.client.user;
    if (!selectedUser) {
      await interaction.editReply("❌ Could not find the bot.");
      return;
    }

    if (!selectedUser.bot) {
      await interaction.editReply("❌ That user is not a bot.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Bot Info for ${selectedUser.tag}`)
      .setThumbnail(selectedUser.displayAvatarURL({ size: 1024 }))
      .addFields(
        { name: "ID", value: selectedUser.id, inline: true },
        { name: "Created At", value: selectedUser.createdAt.toLocaleString(), inline: true },
        { name: "Bot?", value: "Yes", inline: true }
      );

    // Guild-specific info
    if (interaction.guild) {
      const member = await interaction.guild.members.fetch(selectedUser.id).catch(() => null);
      if (member) {
        embed.addFields(
          { name: "Server Join Date", value: member.joinedAt?.toLocaleString() ?? "Unknown", inline: true },
          { name: "Nickname", value: member.nickname ?? "None", inline: true },
          { name: "Roles", value: member.roles.cache.size > 1 ? member.roles.cache.map(r => r.name).join(", ") : "None", inline: false }
        );
      }
    }

    // Uptime and ping (only for this bot)
    if (selectedUser.id === interaction.client.user?.id) {
      const uptimeSeconds = Math.floor(interaction.client.uptime / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;

      embed.addFields(
        {
          name: "Uptime",
          value: `${hours}h ${minutes}m ${seconds}s`,
          inline: true
        },
        {
          name: "Ping",
          value: `${interaction.client.ws.ping}ms`,
          inline: true
        }
      );
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
