"use client";

import { useEffect, useState, type CSSProperties } from "react";

const RANDOM_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?`~\\\"";

const VISIBLE_LINES = 64;
const MIN_LINE_LENGTH = 8;
const MAX_LINE_LENGTH = 128;
const FIXED_LINE_LENGTH = 64;
const UPDATE_INTERVAL_MS = 28;
const FONT_SIZE_PX = 10;

const randomInt = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const randomCharacter = () =>
  RANDOM_CHARACTERS[randomInt(0, RANDOM_CHARACTERS.length - 1)];

const makeRandomLine = (length: number, spaced: boolean) => {
  if (!spaced) {
    return Array.from({ length }, randomCharacter).join("");
  }

  return Array.from({ length }, randomCharacter).join(" ");
};

export default function Egg() {
  const [zeroMode, setZeroMode] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    setZeroMode(mode === "0");
  }, []);

  useEffect(() => {
    const makeLine = () =>
      zeroMode
        ? makeRandomLine(FIXED_LINE_LENGTH, true)
        : makeRandomLine(randomInt(MIN_LINE_LENGTH, MAX_LINE_LENGTH), false);

    setLines(Array.from({ length: VISIBLE_LINES }, makeLine));

    const interval = window.setInterval(() => {
      setLines((current) => [...current, makeLine()].slice(-VISIBLE_LINES));
    }, UPDATE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [zeroMode]);

  const eggStyle = {
    "--egg-font-size": `${FONT_SIZE_PX}px`,
  } as CSSProperties;

  return (
    <main className="egg-terminal" style={eggStyle}>
      <div className="scanlines" />
      <div className="egg-output" aria-label="Rapidly generated random characters">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="egg-line">
            {line}
          </div>
        ))}
      </div>
    </main>
  );
}
