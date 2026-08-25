"use client";

import type { FormEvent } from "react";
import type { ProceedChoice, ProceedPrompt, TerminalLine } from "../ethoTypes";
import styles from "../Etho.module.css";

type Props = {
  history: TerminalLine[];
  liveOutput: string;
  input: string;
  warningOpen: boolean;
  typing: boolean;
  dessMode: boolean;
  proceedMenuOpen: boolean;
  finalScene: boolean;
  terminalRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  activeProceedPrompt: ProceedPrompt;
  proceedChoice: ProceedChoice;
  whiteoutLevel: number;
  proceedLineCount: number;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProceedChoiceChange: (choice: ProceedChoice) => void;
  onResolveProceed: (choice: ProceedChoice) => void;
  renderText: (text: string) => React.ReactNode;
};

export default function EthoTerminalView({
  history,
  liveOutput,
  input,
  warningOpen,
  typing,
  dessMode,
  proceedMenuOpen,
  finalScene,
  terminalRef,
  inputRef,
  activeProceedPrompt,
  proceedChoice,
  whiteoutLevel,
  proceedLineCount,
  onInputChange,
  onSubmit,
  onProceedChoiceChange,
  onResolveProceed,
  renderText,
}: Props) {
  return (
    <div className={styles.content}>
      <div ref={terminalRef} className={styles.output} aria-live="polite">
        {history.map((line) => (
          <p key={line.id} className={`${styles.line} ${styles[line.kind]}`}>
            {renderText(line.text)}
          </p>
        ))}
        {liveOutput && (
          <p className={`${styles.line} ${styles.response}`}>
            {renderText(liveOutput)}
            <span className={styles.cursor}>_</span>
          </p>
        )}
      </div>

      <form className={styles.inputArea} onSubmit={onSubmit}>
        <span className={styles.prompt}>&gt;</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="TYPE /COMMAND..."
          autoComplete="off"
          spellCheck={false}
          aria-label="Echo terminal command input"
          disabled={warningOpen || typing || dessMode || proceedMenuOpen || finalScene}
        />
      </form>

      {proceedMenuOpen && (
        <div className={styles.choiceOverlay}>
          <div className={styles.choiceBox} role="dialog" aria-modal="true" aria-label="Proceed route choice">
            <p className={styles.choiceQuestion}>{activeProceedPrompt.heading}</p>
            <p className={styles.choicePrompt}>{activeProceedPrompt.question}</p>
            <div className={styles.choiceList}>
              {([
                ["proceed", activeProceedPrompt.proceedLabel],
                ["stop", activeProceedPrompt.stopLabel],
              ] as const).map(([choice, label]) => (
                <button
                  key={choice}
                  type="button"
                  className={`${styles.choiceOption} ${proceedChoice === choice ? styles.choiceSelected : ""}`}
                  onMouseEnter={() => onProceedChoiceChange(choice)}
                  onFocus={() => onProceedChoiceChange(choice)}
                  onClick={() => onResolveProceed(choice)}
                >
                  <span
                    className={`${styles.soulCursor} ${proceedChoice === choice ? styles.soulVisible : ""}`}
                    aria-hidden="true"
                  />
                  {label}
                </button>
              ))}
            </div>
            <p className={styles.choiceHint}>ARROW KEYS + ENTER</p>
          </div>
        </div>
      )}

      <div
        className={styles.whiteout}
        style={{ opacity: whiteoutLevel / proceedLineCount }}
        aria-hidden="true"
      />
    </div>
  );
}
