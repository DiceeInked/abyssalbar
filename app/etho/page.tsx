"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";

const COMMANDS: Record<string, string> = {
  "/help": "TRY /girl OR /call out",

  "/call out":
    "YOUR CALLS WONT BE ANSWERED, YOU WONT BE HELPED, YOU WILL SUFER, YOU CHOSE THIS PATH",

  "/girl":
    "IT ALL STARTED FROM A GIRL WITH ICE POWERS, I WILL TELL MORE IF YOU KNOW THE CODE",

  "/1225":
    "you TOLD HER TO FREEZE THEM, ALL OF THEM, THEN THE BRID",

  "/next":
    "IT WAS THE MOST POWER SHE HAD FELT, you DID THIS THIS IS YOUR FAULT YOU HAVE TO DEAL WITH IT",
};

const ERROR_MESSAGES = [
  "FATAL ERROR",
  "MEMORY ACCESS VIOLATION",
  "SYSTEM FAILURE",
  "UNKNOWN PROCESS",
  "ERROR: FILE NOT FOUND",
  "ERROR: CONNECTION LOST",
  "CRITICAL EXCEPTION",
  "STACK OVERFLOW",
  "INVALID MEMORY ADDRESS",
  "PROCESS TERMINATED",
  "UNABLE TO READ DATA",
  "CORRUPTED DATA",
  "SYSTEM32 FAILURE",
  "UNKNOWN ERROR",
  "ACCESS DENIED",
  "FATAL EXCEPTION",
  "KERNEL ERROR",
  "CRITICAL SYSTEM FAILURE",
  "ERROR 0x00000000",
  "UNABLE TO CONTINUE",
];

type ErrorWindow = {
  id: number;
  message: string;
  x: number;
  y: number;
};

export default function Etho() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [typing, setTyping] = useState(false);

  const [dessMode, setDessMode] = useState(false);
  const [errorWindows, setErrorWindows] = useState<ErrorWindow[]>([]);

  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const jingle = useRef<HTMLAudioElement | null>(null);
  const music = useRef<HTMLAudioElement | null>(null);

  const audioContext = useRef<AudioContext | null>(null);
  const musicSource = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGain = useRef<GainNode | null>(null);
  const musicDelay = useRef<DelayNode | null>(null);
  const musicReverb = useRef<ConvolverNode | null>(null);

  useEffect(() => {
    jingle.current = new Audio("/weird-route-jingle.mp3");

    music.current = new Audio("/glacier.ogg");
    music.current.loop = true;
    music.current.crossOrigin = "anonymous";

    return () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }

      if (errorTimer.current) {
        clearInterval(errorTimer.current);
      }

      if (jingle.current) {
        jingle.current.pause();
        jingle.current.currentTime = 0;
      }

      if (music.current) {
        music.current.pause();
        music.current.currentTime = 0;
      }

      if (audioContext.current) {
        void audioContext.current.close();
      }
    };
  }, []);

  const slowAndReverbMusic = () => {
    if (!music.current) {
      return;
    }

    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();

        musicSource.current =
          audioContext.current.createMediaElementSource(
            music.current
          );

        musicGain.current =
          audioContext.current.createGain();

        musicDelay.current =
          audioContext.current.createDelay(5);

        musicReverb.current =
          audioContext.current.createConvolver();

        const sampleRate = audioContext.current.sampleRate;
        const duration = 3;

        const impulse =
          audioContext.current.createBuffer(
            2,
            sampleRate * duration,
            sampleRate
          );

        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);

          for (let i = 0; i < data.length; i++) {
            const decay = Math.pow(
              1 - i / data.length,
              2
            );

            data[i] =
              (Math.random() * 2 - 1) * decay;
          }
        }

        musicReverb.current.buffer = impulse;

        musicSource.current.connect(musicGain.current);

        musicSource.current.connect(musicDelay.current);
        musicDelay.current.connect(musicReverb.current);
        musicReverb.current.connect(musicGain.current);

        musicGain.current.connect(
          audioContext.current.destination
        );
      }

      if (audioContext.current.state === "suspended") {
        void audioContext.current.resume();
      }

      music.current.playbackRate = 0.65;

      if (musicGain.current) {
        musicGain.current.gain.value = 0.8;
      }

      if (musicDelay.current) {
        musicDelay.current.delayTime.value = 0.8;
      }

      void music.current.play().catch((error) => {
        console.error(
          "Could not play slowed music:",
          error
        );
      });
    } catch (error) {
      console.error(
        "Could not create audio effects:",
        error
      );
    }
  };

  const startDess = () => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
    }

    if (errorTimer.current) {
      clearInterval(errorTimer.current);
    }

    setTyping(false);
    setOutput("");
    setDessMode(true);
    setErrorWindows([]);

    let errorCount = 0;

    errorTimer.current = setInterval(() => {
      const newError: ErrorWindow = {
        id: errorCount,

        message:
          ERROR_MESSAGES[
            Math.floor(
              Math.random() * ERROR_MESSAGES.length
            )
          ],

        x: Math.random() * 75,
        y: Math.random() * 80,
      };

      setErrorWindows((current) => [
        ...current,
        newError,
      ]);

      errorCount++;

      if (errorCount >= 35) {
        if (errorTimer.current) {
          clearInterval(errorTimer.current);
        }

        errorTimer.current = null;
      }
    }, 100);
  };

  const typeText = (
    text: string,
    playJingle = false,
    startMusic = false
  ) => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
    }

    setOutput("");
    setTyping(true);

    // Start music immediately when /girl begins typing.
    if (startMusic && music.current) {
      music.current.currentTime = 0;
      music.current.playbackRate = 1;

      void music.current.play().catch((error) => {
        console.error(
          "Could not play background music:",
          error
        );
      });
    }

    let index = 0;

    typingTimer.current = setInterval(() => {
      index++;

      setOutput(text.slice(0, index));

      if (index >= text.length) {
        if (typingTimer.current) {
          clearInterval(typingTimer.current);
        }

        typingTimer.current = null;
        setTyping(false);

        // Play jingle after /1225 finishes.
        if (playJingle && jingle.current) {
          jingle.current.currentTime = 0;

          void jingle.current.play().catch((error) => {
            console.error(
              "Could not play jingle:",
              error
            );
          });
        }
      }
    }, 45);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (typing || dessMode) {
      return;
    }

    const command = input.trim().toLowerCase();

    if (!command) {
      return;
    }

    setInput("");

    if (command === "/dess") {
      slowAndReverbMusic();
      startDess();
      return;
    }

    const response =
      COMMANDS[command] ??
      `UNKNOWN COMMAND: ${command.toUpperCase()}`;

    typeText(
      response,
      command === "/1225",
      command === "/girl"
    );
  };

  /*
   * Makes YOU / YOUR / YOU'RE red.
   */
  const renderOutput = () => {
    const words = output.split(/(\s+)/);

    return words.map((word, index) => {
      const cleanWord = word
        .replace(/[.,!?;:'"]/g, "")
        .toLowerCase();

      const isRed =
        cleanWord === "you" ||
        cleanWord === "your" ||
        cleanWord === "you're" ||
        cleanWord === "youre";

      if (isRed) {
        return (
          <span
            key={index}
            className={styles.redText}
          >
            {word}
          </span>
        );
      }

      return (
        <span key={index}>
          {word}
        </span>
      );
    });
  };

  return (
    <main
      className={`${styles.page} ${
        dessMode ? styles.dessPage : ""
      }`}
    >
      {/* CRT SCREEN */}

      <div className={styles.crt}>

        {/* CRT EFFECTS STAY ACTIVE */}
        <div className={styles.scanlines} />
        <div className={styles.screenNoise} />
        <div className={styles.vignette} />

        {/* NORMAL TERMINAL */}

        {!dessMode && (
          <div className={styles.content}>
            <div className={styles.output}>
              {renderOutput()}

              {typing && (
                <span className={styles.cursor}>
                  _
                </span>
              )}
            </div>

            <form
              className={styles.inputArea}
              onSubmit={handleSubmit}
            >
              <span className={styles.prompt}>
                &gt;
              </span>

              <input
                className={styles.input}
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="TYPE /COMMAND..."
                autoComplete="off"
                spellCheck={false}
                aria-label="Etho command input"
                disabled={typing}
                autoFocus
              />
            </form>
          </div>
        )}

        {/* DESS ERROR SCREEN */}

        {dessMode && (
          <div className={styles.errorScreen}>
            {errorWindows.map((error) => (
              <div
                key={error.id}
                className={styles.errorWindow}
                style={{
                  left: `${error.x}%`,
                  top: `${error.y}%`,
                }}
              >
                <div className={styles.errorTitle}>
                  SYSTEM ERROR
                </div>

                <div className={styles.errorBody}>
                  <div className={styles.errorIcon}>
                    !
                  </div>

                  <div>
                    <strong>
                      {error.message}
                    </strong>

                    <p>
                      AN UNEXPECTED ERROR HAS OCCURRED.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.errorButton}
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
