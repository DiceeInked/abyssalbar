export type TerminalLine = {
  id: number;
  kind: "command" | "response" | "warning";
  text: string;
};

export type ErrorWindow = {
  id: number;
  message: string;
  x: number;
  y: number;
};

export type RouteCommand = {
  minimumStage: number;
  nextStage: number;
  response: string;
  startMusic?: boolean;
  playJingle?: boolean;
};

export type ProceedChoice = "proceed" | "stop";

export type ProceedPrompt = {
  heading: string;
  question: string;
  proceedLabel: string;
  stopLabel: string;
};

export type BootState = "boot" | "loading" | "terminal";

export type DvdPosition = {
  x: number;
  y: number;
};
