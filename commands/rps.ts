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
const RPS_CHOICES = ["Rock", "Paper", "Scissors"];
const RPS_EMOJIS: Record<string, string> = { Rock: "🪨", Paper: "📄", Scissors: "✂️" };

export default {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play Rock-Paper-Scissors against the bot")
    .addIntegerOption(opt =>
      opt
        .setName("rounds")
        .setDescription("Number of rounds (default 3)")
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt
        .setName("fast_threshold")
        .setDescription("Rounds threshold to enable fast mode (default 20)")
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(opt =>
      opt
        .setName("engine")
        .setDescription("Random engine")
        .setRequired(false)
        .setChoices(...engineChoices)
    )
    .addStringOption(opt =>
      opt
        .setName("moves")
        .setDescription("Comma-separated choices for each round (e.g., Rock, Paper, Scissors).")
        .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply();

    const roundsCount = interaction.options.getInteger("rounds") ?? 3;
    const fastThreshold = interaction.options.getInteger("fast_threshold") ?? 20;
    const engineCode = interaction.options.getString("engine") ?? "nm";
    const rand: Random = (engines[engineCode] ?? engines["nm"])();

    const userMovesRaw = interaction.options.getString("moves") ?? "";
    const userMoves = userMovesRaw.split(",").map(s => s.trim()).filter(s => RPS_CHOICES.includes(s));

    let userWins = 0;
    let botWins = 0;
    const roundsSymbols: string[] = [];

    const embed = new EmbedBuilder()
      .setTitle(`🪨📄✂️ Rock-Paper-Scissors (${roundsCount} rounds)`)
      .setColor(0x747F8D)
      .setFooter({ text: `Engine used: ${engineCode ?? null}` });

    const fastMode = roundsCount > fastThreshold;
    const replyMsg = await interaction.editReply({ embeds: [embed] });

    const MAX_REACTIONS = 50;
    let reactionsUsed = 0;

    for (let round = 0; round < roundsCount; round++) {
      const userChoice = userMoves[round] ?? rand.pick(RPS_CHOICES);
      const botChoice = rand.pick(RPS_CHOICES);

      let symbol = "";
      if (userChoice === botChoice) symbol = "⬛"; // tie
      else if (
        (userChoice === "Rock" && botChoice === "Scissors") ||
        (userChoice === "Paper" && botChoice === "Rock") ||
        (userChoice === "Scissors" && botChoice === "Paper")
      ) {
        userWins++;
        symbol = "🟩"; // user wins
      } else {
        botWins++;
        symbol = "🟥"; // bot wins
      }

      roundsSymbols.push(symbol);

      if (!fastMode) {
        const roundDisplay = `**Round ${round + 1}**: You chose ${RPS_EMOJIS[userChoice]}, Bot chose ${RPS_EMOJIS[botChoice]}`;
        embed.setDescription((embed.data.description ?? "") + `\n${roundDisplay}`);
        await replyMsg.edit({ embeds: [embed] });

        // Only add reactions if below max
        if (reactionsUsed + 2 <= MAX_REACTIONS) {
          await replyMsg.react(RPS_EMOJIS[userChoice]).catch(() => {});
          await replyMsg.react(RPS_EMOJIS[botChoice]).catch(() => {});
          reactionsUsed += 2;
          if (symbol === "⬛" && reactionsUsed + 1 <= MAX_REACTIONS) {
            await replyMsg.react("🔄").catch(() => {});
            reactionsUsed++;
          }
          await new Promise(res => setTimeout(res, 200));
        }
      }
    }

    let finalResult = "";
    let color = 0x747F8D;
    if (userWins > botWins) {
      finalResult = `🎉 You won! (${userWins}–${botWins})`;
      color = 0x57F287;
    } else if (botWins > userWins) {
      finalResult = `💀 Bot won! (${botWins}–${userWins})`;
      color = 0xED4245;
    } else {
      finalResult = `🤝 It's a tie! (${userWins}–${botWins})`;
    }

    embed
      .setColor(color)
      .setDescription(
        fastMode
          ? `Scoreboard: ${roundsSymbols.join("")}`
          : embed.data.description ?? null
      )
      .addFields({ name: "Final Result", value: finalResult ?? null });

    await replyMsg.edit({ embeds: [embed] });
  },
};
