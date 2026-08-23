"use client";

import { useEffect, useState } from "react";

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-/\\[]{}()<>:;,.=+*#@$%&?!|~^";
const LINE_LENGTH = 180;
const VISIBLE_LINES = 180;
const BATCH_SIZE = 12;

const makeLine = () => {
  let line = "";

  for (let index = 0; index < LINE_LENGTH; index += 1) {
    line += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
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
    }, 45);

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
