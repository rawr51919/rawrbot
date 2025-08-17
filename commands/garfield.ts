import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Random } from 'random-js';

const rand = new Random();

const COPYRIGHT = `© 1978-${new Date().getFullYear()} Jim Davis`;

const GARFIELD_QUOTES = [
  "I hate Mondays!",
  "Love me, feed me, never leave me.",
  "Big naps, bigger lasagna.",
  "I’m not lazy, I’m energy efficient.",
  "Keep calm and eat lasagna.",
  "I'm not overweight, I'm undertall.",
  "Diet is 'die' with a 't'.",
  "Coffee is the gasoline of life.",
  "Some days you just can't get rid of a bomb.",
  "I'm not lazy, I'm just on energy-saving mode.",
  "If you want to sleep, you must dream."
];

const GARFIELD_FUN_FACTS = [
  "Garfield was originally a side character in Jim Davis' comic strip Jon.",
  "The first Garfield strip was published on June 19, 1978.",
  "Garfield has a favorite food: lasagna!",
  "The comic has appeared in over 2,500 newspapers worldwide.",
  "Garfield holds Guinness World Records for popularity.",
  "Garfield is famously lazy and loves sleeping.",
  "Jim Davis created Garfield to appeal to newspapers and families."
];

export default {
  data: new SlashCommandBuilder()
    .setName('garfield')
    .setDescription('Fetches a Garfield comic strip for a given date')
    .addStringOption(opt =>
      opt
        .setName('date')
        .setDescription('Date in YYYY-MM-DD format or "random" for a random comic')
        .setRequired(false)
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    await interaction.deferReply();

    const dateStr = interaction.options.getString('date');
    const today = new Date();
    const firstGarfield = new Date('1978-06-19');
    let inputDate: Date;

    if (dateStr?.toLowerCase() === 'random') {
      const start = firstGarfield.getTime();
      const end = today.getTime();
      inputDate = new Date(rand.integer(start, end));
    } else if (dateStr) {
      inputDate = new Date(dateStr);
    } else {
      inputDate = today;
    }

    if (isNaN(inputDate.getTime())) {
      await interaction.editReply('❌ Invalid date format! Use YYYY-MM-DD or "random".');
      return;
    }

    // Randomly pick quote and fun fact using random-js
    const randomQuote = rand.pick(GARFIELD_QUOTES);
    const randomFact = rand.pick(GARFIELD_FUN_FACTS);

    if (inputDate < firstGarfield) {
      const embed = new EmbedBuilder()
        .setTitle("Garfield Comic 🐱")
        .setDescription("Garfield didn't exist yet!")
        .setFooter({ text: COPYRIGHT })
        .addFields(
          { name: '💬 Quote', value: randomQuote },
          { name: '📝 Fun Fact', value: randomFact }
        );

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const yyyy = inputDate.getFullYear();
    const yy = String(yyyy).slice(-2);
    const mm = String(inputDate.getMonth() + 1).padStart(2, '0');
    const dd = String(inputDate.getDate()).padStart(2, '0');

    const comicUrl = `https://picayune.uclick.com/comics/ga/${yyyy}/ga${yy}${mm}${dd}.gif`;

    if (inputDate > today) {
      const embed = new EmbedBuilder()
        .setTitle("Garfield Comic 🐱")
        .setDescription("Garfield might be around that day, stay tuned!")
        .setFooter({ text: COPYRIGHT })
        .addFields(
          { name: '💬 Quote', value: randomQuote },
          { name: '📝 Fun Fact', value: randomFact }
        );

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      const res = await fetch(comicUrl, { method: 'HEAD' });
      if (!res.ok) {
        const embed = new EmbedBuilder()
          .setTitle(`Garfield Comic for ${yyyy}-${mm}-${dd}`)
          .setDescription("No Garfield comic found for this date.")
          .setFooter({ text: COPYRIGHT })
          .addFields(
            { name: '💬 Quote', value: randomQuote },
            { name: '📝 Fun Fact', value: randomFact }
          );

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Garfield Comic for ${yyyy}-${mm}-${dd}`)
        .setImage(comicUrl)
        .setFooter({ text: `Source: http://pt.jikos.cz/garfield | ${COPYRIGHT}` })
        .addFields(
          { name: '💬 Quote', value: randomQuote },
          { name: '📝 Fun Fact', value: randomFact }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('An error occurred while fetching the Garfield comic.');
    }
  },
};
