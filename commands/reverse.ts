import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

// Split string into grapheme clusters (handles emojis & combined Unicode)
function splitGraphemes(str: string): string[] {
  return [...str];
}

// Reverse a single line while preserving headers and list markers
function reverseLinePreserveMarkdown(line: string): string {
  const headerRegex = /^(#{1,6}\s+)/;
  const listRegex = /^[-*+]\s+/;

  let prefix = "";
  let content = line;

  const headerMatch = headerRegex.exec(line);
  if (headerMatch) {
    prefix = headerMatch[0];
    content = line.slice(prefix.length);
  } else {
    const listMatch = listRegex.exec(line);
    if (listMatch) {
      prefix = listMatch[0];
      content = line.slice(prefix.length);
    }
  }

  // Reverse content with grapheme awareness
  return prefix + splitGraphemes(content).toReversed().join("");
}

// Reverse text while preserving Markdown, emojis, and code
function reverseDiscordText(str: string): string {
  const markdownRegex = /(\*\*|__|\*|~~)/g;

  // ----- Handle code blocks -----
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(str)) !== null) {
    codeBlocks.push(match[0]);
  }
  codeBlocks.forEach((block, i) => {
    str = str.replace(block, `__CODEBLOCK_${i}__`);
  });

  // ----- Handle inline code -----
  const inlineCodeRegex = /`[^`]*`/g;
  const inlineCodes: string[] = [];
  while ((match = inlineCodeRegex.exec(str)) !== null) {
    inlineCodes.push(match[0]);
  }
  inlineCodes.forEach((code, i) => {
    str = str.replace(code, `__INLINECODE_${i}__`);
  });

  // Split by lines
  const lines = str.split("\n");

  // Reverse each line individually
  const reversedLines = lines.map(line => {
    // Split by markdown tokens
    const tokens = line.split(markdownRegex);

    // Reverse only the text segments (ignore markdown and code placeholders)
    for (let i = 0; i < tokens.length; i++) {
      if (
        !markdownRegex.test(tokens[i]) &&
        !tokens[i].startsWith("__CODEBLOCK_") &&
        !tokens[i].startsWith("__INLINECODE_")
      ) {
        tokens[i] = splitGraphemes(tokens[i]).toReversed().join("");
      }
    }

    // Reassemble tokens
    const reversedTokens = tokens.toReversed().join("");

    // Preserve headers and list markers
    return reverseLinePreserveMarkdown(reversedTokens);
  });

  // Reverse the order of lines
  let result = reversedLines.toReversed().join("\n");

  // Restore code blocks and inline code
  result = result.replace(/__CODEBLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)]);
  result = result.replace(/__INLINECODE_(\d+)__/g, (_, index) => inlineCodes[Number(index)]);

  return result;
}

export default {
  data: new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverses text while preserving emojis, Markdown, headers, lists, and code.")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("The text to reverse")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString("text", true);

    const reversed = reverseDiscordText(text);

    await interaction.reply({ content: reversed });
  },
};
