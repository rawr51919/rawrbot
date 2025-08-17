import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Minesweeper from "discord.js-minesweeper";

export default {
  data: new SlashCommandBuilder()
    .setName("minesweeper")
    .setDescription("Generate a minesweeper board")
    .addIntegerOption((option) =>
      option
        .setName("rows")
        .setDescription("Number of rows (1–12)")
        .setMinValue(1)
        .setMaxValue(12)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("columns")
        .setDescription("Number of columns (1–12)")
        .setMinValue(1)
        .setMaxValue(12)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("mines")
        .setDescription("Number of mines (>=1)")
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("emote")
        .setDescription("Emoji to use for mines (default 💣)")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("spaces")
        .setDescription("Separate pieces with spaces?")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const rows = interaction.options.getInteger("rows", true);
    const columns = interaction.options.getInteger("columns", true);
    const mines = interaction.options.getInteger("mines", true);
    const emote = interaction.options.getString("emote") ?? "💣"; // 💣 default
    const spaces = interaction.options.getBoolean("spaces") ?? false;

    // Prevent impossible board (too many mines)
    if (mines >= rows * columns) {
      return interaction.reply("❌ Too many mines! Try fewer.");
    }

    const minesweeper = new Minesweeper({
      rows,
      columns,
      mines,
      emote,
      spaces,
    });

    let board = minesweeper.start();

    if (!board) {
      await interaction.reply("❌ Invalid data. Please try again.");
    } else {
      // Convert string[][] to string if necessary
      if (Array.isArray(board)) {
        board = board.map((row) => row.join(" ")).join("\n");
      }
      await interaction.reply({ content: board });
    }
  },
};
