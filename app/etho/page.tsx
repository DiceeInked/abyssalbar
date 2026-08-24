"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";

type TerminalLine = {
  id: number;
  kind: "command" | "response" | "warning";
  text: string;
};

type ErrorWindow = {
  id: number;
  message: string;
  x: number;
  y: number;
};

type RouteCommand = {
  minimumStage: number;
  nextStage: number;
  response: string;
  startMusic?: boolean;
  playJingle?: boolean;
};

const INTRO: TerminalLine = {
  id: 0,
  kind: "warning",
  text:
    "ECHO TERMINAL // LAKE ACCESS NODE\nCONNECTION: UNSTABLE\n\nTYPE /HELP TO BEGIN.",
};

/*
 * This is original fan-route writing, rather than a claim about the
 * official Deltarune story. Keep the command names if you want players to
 * recognize your existing route, and change the text to fit your theory.
 */
const ROUTE_COMMANDS: Record<string, RouteCommand> = {
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

const ERROR_MESSAGES = [
  "FATAL ERROR",
  "MEMORY ACCESS VIOLATION",
  "LAKE DATA CORRUPTED",
  "UNKNOWN PROCESS",
  "ERROR: FILE NOT FOUND",
  "ERROR: CONNECTION LOST",
  "CRITICAL EXCEPTION",
  "STACK OVERFLOW",
  "INVALID MEMORY ADDRESS",
  "PROCESS TERMINATED",
  "UNABLE TO READ DATA",
  "THE WATER IS LISTENING",
  "SYSTEM32 FAILURE",
  "UNKNOWN ERROR",
  "ACCESS DENIED",
  "FATAL EXCEPTION",
  "KERNEL ERROR",
  "DO NOT CALL HER AGAIN",
  "ERROR 0x00000000",
  "UNABLE TO CONTINUE",
];

export default function Etho() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<TerminalLine[]>([INTRO]);
  const [liveOutput, setLiveOutput] = useState("");
  const [typing, setTyping] = useState(false);
  const [routeStage, setRouteStage] = useState(0);
  const [dessMode, setDessMode] = useState(false);
  const [errorWindows, setErrorWindows] = useState<ErrorWindow[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextLineId = useRef(1);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jingle = useRef<HTMLAudioElement | null>(null);
  const music = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const musicSource = useRef<MediaElementAudioSourceNode | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const dryGain = useRef<GainNode | null>(null);
  const wetGain = useRef<GainNode | null>(null);
  const musicDelay = useRef<DelayNode | null>(null);
  const musicReverb = useRef<ConvolverNode | null>(null);

  const addLine = (kind: TerminalLine["kind"], text: string) => {
    setHistory((current) => [
      ...current,
      { id: nextLineId.current++, kind, text },
    ]);
  };

  useEffect(() => {
    jingle.current = new Audio("/weird-route-jingle.mp3");
    music.current = new Audio("/glacier.ogg");
    music.current.loop = true;
    music.current.crossOrigin = "anonymous";

    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      if (errorTimer.current) clearInterval(errorTimer.current);
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);

      jingle.current?.pause();
      if (jingle.current) jingle.current.currentTime = 0;

      music.current?.pause();
      if (music.current) music.current.currentTime = 0;

      if (audioContext.current && audioContext.current.state !== "closed") {
        void audioContext.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [history, liveOutput]);

  useEffect(() => {
    if (!typing && !dessMode) inputRef.current?.focus();
  }, [typing, dessMode]);

  const typeText = (
    text: string,
    options: Pick<RouteCommand, "playJingle"> = {}
  ) => {
    if (typingTimer.current) clearInterval(typingTimer.current);

    setLiveOutput("");
    setTyping(true);
    let index = 0;

    typingTimer.current = setInterval(() => {
      index += 1;
      setLiveOutput(text.slice(0, index));

      if (index < text.length) return;

      if (typingTimer.current) clearInterval(typingTimer.current);
      typingTimer.current = null;
      setTyping(false);
      setLiveOutput("");
      addLine("response", text);

      if (options.playJingle && jingle.current) {
        jingle.current.currentTime = 0;
        void jingle.current.play().catch(() => undefined);
      }
    }, 28);
  };

  const startNormalMusic = () => {
    if (!music.current) return;

    if (audioContext.current?.state === "suspended") {
      void audioContext.current.resume();
    }

    if (dryGain.current) dryGain.current.gain.value = 1;
    if (wetGain.current) wetGain.current.gain.value = 0;
    if (masterGain.current) masterGain.current.gain.value = 1;
    if (musicDelay.current) musicDelay.current.delayTime.value = 0;

    music.current.playbackRate = 1;
    music.current.currentTime = 0;
    void music.current.play().catch(() => undefined);
  };

  const makeMusicUnsettling = () => {
    if (!music.current) return;

    try {
      if (!audioContext.current) {
        const context = new AudioContext();
        const source = context.createMediaElementSource(music.current);
        const master = context.createGain();
        const dry = context.createGain();
        const wet = context.createGain();
        const delay = context.createDelay(4);
        const reverb = context.createConvolver();
        const duration = 2.6;
        const impulse = context.createBuffer(
          2,
          Math.floor(context.sampleRate * duration),
          context.sampleRate
        );

        for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
          const data = impulse.getChannelData(channel);
          for (let index = 0; index < data.length; index += 1) {
            const decay = Math.pow(1 - index / data.length, 2.4);
            data[index] = (Math.random() * 2 - 1) * decay;
          }
        }

        reverb.buffer = impulse;
        delay.delayTime.value = 0.63;
        dry.gain.value = 0.64;
        wet.gain.value = 0.38;
        master.gain.value = 0.82;

        source.connect(dry);
        dry.connect(master);
        source.connect(delay);
        delay.connect(reverb);
        reverb.connect(wet);
        wet.connect(master);
        master.connect(context.destination);

        audioContext.current = context;
        musicSource.current = source;
        masterGain.current = master;
        dryGain.current = dry;
        wetGain.current = wet;
        musicDelay.current = delay;
        musicReverb.current = reverb;
      }

      if (audioContext.current.state === "suspended") {
        void audioContext.current.resume();
      }

      if (dryGain.current) dryGain.current.gain.value = 0.64;
      if (wetGain.current) wetGain.current.gain.value = 0.38;
      if (masterGain.current) masterGain.current.gain.value = 0.82;
      if (musicDelay.current) musicDelay.current.delayTime.value = 0.63;

      music.current.playbackRate = 0.68;
      void music.current.play().catch(() => undefined);
    } catch {
      /* The terminal still works if a browser rejects Web Audio. */
      music.current.playbackRate = 0.68;
      void music.current.play().catch(() => undefined);
    }
  };

  const stopMusic = () => {
    if (!music.current) return;
    music.current.pause();
    music.current.currentTime = 0;
    music.current.playbackRate = 1;
  };

  const startDess = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    if (errorTimer.current) clearInterval(errorTimer.current);
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);

    setTyping(false);
    setLiveOutput("");
    setDessMode(true);
    setErrorWindows([]);

    let errorCount = 0;
    errorTimer.current = setInterval(() => {
      const panelWidth = Math.min(288, Math.max(230, window.innerWidth - 28));
      const panelHeight = 158;
      const newError: ErrorWindow = {
        id: errorCount,
        message:
          ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)],
        x: Math.max(10, Math.random() * (window.innerWidth - panelWidth - 20)),
        y: Math.max(10, Math.random() * (window.innerHeight - panelHeight - 20)),
      };

      setErrorWindows((current) => [...current, newError]);
      errorCount += 1;

      if (errorCount < 30) return;

      if (errorTimer.current) clearInterval(errorTimer.current);
      errorTimer.current = null;

      recoveryTimer.current = setTimeout(() => {
        setDessMode(false);
        setErrorWindows([]);
        addLine("warning", "[ CONNECTION RESTORED // SOME DATA COULD NOT BE RECOVERED ]");
        typeText(
          "THE SCREEN COMES BACK.\n\nTHE LAKE IS STILL THERE.\n\nSO IS THE ECHO.\n\nTYPE /RESET IF YOU WANT TO PRETEND THIS DIDN'T HAPPEN."
        );
      }, 850);
    }, 105);
  };

  const getHelpText = () => {
    const routeHint = ["/GIRL"];
    if (routeStage >= 1) routeHint.push("/SWORD");
    if (routeStage >= 2) routeHint.push("/1225");
    if (routeStage >= 3) routeHint.push("/LAKE");
    if (routeStage >= 4) routeHint.push("/ECHO");
    if (routeStage >= 5) routeHint.push("/DESS");

    return [
      "ECHO TERMINAL // AVAILABLE INPUTS",
      "",
      "/HELP     SHOW THIS LIST",
      "/CALLOUT  TEST THE CONNECTION",
      "/NEXT     REPEAT THE NEXT ROUTE INPUT",
      "/CLEAR    CLEAR TERMINAL HISTORY",
      "/RESET    RESET THE ROUTE",
      "",
      `ROUTE INPUTS: ${routeHint.join("  ")}`,
    ].join("\n");
  };

  const getNextText = () => {
    const nextCommands = ["/SWORD", "/1225", "/LAKE", "/ECHO", "/DESS"];
    const nextCommand = nextCommands[routeStage];

    if (!nextCommand) {
      return "THERE IS NO NEXT STEP.\n\nTHERE IS ONLY /RESET.";
    }

    return `NEXT INPUT: ${nextCommand}`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typing || dessMode) return;

    const command = input.trim().toLowerCase();
    if (!command) return;
    setInput("");

    if (command === "/clear") {
      setHistory([]);
      setLiveOutput("");
      return;
    }

    addLine("command", `> ${command.toUpperCase()}`);

    if (command === "/help") {
      typeText(getHelpText());
      return;
    }

    if (command === "/next") {
      typeText(getNextText());
      return;
    }

    if (command === "/reset") {
      stopMusic();
      setRouteStage(0);
      typeText("ROUTE STATE CLEARED.\n\nTHE TERMINAL REMEMBERS ANYWAY.\n\nNEXT INPUT: /GIRL");
      return;
    }

    if (command === "/callout") {
      const response =
        routeStage >= 4
          ? "THE LINE OPENS.\n\nYOU HEAR WATER MOVING THROUGH A PHONE THAT IS NOT CONNECTED.\n\nTHEN: \"DON'T MAKE HER DO IT AGAIN.\""
          : "YOUR CALLS WON'T BE ANSWERED.\nYOU WON'T BE HELPED.\nYOU WILL SUFFER.\n\nYOU CHOSE THIS PATH.";
      typeText(response);
      return;
    }

    if (command === "/dess") {
      if (routeStage < 5) {
        typeText("THE NAME DOES NOT ANSWER.\n\nTHE WATER HAS NOT OPENED YET.");
        return;
      }

      makeMusicUnsettling();
      startDess();
      return;
    }

    const routeCommand = ROUTE_COMMANDS[command];
    if (!routeCommand) {
      typeText(`UNKNOWN COMMAND: ${command.toUpperCase()}`);
      return;
    }

    if (routeStage < routeCommand.minimumStage) {
      typeText("ACCESS DENIED.\n\nYOU ARE SKIPPING A MEMORY.\n\nTYPE /NEXT.");
      return;
    }

    setRouteStage((current) => Math.max(current, routeCommand.nextStage));
    if (routeCommand.startMusic) startNormalMusic();
    typeText(routeCommand.response, { playJingle: routeCommand.playJingle });
  };

  const renderText = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:'"]/g, "").toLowerCase();
      const isRed = ["you", "your", "you're", "youre"].includes(cleanWord);

      return (
        <span key={`${word}-${index}`} className={isRed ? styles.redText : undefined}>
          {word}
        </span>
      );
    });
  };

  return (
    <main className={`${styles.page} ${dessMode ? styles.dessPage : ""}`}>
      <div className={styles.crt}>
        {!dessMode && (
          <>
            <div className={styles.scanlines} />
            <div className={styles.screenNoise} />
            <div className={styles.vignette} />

            <div className={styles.content}>
              <div ref={terminalRef} className={styles.output} aria-live="polite">
                {history.map((line) => (
                  <p key={line.id} className={`${styles.line} ${styles[line.kind]}`}>
                    {renderText(line.text)}
                  </p>
                ))}
                {liveOutput && (
                  <p className={`${styles.line} ${styles.response}`}>
                    {renderText(liveOutput)}
                    <span className={styles.cursor}>_</span>
                  </p>
                )}
              </div>

              <form className={styles.inputArea} onSubmit={handleSubmit}>
                <span className={styles.prompt}>&gt;</span>
                <input
                  ref={inputRef}
                  className={styles.input}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="TYPE /COMMAND..."
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Echo terminal command input"
                  disabled={typing || dessMode}
                />
              </form>
            </div>
          </>
        )}

        {dessMode && (
          <div className={styles.errorScreen} aria-label="Terminal failure sequence">
            {errorWindows.map((error) => (
              <div
                key={error.id}
                className={styles.errorWindow}
                style={{ left: error.x, top: error.y }}
              >
                <div className={styles.errorTitle}>LAKE.EXE - SYSTEM ERROR</div>
                <div className={styles.errorBody}>
                  <div className={styles.errorIcon}>!</div>
                  <div>
                    <strong>{error.message}</strong>
                    <p>AN UNEXPECTED ERROR HAS OCCURRED.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.errorButton}
                  onClick={() =>
                    setErrorWindows((current) =>
                      current.filter((window) => window.id !== error.id)
                    )
                  }
                >
                  OK
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
