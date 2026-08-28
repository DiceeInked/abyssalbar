export type CommandDefinition = {
  command: string;
  label?: string;
  syntax?: string;
  action?: string;
  children?: CommandDefinition[];
};

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  { command: "/help", action: "help" },
  { command: "/home", action: "home" },
  {
    command: "/sign",
    children: [
      { command: "/sign up", syntax: "/sign up <username> <password>", action: "sign_up" },
      { command: "/sign in", syntax: "/sign in <username> <password>", action: "sign_in" },
      { command: "/sign out", action: "sign_out" },
    ],
  },
  {
    command: "/egg",
    action: "egg",
    children: [
      { command: "/egg", action: "egg" },
      { command: "/egg 0", action: "egg_0" },
      { command: "/egg 1", action: "egg_1" },
    ],
  },
  { command: "/etho", action: "etho" },
  { command: "/games", action: "games" },
  {
    command: "/tetris",
    action: "tetris_1",
    children: [
      { command: "/tetris 1", action: "tetris_1" },
      { command: "/tetris 2", action: "tetris_2" },
      { command: "/tetris restart", action: "tetris_restart" },
    ],
  },
  { command: "/play", syntax: "/play <game>", action: "play" },
  { command: "/clear", action: "clear" },
];

const flattenCommands = (definitions: CommandDefinition[]): CommandDefinition[] => definitions.flatMap((definition) => [definition, ...(definition.children ? flattenCommands(definition.children) : [])]);

export const COMMANDS = flattenCommands(COMMAND_DEFINITIONS).map((definition) => definition.command) as readonly string[];
export const MAIN_COMMANDS = COMMAND_DEFINITIONS.map((definition) => definition.command) as readonly string[];

export const findCommandDefinition = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return flattenCommands(COMMAND_DEFINITIONS)
    .filter((definition) => normalized === definition.command || normalized.startsWith(`${definition.command} `))
    .sort((a, b) => b.command.length - a.command.length)[0] ?? null;
};

export const getCommandChildren = (command: string) => COMMAND_DEFINITIONS.find((definition) => definition.command === command)?.children ?? [];

export const COMMAND_HELP = `commands:\n${MAIN_COMMANDS.join("\n")}`;
export const PLAY_USAGE = "/play <game>";

export const parsePlayCommand = (value: string) => {
  const match = value.trim().match(/^\/play\s+(.+)$/i);
  const gameName = match?.[1]?.trim();
  return gameName ? gameName : null;
};
