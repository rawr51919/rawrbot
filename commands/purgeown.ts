import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Message,
  TextChannel,
  NewsChannel,
  BaseGuildTextChannel,
  DMChannel,
} from "discord.js";
import type { PartialDMChannel } from "discord.js"; // type-only import

export default {
  data: new SlashCommandBuilder()
    .setName("purgeown")
    .setDescription("Delete a number of the bot's own messages from this channel/DM/group DM")
    .addIntegerOption(opt =>
      opt
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    const amount = interaction.options.getInteger("amount", true);
    const channel = interaction.channel;

    if (!channel) {
      await interaction.reply({ content: "❌ Could not access this channel.", ephemeral: true });
      return;
    }

    const isDMChannel = channel instanceof DMChannel || (channel as PartialDMChannel).type === 1;
    const isGuildTextChannel = channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof BaseGuildTextChannel;

    if (!isDMChannel && !isGuildTextChannel) {
      await interaction.reply({ content: "❌ This command can only be used in text channels or DMs.", ephemeral: true });
      return;
    }

    let remaining = amount;
    let deletedCount = 0;

    const replyMsg = await interaction.reply({ content: `🗑️ Deleting ${amount} messages...`, ephemeral: true, fetchReply: true });

    try {
      while (remaining > 0) {
        const fetchLimit = remaining > 100 ? 100 : remaining;
        const messages = await channel.messages.fetch({ limit: fetchLimit });
        const botMessages = messages.filter(msg => msg.author.id === interaction.client.user?.id);

        if (!botMessages.size) break;

        const now = Date.now();
        const toDeleteRecent: Message[] = [];
        const toDeleteOld: Message[] = [];

        for (const msg of botMessages.values()) {
          const ageMs = now - msg.createdTimestamp;
          if (ageMs < 14 * 24 * 60 * 60 * 1000) {
            toDeleteRecent.push(msg);
          } else {
            toDeleteOld.push(msg);
          }
        }

        // Bulk delete recent messages
        if (toDeleteRecent.length > 1 && isGuildTextChannel) {
          await (channel).bulkDelete(toDeleteRecent, true);
        } else {
          for (const msg of toDeleteRecent) {
            await msg.delete().catch(() => {});
          }
        }

        // Single-delete old messages with a small delay to avoid rate limits
        for (const msg of toDeleteOld) {
          await msg.delete().catch(() => {});
          await new Promise(res => setTimeout(res, 200)); // 200ms delay between deletions
        }

        const totalDeleted = toDeleteRecent.length + toDeleteOld.length;
        deletedCount += totalDeleted;
        remaining -= totalDeleted;

        await replyMsg.edit(`🗑️ Deleted ${deletedCount} of ${amount} messages...`);

        if (totalDeleted < fetchLimit) break;
      }

      await replyMsg.edit(`✅ Finished deleting ${deletedCount} of the bot's messages.`);
    } catch (err) {
      console.error(err);
      await replyMsg.edit("❌ Failed to delete some messages. Check permissions and message age.");
    }
  },
};
