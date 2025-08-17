import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Random, MersenneTwister19937, nativeMath, nodeCrypto, browserCrypto } from "random-js";
// import { xorGen4096 } from "random-js"; // future RNG engine placeholder

// RNG engines
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

// Build engines map dynamically
const engines: Record<string, () => Random> = {};
engineDefinitions.forEach(e => engines[e.code] = e.generator);

// Build choices for command dynamically
const engineChoices = engineDefinitions.map(e => ({ name: `${e.name} (${e.code})`, value: e.code }));

export default {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Generates random numbers, choices, booleans, or dice rolls")
    .addStringOption(opt =>
      opt
        .setName("engine")
        .setDescription("Random engine")
        .setRequired(false)
        .setChoices(...engineChoices)
    )
    .addIntegerOption(opt =>
      opt
        .setName("min")
        .setDescription("Minimum number (inclusive)")
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt
        .setName("max")
        .setDescription("Maximum number (inclusive)")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName("choices")
        .setDescription("Comma-separated list of choices")
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName("boolean")
        .setDescription("Generate a random true/false")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName("dice")
        .setDescription("Roll dice in NdM format, optionally with +X or -X modifier (e.g., 3d6+2)")
        .setRequired(false)
    ),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const interaction = data.interaction;
    await interaction.deferReply();

    const engineCode = (interaction.options.getString("engine") ?? "nm");
    const rand: Random = (engines[engineCode] ?? engines["nm"])();

    const min = interaction.options.getInteger("min");
    const max = interaction.options.getInteger("max");
    const choices = interaction.options.getString("choices");
    const booleanOpt = interaction.options.getBoolean("boolean");
    const diceStr = interaction.options.getString("dice");

    let result: string;

    if (booleanOpt) {
      result = rand.bool() ? "true" : "false";
    } else if (choices) {
      const array = choices.split(",").map(s => s.trim()).filter(Boolean);
      result = array.length > 0 ? rand.pick(array) : "No valid choices provided!";
    } else if (min !== null && max !== null) {
      result = min <= max ? rand.integer(min, max).toString() : "Error: min cannot be greater than max!";
    } else if (diceStr) {
      const match = /^(\d+)d(\d+)([+-]\d+)?$/.exec(diceStr.trim());
      if (!match) {
        result = "Invalid dice format! Use NdM or NdM±X, e.g., 3d6+2";
      } else {
        const number = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;

        if (number < 1 || sides < 1) {
          result = "Number of dice and sides must be at least 1!";
        } else {
          const rolls: number[] = rand.dice(number, sides); // type number[]

          const highlightedRolls = rolls.map((roll: number) => {
            if (sides === 20) {
              if (roll === 20) return `${roll} 🎉`;
              if (roll === 1) return `${roll} 💀`;
            }
            return roll.toString();
          });

          const total = rolls.reduce((a, b) => a + b, 0) + modifier;

          const maxPossible = number * sides + modifier;
          const minPossible = number + modifier;

          let totalNote = "";
          if (total >= 0.9 * maxPossible) totalNote = " 🌟 Big Success!";
          else if (total <= 1.1 * minPossible) totalNote = " ⚠️ Big Failure!";

          let modifierStr = "";
          if (modifier !== 0) modifierStr = modifier >= 0 ? ` +${modifier}` : ` ${modifier}`;

          result = `Rolls: [${highlightedRolls.join(", ")}]${modifierStr} → Total: ${total}${totalNote}`;
        }
      }
    } else {
      result = "Please provide either min/max, choices, boolean, or dice option!";
    }

    await interaction.editReply({ content: `🎲 Random result: **${result}**` });
    await interaction.followUp({
      content: `Engine used: ${engineCode}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
