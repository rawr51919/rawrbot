import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import weather from 'weather.js';

// Map weather descriptions to matching Discord emoji, including more expressive ones
const WEATHER_EMOJIS: Record<string, string> = {
  "Sunny": "☀️",
  "Clear": "☀️",
  "Partly Cloudy": "⛅",
  "Cloudy": "☁️",
  "Overcast": "☁️",
  "Rain": "🌧️",
  "Light Rain": "🌦️",
  "Thunderstorms": "⛈️",
  "Snow": "❄️",
  "Fog": "🌫️",
  "Haze": "🌫️",
  "Windy": "💨",
  "Mist": "🌫️",
  "Drizzle": "🌦️",
  "Blizzard": "🌨️",
  "Heavy Rain": "🌧️🌊",
  "Sleet": "🌨️🌧️",
  "Storm": "🌩️"
};

export default {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Check the current weather for a specific location')
    .addStringOption(opt =>
      opt.setName('location')
        .setDescription('City or location name')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('unit')
        .setDescription('Unit: C for Celsius, F for Fahrenheit, K for Kelvin')
        .setRequired(false)
        .setChoices(
          { name: 'Celsius', value: 'C' },
          { name: 'Fahrenheit', value: 'F' },
          { name: 'Kelvin', value: 'K' }
        )
    ),

  async execute({ interaction }: { interaction: ChatInputCommandInteraction }) {
    const location = interaction.options.getString('location', true);
    const unit = interaction.options.getString('unit') ?? 'C';

    await interaction.deferReply();

    weather.get(location, { degreeType: unit === 'K' ? 'C' : unit }, async (err, result) => {
      if (err) {
        await interaction.editReply(`❌ Error fetching weather: ${err.message}`);
        return;
      }

      if (!result || result.length === 0) {
        await interaction.editReply(`❌ No weather information found for "${location}".`);
        return;
      }

      const current = result[0].current;
      const loc = result[0].location;

      // Convert temperature to Kelvin if needed
      let temperature = parseFloat(current.temperature);
      let feelslike = parseFloat(current.feelslike);
      let displayUnit = unit;

      if (unit === 'K') {
        temperature = Math.round((temperature + 273.15) * 100) / 100;
        feelslike = Math.round((feelslike + 273.15) * 100) / 100;
        displayUnit = 'K';
      }

      // Map weather text to expressive emoji
      const weatherEmoji = WEATHER_EMOJIS[current.skytext] ?? '❓';
      const weatherDescription = `${weatherEmoji} ${current.skytext}`;

      const embed = new EmbedBuilder()
        .setTitle(`Weather for ${loc.name}, ${loc.region}, ${loc.country}`)
        .setDescription(weatherDescription)
        .addFields(
          { name: 'Temperature', value: `${temperature}°${displayUnit}`, inline: true },
          { name: 'Feels Like', value: `${feelslike}°${displayUnit}`, inline: true },
          { name: 'Humidity', value: `${current.humidity}%`, inline: true },
          { name: 'Wind', value: current.winddisplay, inline: true }
        )
        .setThumbnail(current.imageUrl)
        .setFooter({ text: `Observation Time: ${current.observationtime}` });

      await interaction.editReply({ embeds: [embed] });
    });
  },
};
