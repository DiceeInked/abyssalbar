"use client";

import { useEffect, useState } from "react";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SEPARATORS = "+-*/=%^";
const CONTAINERS: Array<[string, string]> = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"],
];

// All adjustable random quantities use powers of two.
const BIT_VALUES = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

const PREFIX_LENGTHS = [4, 8, 16] as const;
const CONTAINER_COUNTS = [1, 2, 4, 8, 16] as const;
const INNER_CHARACTER_COUNTS = [1, 2, 4, 8, 16] as const;

const MIN_LINE_LENGTH = 100;
const MAX_LINE_LENGTH = 300;
const VISIBLE_LINES = 180;
const BATCH_SIZE = 12;
const REFRESH_INTERVAL_MS = 45;

// Lower values make random spaces more common. For example, 8 means
// roughly a 1-in-8 chance at each eligible position.
const SPACE_CHANCE_DENOMINATOR = 16;

const randomFrom = <T,>(values: readonly T[]) =>
  values[Math.floor(Math.random() * values.length)];

const randomCharacters = (length: number) => {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += randomFrom(CHARACTERS);
  }

  return value;
};

const addRandomSpaces = (value: string) => {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    result += character;

    const nextCharacter = value[index + 1];
    const canAddSpace =
      nextCharacter !== undefined &&
      character !== " " &&
      nextCharacter !== " " &&
      Math.floor(Math.random() * SPACE_CHANCE_DENOMINATOR) === 0;

    if (canAddSpace) {
      result += " ";
    }
  }

  return result;
};

const makeContainerExpression = () => {
  const [opening, closing] = randomFrom(CONTAINERS);
  const characterCount = randomFrom(INNER_CHARACTER_COUNTS);
  const separator = randomFrom(SEPARATORS);
  const charactersBeforeSeparator = Math.max(
    1,
    Math.floor(characterCount / 2)
  );
  const charactersAfterSeparator = Math.max(
    1,
    characterCount - charactersBeforeSeparator
  );

  return `${opening}${randomCharacters(
    charactersBeforeSeparator
  )}${separator}${randomCharacters(charactersAfterSeparator)}${closing}`;
};

const makeLine = () => {
  for (let attempt = 0; attempt < BIT_VALUES.length * 2; attempt += 1) {
    const prefixLength = randomFrom(PREFIX_LENGTHS);
    const prefix = randomCharacters(prefixLength);
    const separator = randomFrom(SEPARATORS);
    const targetContainerCount = randomFrom(CONTAINER_COUNTS);
    const expressions = Array.from(
      { length: targetContainerCount },
      makeContainerExpression
    );
    const line = `${prefix} ${separator} ${expressions.join(" ")}`;

    if (line.length >= MIN_LINE_LENGTH && line.length <= MAX_LINE_LENGTH) {
      return addRandomSpaces(line);
    }
  }

  const prefix = randomCharacters(randomFrom(PREFIX_LENGTHS));
  const separator = randomFrom(SEPARATORS);
  const expressions: string[] = [];

  while (`${prefix} ${separator} ${expressions.join(" ")}`.length < MIN_LINE_LENGTH) {
    expressions.push(makeContainerExpression());
  }

  return addRandomSpaces(
    `${prefix} ${separator} ${expressions.join(" ")}`.slice(
      0,
      MAX_LINE_LENGTH
    )
  );
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
