"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  // Generate a random guest number when the page loads
  const [guestNumber] = useState(
    () => Math.floor(1000 + Math.random() * 9000)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    setMessages((previous) => [
      ...previous,
      `guest${guestNumber}: ${input}`,
    ]);

    setInput("");
  };

  return (
    <main className="terminal">
      {/* CRT scanlines */}
      <div className="scanlines" />

      {/* Navigation */}
      <nav className="navigation">
        <Link href="/ultimate-game-stash">
          Ultimate Game Stash
        </Link>
      </nav>

      {/* Terminal */}
      <section className="terminal-window">
        <div className="terminal-output">
          <p>GUEST TERMINAL v1.0</p>
          <p>--------------------------------</p>
          <p>Connection established.</p>
          <p>
            Welcome, guest{guestNumber}.
          </p>
          <p> </p>

          {messages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="terminal-input">
          <span>guest{guestNumber}&gt;</span>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />

          <button type="submit">ENTER</button>
        </form>
      </section>
    </main>
  );
}
