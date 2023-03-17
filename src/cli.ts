import { program } from "commander";
import { listBots, removeBot } from "./config.js";
import { runSetup } from "./setup.js";
import chalk from "chalk";
import { runCreate } from "./create.js";
import { beginChat } from "./chat.js";

program
  .command("setup")
  .description("Run the initial setup process")
  .action(() => {
    runSetup();
  });

program
  .command("list")
  .description("List all available bots")
  .action(async () => {
    const bots = await listBots();
    if (bots.length === 0) {
      console.log(
        'No bots have been initialized\nRun "mimic create" to create a new bot.'
      );
    } else {
      for (const bot of bots) {
        console.log(chalk.bold(rpad(bot.slug, 20)), chalk.grey(bot.name));
      }
      console.log('\nRun "mimic chat <slug>" to chat with a bot.');
    }
  });

program
  .command("chat")
  .description("Start chatting with an existing bot")
  .argument("<name>", "Name of the bot")
  .action((name) => {
    beginChat(name);
  });

program
  .command("kill")
  .description("Destroy a named bot")
  .argument("<name>", "Name of the bot")
  .action((name) => {
    removeBot(name);
    console.log("RIP");
  });

program
  .command("create")
  .description("Create a new bot")
  .action(async () => {
    await runCreate();
  });

program.parse(process.argv);

function lpad(str: string, len: number) {
  return str.padStart(len, " ");
}

function rpad(str: string, len: number) {
  return str.padEnd(len, " ");
}
