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

export default function Etho() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [typing, setTyping] = useState(false);

  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sound for /1225
  const jingle = useRef<HTMLAudioElement | null>(null);

  // Background music for /girl
  const music = useRef<HTMLAudioElement | null>(null);

  /*
   * Load both audio files when the page loads.
   */
  useEffect(() => {
    jingle.current = new Audio("/weird-route-jingle.mp3");

    music.current = new Audio("/glacier.ogg");

    // Make glacier.ogg loop forever
    music.current.loop = true;

    return () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }

      if (jingle.current) {
        jingle.current.pause();
        jingle.current.currentTime = 0;
      }

      if (music.current) {
        music.current.pause();
        music.current.currentTime = 0;
      }
    };
  }, []);

  /*
   * Types text onto the CRT one character at a time.
   *
   * playJingle:
   * Plays weird-route-jingle.mp3 after the text finishes.
   *
   * startMusic:
   * Starts glacier.ogg immediately when typing begins.
   */
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

    /*
     * Start glacier immediately.
     */
    if (startMusic && music.current) {
      music.current.currentTime = 0;

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

      /*
       * Text has finished typing.
       */
      if (index >= text.length) {
        if (typingTimer.current) {
          clearInterval(typingTimer.current);
        }

        typingTimer.current = null;
        setTyping(false);

        /*
         * Play the special jingle AFTER /1225 finishes.
         */
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

  /*
   * Handles commands typed into the terminal.
   */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    /*
     * Don't allow another command while text is typing.
     */
    if (typing) {
      return;
    }

    const command = input.trim().toLowerCase();

    if (!command) {
      return;
    }

    const response =
      COMMANDS[command] ??
      `UNKNOWN COMMAND: ${command.toUpperCase()}`;

    setInput("");

    /*
     * /1225:
     *   Text types
     *   Then weird-route-jingle.mp3 plays
     *
     * /girl:
     *   glacier.ogg starts immediately
     *   Text types at the same time
     */
    typeText(
      response,
      command === "/1225",
      command === "/girl"
    );
  };

  /*
   * Makes YOU, YOUR, YOU'RE and YOURE red.
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
    <main className={styles.page}>
      <div className={styles.crt}>

        {/* CRT scanlines */}
        <div className={styles.scanlines} />

        {/* CRT screen noise */}
        <div className={styles.screenNoise} />

        {/* Dark edges around the screen */}
        <div className={styles.vignette} />

        <div className={styles.content}>

          {/* Terminal output */}
          <div className={styles.output}>
            {renderOutput()}

            {typing && (
              <span className={styles.cursor}>
                _
              </span>
            )}
          </div>

          {/* Command input */}
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
      </div>
    </main>
  );
}
