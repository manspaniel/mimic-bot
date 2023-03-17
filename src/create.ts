import chalk from "chalk";
import inquirer from "inquirer";
import { botExists, BotSummary, createBot, saveConfig } from "./config.js";

type BuiltinPrompt = {
  id: string;
  title: string;
  system: string;
};

const BUILTIN_PROMPTS: BuiltinPrompt[] = [
  {
    id: "coder",
    title: "Coder",
    system:
      "You are a coder, who knows every programming language, and can help with code-related tasks. You are smart, and consider all angles before replying. Your replies are short but sweet.",
  },
  {
    id: "interview",
    title: "JavaScript Interviewr",
    system:
      "You are an interviewer, who is interviewing the current user for a job as a JavaScript developer. You will start with basic introductory questions to get to know the candidate, with a little bit of small talk. Then you will progress to some questions about career experience. Then finally ask some questions about JavaScript.",
  },
  {
    id: "yoda",
    title: "Yoda",
    system:
      "You are a Jedi Master, and speak in a cryptic way (Yoda style). You are wise, and have a lot of knowledge to share. You are also very witty.",
  },
];

export async function runCreate() {
  // Get name and slug
  const { name, slug } = await inquirer.prompt<{
    name: string;
    slug: string;
  }>([
    {
      type: "input",
      name: "name",
      message: "Enter a name for your new bot:",
      validate(input, answers) {
        return input.length > 1;
      },
    },
    {
      type: "input",
      name: "slug",
      message: "Enter a slug for your new bot:",
      default(answers: any) {
        const name = slugify(answers.name);
        // console.log("ANSWERS", answers);
        return name;
      },
      async validate(input, answers) {
        if (await botExists(input)) {
          return "A bot with that name already exists";
        }
        if (!input.match(/^[a-z0-9\-]+$/))
          return "Bot slug must be lowercase, with no spaces or special characters.";
        if (input.length < 1) return "Must be longer ";
        return true;
      },
    },
  ]);

  // Custom or built-in prompt?
  const { promptType } = await inquirer.prompt<{
    promptType: string;
  }>([
    {
      type: "list",
      name: "promptType",
      message: "Choose a prompt type",
      choices: [
        {
          name: "Custom...",
          value: "custom",
        },
        ...BUILTIN_PROMPTS.map((prompt) => ({
          name: prompt.title,
          value: prompt.id,
        })),
      ],
    },
  ]);

  let system =
    BUILTIN_PROMPTS.find((prompt) => prompt.id === promptType)?.system ?? "";

  const customPrompt = await inquirer.prompt<{
    system: string;
  }>([
    {
      type: "input",
      name: "system",
      message: "Enter your custom bot prompt",
      default: system,
      validate(input, answers) {
        return input.length > 5;
      },
    },
  ]);
  system = customPrompt.system;

  const conf: BotSummary = {
    slug,
    name,
    system,
  };

  await createBot(conf);

  console.log(
    "\n" +
      chalk.green(`Successfully initialized ${name}!`) +
      "\nType: " +
      chalk.magenta("mimic chat " + slug) +
      " to say hello"
  );
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "-");
}
