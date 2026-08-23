"use client";

import { FormEvent, useState } from "react";
import styles from "./Etho.module.css";

export default function Etho() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("Etho page hehe =]");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const command = input.trim().toLowerCase();

    if (command === "") {
      return;
    }

    if (command === "/room") {
      setOutput("there is a tree here");
    } else if (command === "/tree") {
      setOutput("he is behind the tree");
    } else if (command === "/man") {
      setOutput("he gives you an egg");
    } else {
      setOutput(`unknown command: ${command}`);
    }

    setInput("");
  };

  return (
    <main className={styles.page}>
      <div className={styles.scanlines} />

      <div className={styles.container}>
        <section className={styles.window}>
          <div className={styles.title}>ETHO</div>

          <div className={styles.output}>
            <p>{output}</p>
          </div>

          <form className={styles.inputArea} onSubmit={handleSubmit}>
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
            />

            <button className={styles.button} type="submit">
              ENTER
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
