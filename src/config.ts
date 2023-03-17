import * as path from "path";
import * as fs from "fs/promises";
import { rmSync } from "fs";
import { mkdirp } from "mkdirp";
import { homedir } from "os";
import { globby } from "globby";
import type { Convo } from "./chat-model.js";

const BASE_PATH = path.join(homedir(), ".mimic");

function getConfigPath() {
  return path.join(BASE_PATH, "config");
}

export type Config = {
  openai_token: string;
  username: string;
};

export function checkForSetup() {
  try {
    return loadConfig();
  } catch (e) {
    console.log("Please run `mimic setup` first.");
    process.exit(1);
  }
}

export async function loadConfig() {
  return JSON.parse(await fs.readFile(getConfigPath(), "utf-8")) as Config;
}

export async function saveConfig(conf: Config) {
  await mkdirp(path.join(BASE_PATH, "bots"));
  await fs.writeFile(
    getConfigPath(),
    JSON.stringify(conf, null, "  "),
    "utf-8"
  );
}

export type BotSummary = {
  slug: string;
  name: string;
  system: string;
};

async function readJSON(file: string) {
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

async function writeJSON(file: string, data: any) {
  await mkdirp(path.dirname(file));
  return await fs.writeFile(file, JSON.stringify(data, null, "  "), "utf-8");
}

export async function listBots(): Promise<BotSummary[]> {
  const names = await globby(path.join(BASE_PATH, "bots/*/info.json"));
  const result: BotSummary[] = [];
  for (const file of names) {
    const slug = path.basename(path.dirname(file));
    const data = (await readJSON(file)) as any;
    result.push({
      slug,
      name: data.name,
      system: data.system,
    });
  }
  return result;
}

export async function botExists(name: string) {
  const bots = await listBots();
  return bots.some((bot) => bot.slug === name);
}

export async function createBot(info: BotSummary) {
  await mkdirp(path.join(BASE_PATH, "bots", info.slug));
  await fs.writeFile(
    path.join(BASE_PATH, "bots", info.slug, "info.json"),
    JSON.stringify(info, null, "  ")
  );
}

export async function removeBot(botName: string) {
  const dir = path.join(BASE_PATH, "bots", botName);
  rmSync(dir, { recursive: true, force: true });
}

export async function getBotInfo(botName: string): Promise<BotSummary> {
  const file = path.join(BASE_PATH, "bots", botName, "info.json");
  return (await readJSON(file)) as BotSummary;
}

function getConvoPath(botName: string, convoID: string) {
  return path.join(BASE_PATH, "bots", botName, "convos", convoID + ".json");
}

export async function saveConvo(botName: string, convoID: string, data: Convo) {
  const path = getConvoPath(botName, convoID);
  return await writeJSON(path, data);
}
