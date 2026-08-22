"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Message = {
  id: number;
  username: string;
  message: string;
  created_at: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, username, message, created_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      if (mounted && data) {
        setMessages(data.reverse());
      }
    };

    const channel = supabase
      .channel("abyssal-bar-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((previous) => {
            if (previous.some((message) => message.id === newMessage.id)) {
              return previous;
            }

            return [...previous, newMessage].slice(-12);
          });
        }
      )
      .subscribe((status) => {
        if (!mounted) return;

        if (status === "SUBSCRIBED") {
          setConnected(true);
        } else {
          setConnected(false);
        }
      });

    loadMessages();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || guestName.length !== 3) {
      return;
    }

    const { error } = await supabase.from("messages").insert({
      username: guestName,
      message: trimmedMessage,
    });

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    setInput("");
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      <div className="terminal-container">

        {/* Navigation Terminal */}
        <section className="navigation-terminal">
          <div className="terminal-title">
            NAVIGATION
          </div>

          <div className="navigation-content">
            <Link href="/ultimate-game-stash">
              Game Tonics
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

            <p>
              Connection status:{" "}
              {connected ? "ONLINE" : "CONNECTING..."}
            </p>

            <p>Enter your 3-character ID below.</p>

            <p>&nbsp;</p>

            {messages.map((message) => (
              <p key={message.id}>
                {message.username}: {message.message}
              </p>
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
              aria-label="Three character ID"
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
              aria-label="Message"
            />

            <button
              type="submit"
              disabled={!connected || guestName.length !== 3}
            >
              ENTER
            </button>

          </form>

        </section>

      </div>
    </main>
  );
}
