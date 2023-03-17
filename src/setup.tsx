import inquirer from "inquirer";
import { checkForSetup, Config, loadConfig, saveConfig } from "./config.js";

export async function runSetup() {
  let oldConfig: Config | undefined;
  try {
    oldConfig = await loadConfig();
  } catch (err) {}

  const result = await inquirer.prompt([
    {
      type: "input",
      name: "openai_token",
      message: "Please enter your OpenAI API token:",
      prefix: "OpenAI API Token",
      default: oldConfig?.openai_token,
    },
    {
      type: "input",
      name: "username",
      message: "What is your name?",
      prefix: "Your name",
      default: oldConfig?.username,
    },
  ]);

  saveConfig(result);
}
