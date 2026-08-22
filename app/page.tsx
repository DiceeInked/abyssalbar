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

type Account = {
  id: string;
  username: string;
  created_at?: string;
};

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const PASSWORD_MIN = 3;
const PASSWORD_MAX = 30;

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [commandOutput, setCommandOutput] = useState(
    "Type /sign up <username> <password> to create an account."
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const result = await response.json();

        if (mounted) {
          setAccount(result.account ?? null);
        }
      } catch (error) {
        console.error("Error loading account session:", error);
      }
    };

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
        setConnected(status === "SUBSCRIBED");
      });

    loadAccount();
    loadMessages();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const isValidCredential = (value: string, min: number, max: number) => {
    return (
      value.length >= min &&
      value.length <= max &&
      !/\s/.test(value)
    );
  };

  const getArguments = (command: string) => {
    return command.trim().split(/\s+/).slice(1);
  };

  const authenticate = async (
    action: "sign_up" | "sign_in",
    username: string,
    password: string
  ) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) {
      setCommandOutput(
        `USERNAME ERROR: name must be ${USERNAME_MIN}-${USERNAME_MAX} characters and contain no spaces.`
      );
      return;
    }

    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) {
      setCommandOutput(
        `PASSWORD ERROR: password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and contain no spaces.`
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(`${action === "sign_up" ? "SIGN UP" : "SIGN IN"} ERROR: ${result.error}`);
        return;
      }

      setAccount(result.account);
      setCommandOutput(
        action === "sign_up"
          ? `ACCOUNT CREATED. Welcome, ${result.account.username}!`
          : `SIGNED IN. Welcome back, ${result.account.username}!`
      );
    } catch (error) {
      console.error("Authentication error:", error);
      setCommandOutput("AUTHENTICATION ERROR: Unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sign_out" }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(`SIGN OUT ERROR: ${result.error}`);
        return;
      }

      setAccount(null);
      setCommandOutput("SIGNED OUT.");
    } catch (error) {
      console.error("Sign out error:", error);
      setCommandOutput("SIGN OUT ERROR: Unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || busy) return;

    if (trimmedInput.startsWith("/")) {
      const parts = getArguments(trimmedInput);
      const command = trimmedInput.split(/\s+/)[0].toLowerCase();

      setInput("");

      if (command === "/sign" && parts.length >= 1) {
        const action = parts[0].toLowerCase();

        if (action === "up") {
          if (parts.length !== 3) {
            setCommandOutput("USAGE: /sign up <username> <password>");
            return;
          }

          await authenticate("sign_up", parts[1], parts[2]);
          return;
        }

        if (action === "in") {
          if (parts.length !== 3) {
            setCommandOutput("USAGE: /sign in <username> <password>");
            return;
          }

          await authenticate("sign_in", parts[1], parts[2]);
          return;
        }

        if (action === "out") {
          if (parts.length !== 1) {
            setCommandOutput("USAGE: /sign out");
            return;
          }

          await handleSignOut();
          return;
        }
      }

      setCommandOutput(
        "UNKNOWN COMMAND. Available: /sign up, /sign in, /sign out"
      );
      return;
    }

    if (!account) {
      setCommandOutput(
        "SIGN IN REQUIRED. Use /sign up <username> <password> or /sign in <username> <password>."
      );
      return;
    }

    if (!connected) {
      setCommandOutput("MESSAGE ERROR: Chat is still connecting.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(`MESSAGE ERROR: ${result.error}`);
        return;
      }

      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setCommandOutput("MESSAGE ERROR: Unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      <div className="terminal-container">
        <section className="navigation-terminal">
          <div className="terminal-title">NAVIGATION</div>

          <div className="navigation-content">
            <Link href="/ultimate-game-stash">Game Tonics</Link>
          </div>
        </section>

        <section className="terminal-window">
          <div className="terminal-title">GUEST TERMINAL</div>

          <div className="terminal-output">
            <p>ABYSSAL BAR TERMINAL v2.0</p>
            <p>--------------------------------</p>
            <p>
              Connection status: {connected ? "ONLINE" : "CONNECTING..."}
            </p>
            <p>
              Account: {account ? account.username : "NOT SIGNED IN"}
            </p>
            <p>{commandOutput}</p>
            <p>&nbsp;</p>

            {messages.map((message) => (
              <p key={message.id}>
                {message.username}: {message.message}
              </p>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="terminal-input">
            <span>&gt;</span>

            <input
              className="message-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                account
                  ? "Type a message or /command..."
                  : "/sign up <username> <password>"
              }
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command or message"
              disabled={busy}
            />

            <button type="submit" disabled={!connected || busy}>
              ENTER
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
