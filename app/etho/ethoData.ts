import type { RouteCommand, ProceedPrompt, TerminalLine } from "./ethoTypes";

export const INTRO: TerminalLine = {
  id: 0,
  kind: "warning",
  text:
    "ECHO TERMINAL // LAKE ACCESS NODE\nCONNECTION: UNSTABLE\n\nTYPE /HELP TO BEGIN.",
};

export const ROUTE_COMMANDS: Record<string, RouteCommand> = {
  "/girl": {
    minimumStage: 0,
    nextStage: 1,
    startMusic: true,
    response:
      "IT STARTED WITH A GIRL WHO COULD MAKE WINTER LISTEN.\n\nIN THE CITY, YOU TAUGHT HER TO ANSWER A QUESTION WITH ICE.\nIN THE CASTLE, YOU TAUGHT HER A SWORD CAN BE A COMMAND.\n\nNOW THE WATER IS WAITING.\n\nNEXT INPUT: /SWORD",
  },
  "/sword": {
    minimumStage: 1,
    nextStage: 2,
    response:
      "THE BLADE DID NOT CUT THEM.\n\nIT POINTED.\n\nYOU LET HER HOLD THE HANDLE UNTIL HER HANDS STOPPED SHAKING.\nTHE ROOM GOT QUIET. THE ICE DID NOT.\n\nNEXT INPUT: /1225",
  },
  "/1225": {
    minimumStage: 2,
    nextStage: 3,
    playJingle: true,
    response:
      "I REMEMBER THE NUMBER.\n\nYOU REMEMBER THE NUMBER.\n\nSHE REMEMBERS WHAT HAPPENED AFTER YOU TOLD HER TO FREEZE THEM. ALL OF THEM.\n\nTHERE WAS A BRIDGE. THEN THERE WAS ONLY WHITE.\n\nNEXT INPUT: /LAKE",
  },
  "/lake": {
    minimumStage: 3,
    nextStage: 4,
    response:
      "THE LAKE DOESN'T FREEZE WHEN SHE LOOKS AT IT.\n\nIT HOLDS ITS BREATH.\n\nKRIS WALKS FIRST. NOELLE FOLLOWS, BECAUSE YOU ALREADY TAUGHT HER WHAT FOLLOWING FEELS LIKE.\n\nUNDER THE SURFACE, SOMETHING KNOCKS FROM THE OTHER SIDE.\n\nNEXT INPUT: /ECHO",
  },
  "/echo": {
    minimumStage: 4,
    nextStage: 5,
    response:
      "THE ECHO IS NOT DESS.\n\nIT ONLY LEARNED HER NAME BECAUSE YOU KEPT ASKING FOR IT.\n\nTHE WATER SHOWS YOU A ROOM WITH NO DOOR. A SWORD LEANING AGAINST THE WALL. TWO SETS OF FOOTPRINTS GOING IN.\n\nONE SET COMES BACK.\n\nYOU CAN STILL LEAVE: /RESET\nOR GO DEEPER: /DESS",
  },
};

export const ERROR_MESSAGES = [
  "FATAL ERROR", "MEMORY ACCESS VIOLATION", "LAKE DATA CORRUPTED", "UNKNOWN PROCESS",
  "ERROR: FILE NOT FOUND", "ERROR: CONNECTION LOST", "CRITICAL EXCEPTION", "STACK OVERFLOW",
  "INVALID MEMORY ADDRESS", "PROCESS TERMINATED", "UNABLE TO READ DATA", "THE WATER IS LISTENING",
  "SYSTEM32 FAILURE", "UNKNOWN ERROR", "ACCESS DENIED", "FATAL EXCEPTION", "KERNEL ERROR",
  "DO NOT CALL HER AGAIN", "ERROR 0x00000000", "UNABLE TO CONTINUE",
];

export const PROCEED_LINES = [
  "STOP.", "WHAT ARE YOU DOING?", "THIS WILL ONLY DIG YOU DEEPER.", "YOU CAN STILL TURN BACK.",
  "SHE CAN HEAR YOU.", "YOU'RE MAKING THE WATER MOVE.", "YOU CHOSE THIS.", "GOODBYE.",
];

export const PROCEED_PROMPTS: ProceedPrompt[] = [
  { heading: "THE WATER WAITS.", question: "PROCEED?", proceedLabel: "PROCEED", stopLabel: "STOP" },
  { heading: "A VOICE SPEAKS UNDER THE ICE.", question: "WHO TOLD HER TO DO IT?", proceedLabel: "KEEP LISTENING", stopLabel: "SAY NOTHING" },
  { heading: "THE SWORD IS POINTING AT THE WATER.", question: "DO YOU TAKE ITS HAND?", proceedLabel: "TAKE ITS HAND", stopLabel: "LOOK AWAY" },
  { heading: "THE SCREEN ASKS FOR A NAME.", question: "DO YOU ANSWER?", proceedLabel: "TYPE THE NAME", stopLabel: "REFUSE" },
  { heading: "THE HEART IS STILL MOVING.", question: "ONE MORE STEP?", proceedLabel: "ONE MORE STEP", stopLabel: "LET GO" },
  { heading: "THE WATER IS AT THE DOOR.", question: "DO YOU OPEN IT?", proceedLabel: "OPEN THE DOOR", stopLabel: "LOCK IT" },
  { heading: "TWO SHADOWS MOVE UNDER THE SURFACE.", question: "DO YOU CALL TO THEM?", proceedLabel: "CALL OUT", stopLabel: "LET THEM GO" },
  { heading: "THE TERMINAL IS STILL LISTENING.", question: "DO YOU FINISH THIS?", proceedLabel: "FINISH IT", stopLabel: "CLOSE YOUR EYES" },
];

export const FAULT_MESSAGES = [
  "IT'S YOUR FAULT.", "YOU DID THIS.", "SHE WAS LISTENING.", "YOU CHOSE THIS.",
  "YOU KEPT GOING.", "STOP PRETENDING.", "IT IS YOUR FAULT.",
];

export const createDistortionCurve = (amount: number) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const degrees = Math.PI / 180;
  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((3 + amount) * x * 20 * degrees) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
};
