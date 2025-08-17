import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
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

const movieQuotes = [
  "No, Luke... I am your father.",
  "Reach for the sky!",
  "The Force is strong with this one.",
  "I'll be back!",
];

export default {
  data: new SlashCommandBuilder()
    .setName("moviequote")
    .setDescription("Displays a random movie quote.")
    .addStringOption(opt =>
      opt
        .setName("engine")
        .setDescription("Random engine")
        .setRequired(false)
        .addChoices(...engineChoices)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const engineCode = interaction.options.getString("engine") ?? "nm";
    const rand: Random = (engines[engineCode] ?? engines["nm"])();

    const quote = rand.pick(movieQuotes);
    await interaction.reply(quote);
  },
};
