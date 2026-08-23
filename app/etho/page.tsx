"use client";

import Image from "next/image";

/*
 * ============================================================
 * EDIT ONLY THIS SECTION
 * Change the text and image below. Everything else can stay alone.
 * ============================================================
 */
const PAGE_TEXT = "Etho page hehe =]";
const IMAGE_SRC = "/etho-image.png";
const IMAGE_ALT = "Etho image";

export default function Etho() {
  return (
    <main className="terminal">
      <div className="crt-glow" />
      <div className="scanlines" />
      <div className="crt-noise" />
      <div className="crt-vignette" />

      <div className="terminal-container">
        <section className="terminal-window">
          <div className="terminal-title">ETHO</div>

          <div className="terminal-output">
            <div className="content-image">
              <Image
                src={IMAGE_SRC}
                alt={IMAGE_ALT}
                width={600}
                height={400}
                priority
              />
            </div>

            <p>{PAGE_TEXT}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
