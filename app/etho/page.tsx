"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";

const COMMANDS: Record<string, string> = {
  "/help": "TRY /room OR /call"
  "/call": "YOUR CALLS WONT BE ANSWERED YOU WONT BE HELPED YOU WILL SUFER",
  "/room": "THERE IS A TREE HERE",
  "/tree": "HE IS BEHIND THE TREE",
  "/man": "THE MAN GIVES YOU AN EGG,THERE IS NO MAN HERE",
};

export default function Etho() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [typing, setTyping] = useState(false);

  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }
    };
  }, []);

  const typeText = (text: string) => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
    }

    setOutput("");
    setTyping(true);

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
      }
    }, 45);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (typing) {
      return;
    }

    const command = input.trim().toLowerCase();

    if (!command) {
      return;
    }

    const response =
      COMMANDS[command] ?? `unknown command: ${command}`;

    setInput("");
    typeText(response);
  };

  return (
    <main className={styles.page}>
      <div className={styles.crt}>
        <div className={styles.scanlines} />
        <div className={styles.screenNoise} />
        <div className={styles.vignette} />

        <div className={styles.content}>
          <div className={styles.output}>
            {output}
            {typing && <span className={styles.cursor}>_</span>}
          </div>

          <form
            className={styles.inputArea}
            onSubmit={handleSubmit}
          >
            <span className={styles.prompt}>&gt;</span>

            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="type /command..."
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
