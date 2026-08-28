"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-/\\[]{}()<>:;,.=+*#@$%&?!|~^";
const LINES = 80;
const LINE_LENGTH = 110;

const makeLine = () => {
  let line = "";

  for (let index = 0; index < LINE_LENGTH; index += 1) {
    line += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }

  return line;
};

export default function Egg() {
  const [lines, setLines] = useState<string[]>(() =>
    Array.from({ length: LINES }, makeLine)
  );
  const outputRef = useRef<HTMLDivElement>(null);

  const generatedLines = useMemo(
    () => Array.from({ length: 12 }, makeLine),
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLines((current) => [
        ...current.slice(generatedLines.length),
        ...Array.from({ length: generatedLines.length }, makeLine),
      ]);
    }, 45);

    return () => window.clearInterval(interval);
  }, [generatedLines.length]);

  useEffect(() => {
    const output = outputRef.current;

    if (output) {
      output.scrollTop = output.scrollHeight;
    }
  }, [lines]);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
        color: "#00ffc8",
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: "8px",
        lineHeight: "1.05",
        padding: "8px",
        textShadow: "0 0 4px rgba(0, 255, 200, 0.35)",
      }}
    >
      <div
        ref={outputRef}
        aria-label="Egg terminal output"
        style={{
          height: "100%",
          overflow: "hidden",
          whiteSpace: "pre",
          wordBreak: "normal",
        }}
      >
        {lines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </main>
  );
}
