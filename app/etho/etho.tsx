 "use client";

import Image from "next/image";
import ethoImage from "./etho-image.png";
import styles from "./etho.module.css";

/*
 * ============================================================
 * EDIT ONLY THIS SECTION
 * ============================================================
 *
 * Put your image in this same folder:
 * app/etho/etho-image.png
 *
 * Then you can change the text below whenever you want.
 */

const PAGE_TEXT = "Etho page hehe =]";
const IMAGE_ALT = "Etho image";

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function Etho() {
  return (
    <main className={styles.terminal}>
      <div className={styles.scanlines} />
      <div className={styles.noise} />
      <div className={styles.vignette} />

      <div className={styles.tv}>
        <div className={styles.screen}>
          <div className={styles.terminalWindow}>
            <div className={styles.terminalTitle}>
              <span>ETHO</span>
              <span className={styles.rec}>● REC</span>
            </div>

            <div className={styles.terminalOutput}>
              <div className={styles.contentImage}>
                <Image
                  src={ethoImage}
                  alt={IMAGE_ALT}
                  width={600}
                  height={400}
                  priority
                />
              </div>

              <p>{PAGE_TEXT}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tvControls} aria-hidden="true">
        <span className={styles.powerLight} />
        <span>POWER</span>
        <span>CHANNEL</span>
        <span>VOLUME</span>
      </div>
    </main>
  );
}
