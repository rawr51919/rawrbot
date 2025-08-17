import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  NewsChannel,
  ThreadChannel,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("length")
    .setDescription("Computes the length of a string or a specific message.")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text to measure the length of (optional if specifying a message).")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("message_id")
        .setDescription("The ID of the message to measure (optional).")
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("The channel where the message is located (required if specifying a message ID).")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    let targetText: string | undefined;

    const inputText = interaction.options.getString("text");
    const messageId = interaction.options.getString("message_id");
    const channel = interaction.options.getChannel("channel");

    if (inputText) {
      targetText = inputText;
    } else if (messageId && channel) {
      // Only allow channel types that have messages
      if (
        channel instanceof TextChannel ||
        channel instanceof NewsChannel ||
        channel instanceof ThreadChannel
      ) {
        try {
          const message = await channel.messages.fetch(messageId);
          targetText = message.content;
        } catch {
          await interaction.reply({
            content: "Could not fetch that message. Make sure the ID and channel are correct.",
            ephemeral: true,
          });
          return;
        }
      } else {
        await interaction.reply({
          content: "The selected channel type does not support messages.",
          ephemeral: true,
        });
        return;
      }
    } else {
      await interaction.reply({
        content: "Please provide some text, or a message ID with its channel to measure.",
        ephemeral: true,
      });
      return;
    }

    // Compute word lengths
    const words = targetText.trim().split(/\s+/);
    let totalLength = 0;
    const responses: string[] = [];

    for (const word of words) {
      responses.push(`${word} contains ${word.length} character${word.length === 1 ? "" : "s"}.`);
      totalLength += word.length;
    }

    if (words.length > 1) {
      responses.push(`The combined length of those strings is ${totalLength} characters.`);
    }

    await interaction.reply(responses.join("\n"));
  },
};
