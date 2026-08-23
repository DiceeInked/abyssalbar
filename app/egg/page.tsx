"use client";

import { useEffect, useState } from "react";

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-/\\[]{}()<>:;,.=+*#@$%&?!|~^";

const MIN_LINE_LENGTH = 100;
const MAX_LINE_LENGTH = 300;
const VISIBLE_LINES = 180;
const BATCH_SIZE = 12;
const REFRESH_INTERVAL_MS = 45;

// Lower values make random spaces more common.
// For example, 8 means roughly a 1-in-8 chance at each eligible position.
const SPACE_CHANCE_DENOMINATOR = 16;

const makeLine = () => {
  const length =
    Math.floor(
      Math.random() * (MAX_LINE_LENGTH - MIN_LINE_LENGTH + 1)
    ) + MIN_LINE_LENGTH;

  let line = "";

  for (let index = 0; index < length; index += 1) {
    line += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    const nextCharacterExists = index < length - 1;
    const previousCharacter = line[line.length - 1];
    const shouldAddSpace =
      nextCharacterExists &&
      previousCharacter !== " " &&
      Math.floor(Math.random() * SPACE_CHANCE_DENOMINATOR) === 0;

    if (shouldAddSpace) {
      line += " ";
    }
  }

  return line;
};

const makeLines = (count: number) =>
  Array.from({ length: count }, makeLine);

export default function Egg() {
  const [lines, setLines] = useState<string[]>(() =>
    makeLines(VISIBLE_LINES)
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLines((current) => [
        ...current.slice(BATCH_SIZE),
        ...makeLines(BATCH_SIZE),
      ]);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        background: "#000",
        color: "#00ffc8",
        fontFamily: "monospace",
        fontSize: "8px",
        lineHeight: "1.05",
        textShadow: "0 0 4px rgba(0, 255, 200, 0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          width: "100%",
          height: "100%",
          whiteSpace: "pre",
        }}
      >
        {lines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </main>
  );
}
