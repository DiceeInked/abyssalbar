"use client";

import type { ErrorWindow } from "../ethoTypes";
import styles from "../Etho.module.css";

type FinalSceneProps = { finalScene: boolean };

export function FinalScene({ finalScene }: FinalSceneProps) {
  if (!finalScene) return null;

  return (
    <div className={styles.finalScene} aria-live="assertive">
      <div className={styles.finalWater} />
      <p className={styles.finalHeader}>REMOTE VIEW // FINAL FRAME</p>
      <div className={styles.finalMessage}>
        <p>THE LAKE IS INSIDE THE SCREEN.</p>
        <p>KRIS IS STILL WALKING.</p>
        <p>NOELLE IS STILL FOLLOWING.</p>
        <p>YOU ARE STILL PRESSING ENTER.</p>
        <p>THEY ARE STILL DROWNING IN THE LAKE BECAUSE OF YOU.</p>
      </div>
      <span className={styles.finalSoul} aria-hidden="true">♥</span>
      <p className={styles.finalWhisper}>YOU WERE NEVER HOLDING THE CONTROLLER.</p>
    </div>
  );
}

type ErrorSceneProps = {
  dessMode: boolean;
  faultMode: boolean;
  errorWindows: ErrorWindow[];
  onDismiss: (id: number) => void;
};

export function ErrorScene({ dessMode, faultMode, errorWindows, onDismiss }: ErrorSceneProps) {
  if (!dessMode) return null;

  return (
    <div className={styles.errorScreen} aria-label="Terminal failure sequence">
      {errorWindows.map((error) => (
        <div key={error.id} className={styles.errorWindow} style={{ left: error.x, top: error.y }}>
          <div className={styles.errorTitle}>{faultMode ? "YOU.EXE - FATAL ERROR" : "LAKE.EXE - SYSTEM ERROR"}</div>
          <div className={styles.errorBody}>
            <div className={styles.errorIcon}>!</div>
            <div>
              <strong>{error.message}</strong>
              <p>{faultMode ? "THIS WILL NOT GO AWAY." : "AN UNEXPECTED ERROR HAS OCCURRED."}</p>
            </div>
          </div>
          <button type="button" className={styles.errorButton} onClick={() => onDismiss(error.id)}>
            OK
          </button>
        </div>
      ))}
    </div>
  );
}

type WarningProps = { open: boolean; onClose: () => void };

export function PhotosensitivityWarning({ open, onClose }: WarningProps) {
  if (!open) return null;

  return (
    <div className={styles.warningOverlay}>
      <div
        className={styles.warningBox}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photosensitivity-warning"
      >
        <h1 id="photosensitivity-warning">PHOTOSENSITIVITY WARNING</h1>
        <p>THIS EXPERIENCE CONTAINS FLASHING LIGHTS, FLICKER, HIGH-CONTRAST IMAGES, AND RAPIDLY APPEARING WINDOWS.</p>
        <p>PLEASE TAKE CARE OF YOURSELF BEFORE CONTINUING.</p>
        <button type="button" className={styles.warningButton} onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </div>
  );
}
