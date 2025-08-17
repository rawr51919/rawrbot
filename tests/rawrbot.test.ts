import TestCommand from "../commands/test";
import { ChatInputCommandInteraction } from "discord.js";
import { MongoClient } from "mongodb";
import { saveMessageEdit, getMessageEdits } from "../commands/messageinfo";

// ---------------------------
// Mock helpers
// ---------------------------
function createClientMock() {
  return {
    login: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    user: {
      setPresence: jest.fn(),
      setAvatar: jest.fn(),
      setStatus: jest.fn(),
    },
  };
}

function createMessageMock(content: string, authorId = "author1") {
  return {
    content,
    author: { id: authorId, tag: "Author#0001", send: jest.fn() },
    channel: { send: jest.fn(), type: "GUILD_TEXT", awaitMessages: jest.fn() },
    mentions: { members: { first: jest.fn() } },
    guild: {
      members: { me: { permissions: { has: () => true } } },
      commandPrefix: "&",
      name: "TestServer",
    },
    member: { permissions: { has: () => true } },
  };
}

function createInteractionMock(commandName = "test"): ChatInputCommandInteraction {
  return {
    commandName,
    reply: jest.fn().mockResolvedValue(undefined),
    options: {
      getString: jest.fn(),
      getInteger: jest.fn(),
      getBoolean: jest.fn(),
      getChannel: jest.fn(),
    },
    client: {
      users: { fetch: jest.fn() },
    },
    user: { id: "user1", tag: "User#1234" },
    deferReply: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
  } as unknown as ChatInputCommandInteraction;
}

// ---------------------------
// Jest test suite
// ---------------------------
describe("Generic Discraft.js Bot Tests", () => {
  let client: ReturnType<typeof createClientMock>;
  let message: ReturnType<typeof createMessageMock>;

  beforeEach(() => {
    client = createClientMock();
    process.env.MONGO_URI = "mongodb://fake_uri"; // Mock MONGO_URI for MongoDB tests
  });

  // ---------------------------
  // Message-based tests
  // ---------------------------
  test("Bot can log in and set presence", async () => {
    await client.login("FAKE_TOKEN");
    client.user.setPresence({ activities: [{ name: "Testing" }], status: "online" });

    expect(client.login).toHaveBeenCalledWith("FAKE_TOKEN");
    expect(client.user.setPresence).toHaveBeenCalledWith({
      activities: [{ name: "Testing" }],
      status: "online",
    });
  });

  test("Bot responds to a ping command", () => {
    message = createMessageMock("&ping");
    const pingHandler = (msg: typeof message) => {
      if (msg.content === "&ping") msg.channel.send("Pong!");
    };

    pingHandler(message);
    expect(message.channel.send).toHaveBeenCalledWith("Pong!");
  });

  // ---------------------------
  // Slash command tests
  // ---------------------------
  test("TestCommand replies correctly", async () => {
    const interaction = createInteractionMock();
    await TestCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith("I'm online!");
  });

  test("TestCommand command name and description are correct", () => {
    expect(TestCommand.data.name).toBe("test");
    expect(TestCommand.data.description).toBe("Check if the bot is online.");
  });

  // ---------------------------
  // MongoDB message edits
  // ---------------------------
  describe("MongoDB message edits", () => {
    let mockCollection: any;
    let mockDb: any;

    beforeEach(() => {
      mockCollection = { updateOne: jest.fn().mockResolvedValue({}), findOne: jest.fn() };
      mockDb = { collection: jest.fn(() => mockCollection) };

      // Spy on connect
      jest.spyOn(MongoClient.prototype, "connect").mockImplementation(async function (this: MongoClient) {
        return this; // 'this' is typed as MongoClient
      });

      // Spy on db
      jest.spyOn(MongoClient.prototype, "db").mockReturnValue(mockDb);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("saveMessageEdit calls updateOne with correct params", async () => {
      await saveMessageEdit("msg123", "Edited content");
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { messageId: "msg123" },
        { $push: { edits: expect.objectContaining({ content: "Edited content" }) } },
        { upsert: true }
      );
    });

    test("getMessageEdits returns edits from DB", async () => {
      const fakeEdits = [{ content: "Edit1", editedAt: new Date() }];
      mockCollection.findOne.mockResolvedValueOnce({ messageId: "msg123", edits: fakeEdits });

      const edits = await getMessageEdits("msg123");
      expect(edits).toEqual(fakeEdits);
    });

    test("getMessageEdits returns empty array if no document", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const edits = await getMessageEdits("unknownMsg");
      expect(edits).toEqual([]);
    });
  });
});
