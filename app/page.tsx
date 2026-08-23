"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  MAX_MESSAGES,
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
} from "../lib/constants";

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

const isValidCredential = (value: string, min: number, max: number) =>
  value.length >= min && value.length <= max && !/\s/.test(value);

const getCommandParts = (command: string) => command.trim().split(/\s+/);

const sortMessages = (messages: Message[]) =>
  [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

export default function Home() {
  const router = useRouter();
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
        .limit(MAX_MESSAGES);

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      if (mounted && data) {
        setMessages(sortMessages(data.reverse()));
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
        () => {
          void loadMessages();
        }
      )
      .subscribe((status) => {
        if (!mounted) {
          return;
        }

        setConnected(status === "SUBSCRIBED");

        if (status === "SUBSCRIBED") {
          void loadMessages();
        }
      });

    loadAccount();
    loadMessages();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const authenticate = async (
    action: "sign_up" | "sign_in",
    username: string,
    password: string
  ) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) {
      setCommandOutput(
        `Username error: name must be ${USERNAME_MIN}-${USERNAME_MAX} characters and contain no spaces.`
      );
      return;
    }

    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) {
      setCommandOutput(
        `Password error: password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and contain no spaces.`
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(
          `${action === "sign_up" ? "Sign up" : "Sign in"} error: ${result.error}`
        );
        return;
      }

      setAccount(result.account);
      setCommandOutput(
        action === "sign_up"
          ? `Account created. Welcome, ${result.account.username}!`
          : `Signed in. Welcome back, ${result.account.username}!`
      );
    } catch (error) {
      console.error("Authentication error:", error);
      setCommandOutput("Authentication error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_out" }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(`Sign out error: ${result.error}`);
        return;
      }

      setAccount(null);
      setCommandOutput("Signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      setCommandOutput("Sign out error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const handleCommand = async (parts: string[]) => {
    const command = parts[0]?.toLowerCase();

    if (command === "/egg") {
      if (parts.length !== 1) {
        setCommandOutput("Usage: /egg");
        return;
      }

      router.push("/egg");
      return;
    }

    if (command !== "/sign") {
      setCommandOutput(
        "Unknown command. Available: /sign up, /sign in, /sign out, /egg"
      );
      return;
    }

    const action = parts[1]?.toLowerCase();

    if (action === "up") {
      if (parts.length !== 4) {
        setCommandOutput("Usage: /sign up <username> <password>");
        return;
      }

      await authenticate("sign_up", parts[2], parts[3]);
      return;
    }

    if (action === "in") {
      if (parts.length !== 4) {
        setCommandOutput("Usage: /sign in <username> <password>");
        return;
      }

      await authenticate("sign_in", parts[2], parts[3]);
      return;
    }

    if (action === "out") {
      if (parts.length !== 2) {
        setCommandOutput("Usage: /sign out");
        return;
      }

      await handleSignOut();
      return;
    }

    setCommandOutput(
      "Unknown command. Available: /sign up, /sign in, /sign out, /egg"
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || busy) {
      return;
    }

    setInput("");

    if (trimmedInput.startsWith("/")) {
      await handleCommand(getCommandParts(trimmedInput));
      return;
    }

    if (!account) {
      setCommandOutput(
        "Sign in required. Use /sign up <username> <password> or /sign in <username> <password>."
      );
      return;
    }

    if (!connected) {
      setCommandOutput("Message error: chat is still connecting.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCommandOutput(`Message error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setCommandOutput("Message error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      <div className="terminal-container">
        <section className="navigation-terminal">
          <div className="terminal-title">Navigation</div>

          <div className="navigation-content">
            <Link href="/ultimate-game-stash">Game Tonics</Link>
          </div>
        </section>

        <section className="terminal-window">
          <div className="terminal-title">Abyssal Bar Terminal</div>

          <div className="terminal-output">
            <p>Abyssal Bar Terminal v2.2</p>
            <p>--------------------------------</p>
            <p>
              Connection status: {connected ? "Online" : "Connecting..."}
            </p>
            <p>Account: {account ? account.username : "Not signed in"}</p>
            <p>{commandOutput}</p>
            <p>&nbsp;</p>

            {messages.map((message) => (
              <p key={message.id}>
                {message.username}: {message.message}
              </p>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="terminal-input">
            <span aria-hidden="true">&gt;</span>

            <input
              className="message-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
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

            <button
              className="terminal-button"
              type="submit"
              disabled={!connected || busy}
            >
              Enter
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
