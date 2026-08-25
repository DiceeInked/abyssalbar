"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { BootState, DvdPosition } from "../ethoTypes";
import styles from "../Etho.module.css";

type Props = {
  bootState: BootState;
  bootLoadingText: string;
  bootAudioError: boolean;
  dvdPosition: DvdPosition;
  dvdVelocity: { x: number; y: number };
  dvdSlotRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRetryAudio: () => void;
};

export default function EthoBootScreen({
  bootState,
  bootLoadingText,
  bootAudioError,
  dvdPosition,
  dvdVelocity,
  dvdSlotRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRetryAudio,
}: Props) {
  const floor = typeof window !== "undefined" ? Math.max(0, window.innerHeight - 174) : 600;
  const heightFromFloor = Math.max(0, floor - dvdPosition.y);
  const shadowScale = Math.max(0.55, Math.min(1, 1 - heightFromFloor / 900));
  const shadowBlur = Math.max(3, Math.min(25, 4 + heightFromFloor / 28));
  const rotation = Math.max(-16, Math.min(16, dvdVelocity.y * 0.08));

  return (
    <main className={styles.bootPage}>
      <div className={styles.bootCRT}>
        <div className={styles.bootScanlines} />
        <div className={styles.bootNoise} />
        <div className={styles.bootVignette} />

        <header className={styles.bootHeader}>
          <h1 className={styles.insertTitle}>INSERT CHAPTER 7 SIDE B</h1>
          <p className={styles.insertSubtitle}>ECHO TERMINAL // DRIVE 07</p>
        </header>

        <div
          className={styles.dvdShadow}
          style={{
            left: dvdPosition.x + 75,
            transform: `translateX(-50%) scaleX(${shadowScale})`,
            filter: `blur(${shadowBlur}px)`,
            opacity: 0.25 + Math.min(0.45, heightFromFloor / 1200),
          }}
        />

        <div
          className={styles.dvd}
          style={{ left: dvdPosition.x, top: dvdPosition.y, transform: `rotate(${rotation}deg)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          role="button"
          tabIndex={0}
          aria-label="Chapter 7 Side B DVD"
        >
          <div className={styles.dvdGrooves} />
          <div className={styles.dvdLabel}>
            <span>CHAPTER 7</span>
            <strong>SIDE B</strong>
            <small>ECHO</small>
          </div>
          <div className={styles.dvdHub} />
        </div>

        <div ref={dvdSlotRef} className={styles.dvdDrive}>
          <div className={styles.dvdDriveTrim} />
          <div className={styles.dvdDriveSlot} />
          <span className={styles.dvdDriveLabel}>DVD DRIVE</span>
          <span className={styles.dvdDriveStatus}>{bootState === "boot" ? "WAITING" : bootLoadingText}</span>
        </div>

        {bootState === "boot" && (
          <p className={styles.bootInstruction}>
            DRAG THE DISC INTO THE DRIVE
            <br />
            <span>RELEASE IT ABOVE THE SLOT</span>
          </p>
        )}

        {bootState === "loading" && (
          <div className={styles.loadingPanel}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingInfo}>
              <div className={styles.loadingTitle}>LOADING</div>
              <div className={styles.loadingText}>{bootLoadingText}</div>
              <div className={styles.loadingBar}>
                <div className={styles.loadingBarFill} />
              </div>
            </div>
            {bootAudioError && (
              <div className={styles.audioError}>
                HDD.MP3 COULD NOT PLAY.
                <br />
                Make sure the file is located at
                <br />
                <strong>public/HDD.mp3</strong>
                <br />
                <button type="button" className={styles.retryButton} onClick={onRetryAudio}>
                  RETRY AUDIO
                </button>
              </div>
            )}
          </div>
        )}

        <footer className={styles.bootFooter}>ECHO SYSTEM // READY</footer>
      </div>
    </main>
  );
}
