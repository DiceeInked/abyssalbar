"use client";

import styles from "./Etho.module.css";

export default function Etho() {
  return (
    <main className={styles.page}>
      <div className={styles.scanlines} />

      <div className={styles.container}>
        <section className={styles.window}>
          <div className={styles.title}>ETHO</div>

          <div className={styles.output}>
            <p>Etho page hehe =]</p>
          </div>
        </section>
      </div>
    </main>
  );
}
