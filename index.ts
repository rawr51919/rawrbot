import type { VercelRequest, VercelResponse } from "@vercel/node";
import getRawBody from "raw-body";
import axios from "axios";
import { verifyKey } from "discord-interactions";
import commands from "./.discraft/commands/index";
import { logger } from "./utils/logger";
import {
  InteractionType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import { MongoClient, Db } from "mongodb";

// --- MongoDB setup ---
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectMongo(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");

  const client = cachedClient ?? new MongoClient(process.env.MONGO_URI);
  if (!cachedClient) {
    await client.connect();
    cachedClient = client;
  }
  cachedDb = client.db(process.env.MONGO_DB ?? "discord");
  return cachedDb;
}

// --- Types ---
type MessageEdit = { content: string; editedAt: Date };
type MessageEditDoc = { messageId: string; edits: MessageEdit[] };

// --- Helpers ---
async function saveMessageEdit(messageId: string, content: string, editedAt = new Date()) {
  const db = await connectMongo();
  const editsCollection = db.collection<MessageEditDoc>("messageEdits");
  await editsCollection.updateOne(
    { messageId },
    { $push: { edits: { content, editedAt } } },
    { upsert: true }
  );
}

async function getMessageEdits(messageId: string): Promise<MessageEdit[]> {
  const db = await connectMongo();
  const editsCollection = db.collection<MessageEditDoc>("messageEdits");
  const doc = await editsCollection.findOne({ messageId });
  return doc?.edits ?? [];
}

// --- Vercel handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  logger.start("RawrBot Vercel handler invoked");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const rawBody = await getRawBody(req);

  if (!signature || !timestamp || !process.env.DISCORD_PUBLIC_KEY) {
    logger.error("Invalid request signature or missing public key", { signature, timestamp });
    return res.status(401).json({ error: "Unauthorized" });
  }

  let validRequest = false;
  try {
    validRequest = await verifyKey(
      rawBody,
      signature as string,
      timestamp as string,
      process.env.DISCORD_PUBLIC_KEY
    );
  } catch (err) {
    logger.error("Signature verification failed", { err });
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (!validRequest) return res.status(401).json({ error: "Invalid signature" });

  const interaction = JSON.parse(rawBody.toString());

  // --- Ping handshake ---
  if (interaction.type === InteractionType.Ping) {
    logger.debug("Handling Ping request");
    return res.status(200).json({ type: InteractionResponseType.Pong });
  }

  // --- Application Command ---
  if (interaction.type === InteractionType.ApplicationCommand) {
    const commandName = interaction.data.name.toLowerCase();
    const command = (commands as any)[commandName];

    if (!command) {
      logger.warn("Unknown command", { commandName });
      return res.status(400).json({ error: "Unknown command" });
    }

    // Defer response
    try {
      await axios.post(
        `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
        {
          type: InteractionResponseType.DeferredChannelMessageWithSource,
          data: { flags: command.data.initialEphemeral ? MessageFlags.Ephemeral : 0 },
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (deferError) {
      logger.error("Failed to defer command", { deferError });
      return res.status(500).json({ error: "Failed to defer command" });
    }

    // Execute command
    let result;
    try {
      result = await command.execute({ interaction, getMessageEdits, saveMessageEdit });
      logger.debug("Command executed successfully", { commandName });
    } catch (err) {
      logger.error("Command execution failed", { commandName, err });
      result = { content: "An error occurred while processing your request.", flags: MessageFlags.Ephemeral };
    }

    // Patch original deferred response
    try {
      await axios.patch(
        `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
        { content: result.content ?? "", flags: result.flags },
        { headers: { "Content-Type": "application/json" } }
      );
      logger.debug("Original response patched successfully");
      return res.status(200).end();
    } catch (patchError) {
      logger.error("Failed to patch original response", { patchError });
      return res.status(500).json({ error: "Failed to update response" });
    }
  }

  // --- Message Component / Modal Submit ---
  if (interaction.type === InteractionType.MessageComponent || interaction.type === InteractionType.ModalSubmit) {
    const messageId = interaction.message?.id;
    const oldContent = interaction.message?.content;

    if (messageId && oldContent) {
      try {
        await saveMessageEdit(messageId, oldContent);
        logger.debug("Message edit saved to MongoDB", { messageId });
      } catch (err) {
        logger.error("Failed to save message edit", { messageId, err });
      }
    }
  }

  logger.warn("Unknown interaction type", { type: interaction.type });
  return res.status(400).json({ error: "Unknown interaction type" });
}
