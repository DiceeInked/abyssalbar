"use client";

import { useEffect, useState } from "react";

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-/\\[]{}()<>:;,.=+*#@$%&?!|~^";

const MIN_LINE_LENGTH = 16;
const MAX_LINE_LENGTH = 256;
const ZERO_MODE_LINE_LENGTH = 256;
const VISIBLE_LINES = 180;
const BATCH_SIZE = 12;
const REFRESH_INTERVAL_MS = 45;

const makeLine = (length: number) => {
  let line = "";

  for (let index = 0; index < length; index += 1) {
    line += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }

  return line;
};

export default function Egg() {
  const [zeroMode, setZeroMode] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    setZeroMode(mode === "0");
  }, []);

  useEffect(() => {
    const getLineLength = () =>
      zeroMode
        ? ZERO_MODE_LINE_LENGTH
        : Math.floor(
            Math.random() * (MAX_LINE_LENGTH - MIN_LINE_LENGTH + 1)
          ) + MIN_LINE_LENGTH;

    const initialLines = Array.from({ length: VISIBLE_LINES }, () =>
      makeLine(getLineLength())
    );

    setLines(initialLines);

    const interval = window.setInterval(() => {
      setLines((current) => {
        const newLines = Array.from({ length: BATCH_SIZE }, () =>
          makeLine(getLineLength())
        );

        return [...current.slice(BATCH_SIZE), ...newLines];
      });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [zeroMode]);

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
          <div key={`${index}-${line}`}>
            {line}
            {zeroMode && <div style={{ height: "8px" }} />}
          </div>
        ))}
      </div>
    </main>
  );
}
