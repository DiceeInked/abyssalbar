export const COMMANDS = [
  "/help",
  "/home",
  "/sign up <username> <password>",
  "/sign in <username> <password>",
  "/sign out",
  "/egg",
  "/egg 0",
  "/egg 1",
  "/etho",
  "/games",
  "/tetris",
  "/tetris 1",
  "/tetris 2",
  "/tetris restart",
  "/play <game>",
  "/clear",
] as const;

export const MAIN_COMMANDS = [
  "/help",
  "/home",
  "/sign",
  "/egg",
  "/etho",
  "/games",
  "/tetris",
  "/play",
  "/clear",
] as const;

export const SIGN_COMMANDS = [
  "/sign up",
  "/sign in",
  "/sign out",
] as const;

export const EGG_COMMANDS = [
  "/egg",
  "/egg 0",
  "/egg 1",
] as const;

export const TETRIS_COMMANDS = [
  "/tetris 1",
  "/tetris 2",
  "/tetris restart",
] as const;

export const COMMAND_HELP = `commands:\n${MAIN_COMMANDS.join("\n")}`;

export const PLAY_USAGE = "usage: /play <game>";

export const parsePlayCommand = (value: string) => {
  const match = value.trim().match(/^\/play\s+<([^<>]+)>$/i);
  const gameName = match?.[1]?.trim();
  return gameName ? gameName : null;
};
