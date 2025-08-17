import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Random, MersenneTwister19937, nativeMath, nodeCrypto, browserCrypto } from "random-js";
// import { xorGen4096 } from "random-js"; // future RNG engine placeholder

interface EngineDefinition {
  name: string;
  code: string;
  generator: () => Random;
}

const engineDefinitions: EngineDefinition[] = [
  { name: "NativeMath", code: "nm", generator: () => new Random(nativeMath) },
  { name: "MersenneTwister19937", code: "mt", generator: () => new Random(MersenneTwister19937.autoSeed()) },
  { name: "NodeCrypto", code: "nc", generator: () => new Random(nodeCrypto) },
  { name: "BrowserCrypto", code: "bc", generator: () => new Random(browserCrypto) },
  // { name: "XorGen4096", code: "xg", generator: () => new Random(xorGen4096) }, // future engine
];

const engines: Record<string, () => Random> = {};
engineDefinitions.forEach(e => engines[e.code] = e.generator);

const engineChoices = engineDefinitions.map(e => ({ name: `${e.name} (${e.code})`, value: e.code }));

export default {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip one or multiple coins")
    .addIntegerOption(opt =>
      opt.setName("flips")
         .setDescription("Number of flips (default 1)")
         .setRequired(false)
         .setMinValue(1)
    )
    .addStringOption(opt =>
      opt.setName("engine")
         .setDescription("Random engine")
         .setRequired(false)
         .setChoices(...engineChoices)
    )
    .addBooleanOption(opt =>
      opt.setName("reactions")
         .setDescription("Add emoji reactions for each flip (may spam reactions if many flips)")
         .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply();

    const flips = interaction.options.getInteger("flips") ?? 1;
    const engineCode = interaction.options.getString("engine") ?? "nm";
    const useReactions = interaction.options.getBoolean("reactions") ?? false;

    const rand: Random = (engines[engineCode] ?? engines["nm"])();

    let headsCount = 0;
    let tailsCount = 0;
    const results: string[] = [];

    const HYBRID_LIMIT = 20;
    const MAX_REACTIONS = 50;
    let reactionsUsed = 0;

    const replyMsg = await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Flipping coins...")] });

    for (let i = 0; i < flips; i++) {
      const isHeads = rand.bool();
      if (isHeads) headsCount++;
      else tailsCount++;

      if (i < HYBRID_LIMIT) results.push(isHeads ? "🟢 Heads" : "🔴 Tails");

      if (useReactions && i < MAX_REACTIONS) {
        try {
          await replyMsg.react(isHeads ? "🟢" : "🔴");
          reactionsUsed++;
        } catch { /* ignore reaction failures */ }
      }
    }

    let displayedResults: string;
    if (flips <= HYBRID_LIMIT) {
      displayedResults = results.join(" ");
    } else {
      displayedResults = results.join(" ") + ` … (+${flips - HYBRID_LIMIT} more flips)`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Coin Flip${flips > 1 ? ` (${flips} flips)` : ""}`)
      .setDescription(displayedResults)
      .addFields([
        { name: "Heads", value: `${headsCount}`, inline: true },
        { name: "Tails", value: `${tailsCount}`, inline: true },
      ])
      .setColor(0xFFD700)
      .setFooter({ text: `Engine used: ${engineCode}${useReactions ? " | Reactions enabled" : ""}` });

    await replyMsg.edit({ embeds: [embed] });
  },
};
