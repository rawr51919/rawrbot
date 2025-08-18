import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { registerCommands } from "./.discraft/commands/index";
import { registerEvents } from "./.discraft/events/index";
import { logger } from "./utils/logger";

// --- Instantiate Discord client with required intents ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// In-memory storage for message edits
export const messageEdits = new Map<string, { content: string; editedAt: Date }[]>();

logger.start("Starting bot...");

// Register events before login
registerEvents(client)
  .then(() => logger.verbose("Events registered in main process."))
  .catch((err) => {
    logger.error("Error registering events.");
    logger.verbose(err);
  });

client.on("ready", async () => {
  logger.success("RawrBot is ready to have some fun!");
  try {
    await registerCommands(client);
  } catch (err) {
    logger.error("Error registering commands.");
    logger.verbose(err);
  }

  // --- Message update listener ---
  client.on("messageUpdate", (oldMessage, newMessage) => {
    if (!oldMessage.content || oldMessage.content === newMessage.content) return;
    const history = messageEdits.get(oldMessage.id) || [];
    history.push({ content: oldMessage.content, editedAt: new Date() });
    messageEdits.set(oldMessage.id, history);
  });
});

// Login with the token
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  logger.error("Client login failed, make sure your token is set correctly.");
  logger.verbose(err);
});

// --- Global process handlers ---
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception.");
  logger.verbose(err);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection.");
  logger.verbose(err);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, Gracefully shutting down...");
  try {
    logger.info("Closing client...");
    await client.destroy();
    logger.success("Client closed.");
  } catch (err) {
    logger.error("Error while shutting down client.");
    logger.verbose(err);
  }
  logger.info("Exiting...");
  process.exit(0);
});
