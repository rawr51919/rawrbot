import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, User } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user")
    .addUserOption(opt =>
      opt
        .setName("target")
        .setDescription("The user to get information about")
        .setRequired(true)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply({ ephemeral: true });

    const user: User = interaction.options.getUser("target", true);

    const embed = new EmbedBuilder()
      .setTitle(`User Info for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 1024 }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Created At", value: user.createdAt.toLocaleString(), inline: true },
        { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Avatar URL", value: user.displayAvatarURL(), inline: false },
        { name: "Global Name", value: user.globalName || "Not Set", inline: true }
      );

    await interaction.editReply({ content: "Here's some info:", embeds: [embed] });
  },
};
