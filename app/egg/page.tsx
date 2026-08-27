"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const RANDOM_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?`~\\\"";
const VISIBLE_LINES = 64;
const MIN_LINE_LENGTH = 8;
const MAX_LINE_LENGTH = 128;
const ZERO_LINE_LENGTH = 64;
const UPDATE_MS = 20;
const FONT_SIZE_PX = 10;

const randomInt = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const makeLine = (zeroMode: boolean) => {
  const length = zeroMode
    ? ZERO_LINE_LENGTH
    : randomInt(MIN_LINE_LENGTH, MAX_LINE_LENGTH);
  const characters = new Array<string>(length);

  for (let index = 0; index < length; index += 1) {
    characters[index] =
      RANDOM_CHARACTERS[randomInt(0, RANDOM_CHARACTERS.length - 1)];
  }

  return zeroMode ? characters.join(" ") : characters.join("");
};

const makeFrame = (zeroMode: boolean) => {
  const lines = new Array<string>(VISIBLE_LINES);
  for (let index = 0; index < VISIBLE_LINES; index += 1) {
    lines[index] = makeLine(zeroMode);
  }
  return lines;
};

export default function Egg() {
  const outputRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return;

    const zeroMode = new URLSearchParams(window.location.search).get("mode") === "0";
    const lines = makeFrame(zeroMode);

    const render = () => {
      output.textContent = lines.join("\n");
    };

    render();

    // Keep exactly 64 slots. A new line replaces slot 1, the old slots shift,
    // and the DOM remains a single text node for predictable, low-cost updates.
    const timer = window.setInterval(() => {
      for (let index = 0; index < VISIBLE_LINES - 1; index += 1) {
        lines[index] = lines[index + 1];
      }
      lines[VISIBLE_LINES - 1] = makeLine(zeroMode);
      render();
    }, UPDATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const style = {
    "--egg-font-size": `${FONT_SIZE_PX}px`,
  } as CSSProperties;

  return (
    <main className="egg-terminal" style={style}>
      <pre ref={outputRef} className="egg-output" aria-label="Random character stream" />
    </main>
  );
}
