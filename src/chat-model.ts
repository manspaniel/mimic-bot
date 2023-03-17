import { BotSummary, loadConfig, saveConvo } from "./config.js";
import { v4 as uuid } from "uuid";
import { Configuration, OpenAIApi } from "openai";
import { format } from "date-fns";

export type Convo = {
  id: string;
  messages: Message[];
};

export type Message = {
  id: string;
  timestamp: string;
  role: "user" | "assistant";
  text: string;
  loading?: boolean;
  error?: string;
};

export type Memory = {
  id: string;
  timestamp: string;
  conversationID: string;
  vector?: number[];
  text: string;
};

export class ChatSession {
  slug: string;
  name: string;
  system: string;
  userName: string = "";

  id: string = uuid();
  messages: Message[] = [];

  memories: Memory[] = [];

  api!: OpenAIApi;

  subscribers: (() => void)[] = [];

  constructor(bot: BotSummary) {
    this.slug = bot.slug;
    this.name = bot.name;
    this.system = bot.system;
  }

  async init() {
    const conf = await loadConfig();
    this.userName = conf.username;

    this.api = new OpenAIApi(
      new Configuration({
        apiKey: conf.openai_token,
      })
    );

    // console.log("SYSTEM:", this.getSystemPrompt());
  }

  restoreConvo(convo: Convo) {
    this.id = convo.id;
    this.messages = convo.messages;
  }

  restoreMemories(memories: Memory[]) {
    this.memories = memories;
  }

  searchMemories(text: string) {}

  async saveConvo() {
    saveConvo(this.slug, this.id, {
      id: this.id,
      messages: this.messages,
    });
  }

  async saveMemories() {
    // TODO
  }

  sendMessage(input: string) {
    this.messages.push({
      id: uuid(),
      timestamp: new Date().toISOString(),
      role: "user",
      text: input,
    });
    this.changed();
    this.go();
  }

  getSystemPrompt() {
    const now = new Date();
    const dateString = format(now, "EEEE, do MMMM");
    const timeString = format(now, "h:mmaaa");
    const parts = [
      `You are ${this.name}`,
      this.system,
      `You are aware of the date and time — it is currently ${dateString}, at ${timeString}`,
      `The user's name is ${this.userName}`,
      // `At the end of every message, you will end the message with 'REMEMBER: Thing to remember', on a new line. Any facts you learn about the user, or any details of the conversation, should be added to this REMEMBER line.`,
    ];
    return parts.join(".\n") + ".";
  }

  async go() {
    const msg: Message = {
      id: uuid(),
      role: "assistant",
      loading: true,
      text: "",
      timestamp: new Date().toISOString(),
    };
    this.messages.push(msg);
    this.changed();
    const result = await this.api
      .createChatCompletion(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(),
            },
            ...this.messages
              .filter((msg) => !msg.error)
              .map((msg) => ({
                role: msg.role,
                content: msg.text,
              })),
          ],
          stream: true,
        },
        {
          responseType: "stream",
        }
      )
      .catch((err) => {
        msg.error = err.message;
        this.changed();
      });
    if (result) {
      // @ts-ignore
      result.data.on("data", (data) => {
        const lines = data
          .toString()
          .split("\n")
          .filter((line: string) => line.trim() !== "");
        for (const line of lines) {
          const message = line.replace(/^data: /, "");
          if (message === "[DONE]") {
            msg.loading = false;
            this.handleResponse(msg);
            this.changed();
            return; // Stream finished
          }
          try {
            const parsed = JSON.parse(message);
            msg.text += parsed.choices[0].delta.content || "";
            this.changed();
          } catch (error) {
            msg.error = "Could not parse response from OpenAI";
          }
        }
      });
    }
  }

  handleResponse(msg: Message) {
    // Look for memories
    const matches = msg.text.matchAll(/\<remember>([^>]+)\<\/remember\>/gim);
    for (const match of matches) {
      this.memories.push({
        id: uuid(),
        conversationID: this.id,
        text: match[1]!,
        timestamp: new Date().toISOString(),
      });
    }
  }

  subscribe(handler: () => void) {
    this.subscribers.push(handler);
    return () => {
      this.subscribers = this.subscribers.filter((h) => h !== handler);
    };
  }

  changed() {
    this.subscribers.forEach((handler) => handler());
    this.saveConvo();
  }
}
