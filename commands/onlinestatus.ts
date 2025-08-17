import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { PresenceStatusData } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("onlinestatus")
    .setDescription("Change the bot's Discord presence status (owner only)")
    .addStringOption(opt =>
      opt
        .setName("onlinestatus")
        .setDescription("Presence status")
        .setRequired(true)
        .setChoices(
          { name: "Online", value: "online" },
          { name: "Idle", value: "idle" },
          { name: "Do Not Disturb", value: "dnd" },
          { name: "Invisible", value: "invisible" }
        )
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply({ ephemeral: true });

    const app = await interaction.client.application?.fetch();
    const ownerId = app?.owner?.id;

    if (interaction.user.id !== ownerId) {
      await interaction.editReply({ content: "❌ Only the bot owner can use this command." });
      return;
    }

    const status = interaction.options.getString("status", true) as PresenceStatusData;

    try {
      interaction.client.user?.setStatus(status);
      await interaction.editReply({ content: `✅ Bot status updated to **${status}**` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to update status: ${(err as Error).message}` });
    }
  },
};
