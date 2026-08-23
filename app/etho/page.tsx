"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";
import weirdRouteJingle from "./weird-route-jingle.mp3";

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

  const jingle = useRef<HTMLAudioElement | null>(null);

  /*
   * Load the sound when the page starts.
   */
  useEffect(() => {
    jingle.current = new Audio(weirdRouteJingle);

    return () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }

      if (jingle.current) {
        jingle.current.pause();
        jingle.current.currentTime = 0;
      }
    };
  }, []);

  /*
   * Types the message onto the CRT one character at a time.
   */
  const typeText = (text: string, playSound = false) => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
    }

    setOutput("");
    setTyping(true);

    let index = 0;

    typingTimer.current = setInterval(() => {
      index++;

      setOutput(text.slice(0, index));

      /*
       * When the entire message has finished typing...
       */
      if (index >= text.length) {
        if (typingTimer.current) {
          clearInterval(typingTimer.current);
        }

        typingTimer.current = null;
        setTyping(false);

        /*
         * Play the special sound after /1225 finishes.
         */
        if (playSound && jingle.current) {
          jingle.current.currentTime = 0;

          void jingle.current.play().catch((error) => {
            console.error("Could not play sound:", error);
          });
        }
      }
    }, 45);
  };

  /*
   * Handles commands entered into the terminal.
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
      COMMANDS[command] ?? `UNKNOWN COMMAND: ${command.toUpperCase()}`;

    setInput("");

    /*
     * Only /1225 triggers the weird-route-jingle.mp3 sound.
     */
    typeText(response, command === "/1225");
  };

  /*
   * Finds YOU, YOUR, YOU'RE and YOURE
   * and makes them red.
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
      {/* CRT effects */}
      <div className={styles.crt}>
        <div className={styles.scanlines} />
        <div className={styles.screenNoise} />
        <div className={styles.vignette} />

        {/* Terminal content */}
        <div className={styles.content}>
          {/* Command output */}
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
