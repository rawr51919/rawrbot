import "dotenv/config";
import { registerCommands } from "./.discraft/commands/index";
import { registerEvents } from "./.discraft/events/index";
import client from "./clients/discord";
import { logger } from "./utils/logger";

// In-memory storage for message edits
export const messageEdits = new Map<string, { content: string; editedAt: Date }[]>();

logger.start("Starting bot...");

// --- Load environment variables ---
const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const publicKey = process.env.DISCORD_PUBLIC_KEY;

console.log("DISCORD_TOKEN:", token);
console.log("DISCORD_APP_ID:", appId);
console.log("DISCORD_PUBLIC_KEY:", publicKey);

if (!token || !appId || !publicKey) {
  logger.error("Missing required environment variables for the bot.");
  process.exit(1);
}

// --- Register events ---
registerEvents(client)
  .then(() => logger.verbose("Events registered in main process."))
  .catch((err) => {
    logger.error("Error registering events.");
    logger.verbose(err);
  });

// --- Ready listener ---
client.on("ready", async () => {
  logger.success("RawrBot is ready!");

  try {
    await registerCommands(client);
    logger.verbose("Commands registered successfully.");
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

// --- Login the client ---
client.login(token).catch((err) => {
  logger.error("Client login failed, make sure your token is correct.");
  logger.verbose(err);
});

// --- Process-level error handling ---
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception.");
  logger.verbose(err);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection.");
  logger.verbose(err);
});

// --- Graceful shutdown ---
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, gracefully shutting down...");
  try {
    await client.destroy();
    logger.success("Client closed.");
  } catch (err) {
    logger.error("Error while shutting down client.");
    logger.verbose(err);
  }
  logger.info("Exiting...");
  process.exit(0);
});
