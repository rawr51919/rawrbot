import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel,
  NewsChannel,
  BaseGuildTextChannel,
  DMChannel,
  ChannelType,
} from "discord.js";
import type { PartialDMChannel, PartialGroupDMChannel } from "discord.js";
import { messageEdits } from "../index";

function isMessageCapableChannel(
  channel: any
): channel is TextChannel | NewsChannel | BaseGuildTextChannel | DMChannel | PartialDMChannel | PartialGroupDMChannel {
  return (
    channel &&
    ((channel instanceof TextChannel) ||
      (channel instanceof NewsChannel) ||
      (channel instanceof BaseGuildTextChannel) ||
      (channel instanceof DMChannel) ||
      (channel.type === ChannelType.DM) ||
      (channel.type === ChannelType.GroupDM))
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("showmessage")
    .setDescription("Show a message's content including its edits")
    .addStringOption(opt =>
      opt.setName("id").setDescription("Message ID").setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("channel").setDescription("Channel of the message").setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply({ ephemeral: true });

    const messageId = interaction.options.getString("id", true);
    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (!isMessageCapableChannel(channel)) {
      await interaction.editReply("❌ You can only fetch messages from text channels or DMs/group DMs.");
      return;
    }

    let message;
    try {
      message = await channel.messages.fetch(messageId);
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Could not fetch the message. Check the ID and channel.");
      return;
    }

    const MAX_EDIT_LENGTH = 300;
    const COLOR_NO_EDITS = 0x808080;
    const COLOR_HAS_EDITS = 0x00ff00;

    let originalContent = message.content || "No message content";
    if (originalContent.length > MAX_EDIT_LENGTH) originalContent = originalContent.slice(0, MAX_EDIT_LENGTH) + "…";

    const edits = messageEdits.get(message.id) || [];

    let mostRecentEdit = "No edits recorded.";
    let otherEdits = "None.";

    if (edits.length > 0) {
      const lastEdit = edits[edits.length - 1];
      mostRecentEdit =
        lastEdit.content.length > MAX_EDIT_LENGTH
          ? lastEdit.content.slice(0, MAX_EDIT_LENGTH) + "…"
          : lastEdit.content;

      if (edits.length > 1) {
        otherEdits = edits
          .slice(0, -1)
          .map((e, i) => {
            let content = e.content || "*empty*";
            if (content.length > MAX_EDIT_LENGTH) content = content.slice(0, MAX_EDIT_LENGTH) + "…";
            return `**Edit #${i + 1}** (${e.editedAt.toLocaleString()}):\n${content}`;
          })
          .join("\n\n");
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Message Content")
      .setDescription(originalContent)
      .setColor(edits.length > 0 ? COLOR_HAS_EDITS : COLOR_NO_EDITS)
      .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 1024 }))
      .addFields(
        { name: "Author", value: message.author.tag, inline: true },
        { name: "ID", value: message.id, inline: true },
        { name: "Created At", value: message.createdAt.toLocaleString(), inline: true },
        { name: "Most Recent Edit", value: mostRecentEdit },
        { name: "Previous Edits", value: otherEdits }
      )
      .setFooter({ text: `Message ID: ${message.id}` });

    await interaction.editReply({
      content: "Here's the message content (including edits if any):",
      embeds: [embed],
    });
  },
};
