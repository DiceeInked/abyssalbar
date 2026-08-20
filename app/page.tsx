"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || guestName.length !== 3) return;

    setMessages((previous) => [
      ...previous,
      `${guestName}: ${input}`,
    ].slice(-12));

    setInput("");
  };

  return (
    <main className="terminal">
      {/* CRT scanlines */}
      <div className="scanlines" />

      <div className="terminal-container">

        {/* Navigation Terminal */}
        <section className="navigation-terminal">
          <div className="terminal-title">
            NAVIGATION
          </div>

          <div className="navigation-content">
            <Link href="/ultimate-game-stash">
              Ultimate Game Stash
            </Link>
          </div>
        </section>


        {/* Guest Terminal */}
        <section className="terminal-window">

          <div className="terminal-title">
            GUEST TERMINAL
          </div>

          <div className="terminal-output">
            <p>GUEST TERMINAL v1.0</p>
            <p>--------------------------------</p>
            <p>Connection established.</p>
            <p>Enter your 3-character ID below.</p>
            <p>&nbsp;</p>

            {messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>


          {/* Command Line */}
          <form
            onSubmit={handleSubmit}
            className="terminal-input"
          >

            {/* Three-character ID */}
            <input
              className="guest-id"
              type="text"
              value={guestName}
              onChange={(e) =>
                setGuestName(
                  e.target.value
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .slice(0, 3)
                )
              }
              placeholder="___"
              maxLength={3}
              autoComplete="off"
              spellCheck="false"
            />

            <span>&gt;</span>

            {/* Message */}
            <input
              className="message-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              autoComplete="off"
              spellCheck="false"
            />

            <button type="submit">
              ENTER
            </button>

          </form>

        </section>

      </div>
    </main>
  );
}
