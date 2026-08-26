"use client";

import { useEffect, useState, type CSSProperties } from "react";

const IDENTIFIERS = [
  "boot", "cache", "node", "frame", "packet", "buffer", "socket", "drive",
  "render", "memory", "kernel", "thread", "signal", "index", "stream", "input",
  "output", "system", "process", "module", "sector", "cursor", "route", "state",
  "token", "offset", "channel", "layer", "source", "target", "config", "session",
];
const HEX = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"] as const;
const OPERATORS = ["=", "==", "!=", "+=", "-=", "*=", "/=", "+", "-", "*", "/", "%", "&&", "||", "=>", "<", ">", "<=", ">=", "??"];
const CONTAINERS = [["(", ")"], ["[", "]"], ["{", "}"], ["<", ">"]] as const;
const KEYWORDS = ["const", "let", "var", "if", "else", "for", "while", "return", "await", "async", "true", "false", "null", "new", "class", "function"];
const PUNCTUATION = [";", ",", ".", ":", "?", "!", "&", "|", "#"];

// Easy-to-adjust Egg settings.
const MIN_LINE_LENGTH = 16;
const MAX_LINE_LENGTH = 256;
const ZERO_MODE_LINE_LENGTH = 256;
const VISIBLE_LINES = 220;
const BATCH_SIZE = 16;
const REFRESH_INTERVAL_MS = 70;
const SCROLL_DURATION_SECONDS = 3.2;
const FONT_SIZE_PX = 8;

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const randomInt = (minimum: number, maximum: number) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
const identifier = () => `${pick(IDENTIFIERS)}${Math.random() > 0.45 ? `_${randomInt(1, 999)}` : ""}`;
const numberValue = () => (Math.random() > 0.35 ? String(randomInt(0, 65535)) : `0x${Array.from({ length: randomInt(2, 6) }, () => pick(HEX)).join("")}`);
const quotedValue = () => `${pick(["\"", "'", "`"])}${pick(IDENTIFIERS)}_${randomInt(1, 99)}${pick(["\"", "'", "`"])}`;

const makeExpression = (depth = 0): string => {
  const atom = pick([identifier(), numberValue(), quotedValue(), pick(KEYWORDS)]);
  if (depth > 1 || Math.random() < 0.45) return atom;
  const [open, close] = pick(CONTAINERS);
  const pieces = Array.from({ length: randomInt(1, 3) }, () => makeExpression(depth + 1));
  return `${open}${pieces.join(` ${pick(OPERATORS)} `)}${close}`;
};

const makeCodeLine = (targetLength: number, spaced: boolean) => {
  const templates = [
    () => `${pick(KEYWORDS)} ${identifier()} ${pick(OPERATORS)} ${makeExpression()};`,
    () => `${identifier()}${pick([".", "?."])}${identifier()}(${makeExpression()}, ${makeExpression()});`,
    () => `if (${identifier()} ${pick(OPERATORS)} ${numberValue()}) { ${identifier()}(); }`,
    () => `for (let ${pick(["i", "j", "n"])} = 0; ${pick(["i", "j", "n"])} < ${numberValue()}; ${pick(["i", "j", "n"])}++) { ${identifier()} += ${numberValue()}; }`,
    () => `${identifier()} = ${pick(["Math", "System", "Buffer", "Memory", "Kernel"])}.${identifier()}(${numberValue()});`,
    () => `return ${makeExpression()} ${pick(PUNCTUATION)} ${makeExpression()};`,
    () => `${pick(KEYWORDS)} ${identifier()}(${identifier()}, ${identifier()}) { ${identifier()} ${pick(OPERATORS)} ${makeExpression()}; }`,
    () => `// ${pick(["loading", "sync", "cache", "sector", "frame", "packet"])} ${numberValue()} ${pick(PUNCTUATION)} ${identifier()}`,
  ];

  let line = "";
  while (line.length < targetLength) {
    const next = templates[randomInt(0, templates.length - 1)]();
    line += line ? ` ${next}` : next;
  }

  line = line.slice(0, targetLength);
  return spaced ? line.split("").join(" ") : line;
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
      zeroMode ? ZERO_MODE_LINE_LENGTH : randomInt(MIN_LINE_LENGTH, MAX_LINE_LENGTH);

    setLines(Array.from({ length: VISIBLE_LINES }, () => makeCodeLine(getLineLength(), zeroMode)));

    const interval = window.setInterval(() => {
      setLines((current) => {
        const newLines = Array.from({ length: BATCH_SIZE }, () => makeCodeLine(getLineLength(), zeroMode));
        return [...current.slice(BATCH_SIZE), ...newLines];
      });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [zeroMode]);

  const eggStyle = {
    "--egg-font-size": `${FONT_SIZE_PX}px`,
    "--egg-scroll-duration": `${SCROLL_DURATION_SECONDS}s`,
  } as CSSProperties;

  return (
    <main className="egg-terminal" style={eggStyle}>
      <div className="scanlines" />
      <div className="egg-output" aria-label="Rapidly scrolling generated code">
        <div className="egg-track">
          {[0, 1].map((copy) => (
            <div className="egg-copy" aria-hidden={copy === 1} key={copy}>
              {lines.map((line, index) => (
                <div key={`${copy}-${index}-${line}`} className="egg-line">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
