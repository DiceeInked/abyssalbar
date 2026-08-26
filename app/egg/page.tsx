"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const RANDOM_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?`~\\\"";

const VISIBLE_LINES = 64;
const MIN_LINE_LENGTH = 8;
const MAX_LINE_LENGTH = 128;
const FIXED_LINE_LENGTH = 64;
const UPDATE_INTERVAL_MS = 16;
const FONT_SIZE_PX = 10;

const randomInt = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const randomCharacter = () =>
  RANDOM_CHARACTERS[randomInt(0, RANDOM_CHARACTERS.length - 1)];

const makeRandomLine = (length: number, spaced: boolean) => {
  const characters = new Array<string>(length);

  for (let index = 0; index < length; index += 1) {
    characters[index] = randomCharacter();
  }

  return spaced ? characters.join(" ") : characters.join("");
};

const makeLine = (zeroMode: boolean) =>
  zeroMode
    ? makeRandomLine(FIXED_LINE_LENGTH, true)
    : makeRandomLine(randomInt(MIN_LINE_LENGTH, MAX_LINE_LENGTH), false);

const makeInitialLines = (zeroMode: boolean) => {
  const initialLines = new Array<string>(VISIBLE_LINES);

  for (let index = 0; index < VISIBLE_LINES; index += 1) {
    initialLines[index] = makeLine(zeroMode);
  }

  return initialLines;
};

export default function Egg() {
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const zeroMode = new URLSearchParams(window.location.search).get("mode") === "0";
    const output = outputRef.current;

    if (!output) return;

    const lines = makeInitialLines(zeroMode);
    output.textContent = lines.join("\n");

    // Deliberately update one text node instead of re-rendering 64 React elements.
    // The array acts as a fixed-size ring: one new line enters, one old line leaves.
    const update = () => {
      lines.shift();
      lines.push(makeLine(zeroMode));
      output.textContent = lines.join("\n");
    };

    const interval = window.setInterval(update, UPDATE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  const eggStyle = {
    "--egg-font-size": `${FONT_SIZE_PX}px`,
  } as CSSProperties;

  return (
    <main className="egg-terminal" style={eggStyle}>
      <div className="scanlines" aria-hidden="true" />
      <div
        ref={outputRef}
        className="egg-output"
        aria-label="Rapidly generated random characters"
      />
    </main>
  );
}
