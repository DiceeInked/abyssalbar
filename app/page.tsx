"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  GAME_LIBRARY_ROUTE,
  MAX_MESSAGES,
  MESSAGE_LINE_LENGTH,
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
} from "../lib/constants";
import styles from "./page.module.css";

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

const TERMINAL_VERSION = "1.0";
const DISPLAY_LINES = 16;

const isValidCredential = (value: string, minimum: number, maximum: number) =>
  value.length >= minimum && value.length <= maximum && !/\s/.test(value);

const splitCommand = (value: string) => value.trim().split(/\s+/);

const wrapMessage = (text: string, maximum: number) => {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/)) {
    if (word.length > maximum) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maximum) {
        lines.push(word.slice(index, index + maximum));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maximum) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const sortMessages = (messages: Message[]) =>
  [...messages].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );

export default function Home() {
  const router = useRouter();
  const outputRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const write = (text: string) => {
    const newLines = text.split("\n").map((line) => line || " ");
    setTerminalLines((current) =>
      [...current, ...newLines].slice(-MAX_MESSAGES),
    );
  };

  const loadAccount = async () => {
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      const result = await response.json();
      setAccount(result.account ?? null);
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

    if (data) setMessages(sortMessages(data.reverse()));
  };

  useEffect(() => {
    let mounted = true;

    void Promise.all([loadAccount(), loadMessages()]);

    const channel = supabase
      .channel("guest-terminal-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          if (mounted) void loadMessages();
        },
      )
      .subscribe((status) => {
        if (!mounted) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void loadMessages();
      });

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [terminalLines, messages]);

  const authenticate = async (
    action: "sign_up" | "sign_in",
    username: string,
    password: string,
  ) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) {
      write(
        `Username error: use ${USERNAME_MIN}-${USERNAME_MAX} characters with no spaces.`,
      );
      return;
    }

    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) {
      write(
        `Password error: use ${PASSWORD_MIN}-${PASSWORD_MAX} characters with no spaces.`,
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
        write(`${action === "sign_up" ? "Sign up" : "Sign in"} error: ${result.error}`);
        return;
      }

      setAccount(result.account);
      write(
        action === "sign_up"
          ? `Account created. Welcome, ${result.account.username}!`
          : `Signed in. Welcome back, ${result.account.username}!`,
      );
    } catch (error) {
      console.error("Authentication error:", error);
      write("Authentication error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_out" }),
      });
      const result = await response.json();

      if (!response.ok) {
        write(`Sign out error: ${result.error}`);
        return;
      }

      setAccount(null);
      write("Signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      write("Sign out error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const runCommand = async (value: string) => {
    const parts = splitCommand(value);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "/help":
        write(
          "Commands:\n/help\n/home\n/sign up <username> <password>\n/sign in <username> <password>\n/sign out\n/egg\n/egg 0\n/etho\n/games\n/tetris\n/clear",
        );
        return;

      case "/home":
        if (args.length) {
          write("Usage: /home");
          return;
        }
        router.push("/");
        return;

      case "/egg":
        if (args.length === 0) {
          router.push("/egg");
          return;
        }
        if (args.length === 1 && args[0] === "0") {
          router.push("/egg?mode=0");
          return;
        }
        write("Usage: /egg or /egg 0");
        return;

      case "/etho":
        if (args.length) {
          write("Usage: /etho");
          return;
        }
        router.push("/etho");
        return;

      case "/games":
        if (args.length) {
          write("Usage: /games");
          return;
        }
        router.push(GAME_LIBRARY_ROUTE);
        return;

      case "/tetris":
        if (args.length) {
          write("Usage: /tetris");
          return;
        }
        router.push("/tetris");
        return;

      case "/sign": {
        const action = args[0]?.toLowerCase();
        if (action === "up" && args.length === 3) {
          await authenticate("sign_up", args[1], args[2]);
          return;
        }
        if (action === "in" && args.length === 3) {
          await authenticate("sign_in", args[1], args[2]);
          return;
        }
        if (action === "out" && args.length === 1) {
          await signOut();
          return;
        }
        write(
          "Usage: /sign up <username> <password>, /sign in <username> <password>, or /sign out",
        );
        return;
      }

      default:
        write("Unknown command. Type /help.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;

    setInput("");

    if (value.toLowerCase() === "/clear") {
      setTerminalLines([]);
      return;
    }

    if (value.startsWith("/")) {
      write(`> ${value}`);
      await runCommand(value);
      return;
    }

    if (!account) {
      write("Sign in required. Use /sign up or /sign in first.");
      return;
    }

    if (!connected) {
      write("Message error: chat is still connecting.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });
      const result = await response.json();
      if (!response.ok) write(`Message error: ${result.error}`);
    } catch (error) {
      console.error("Error sending message:", error);
      write("Message error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const displayLines: string[] = [];

  for (const line of terminalLines) displayLines.push(line);
  for (const message of messages) {
    for (const line of wrapMessage(
      `${message.username}: ${message.message}`,
      MESSAGE_LINE_LENGTH,
    )) {
      displayLines.push(line);
    }
  }

  const visibleLines = displayLines.slice(-DISPLAY_LINES);

  return (
    <main className={styles.page}>
      <section className={styles.terminal} aria-label="Guest Terminal">
        <header className={styles.header}>
          <span>Guest Terminal</span>
          <span>v{TERMINAL_VERSION}</span>
        </header>

        <div ref={outputRef} className={styles.output} aria-live="polite">
          {visibleLines.map((line, index) => (
            <div className={styles.line} key={`${index}-${line}`}>
              {line || "\u00a0"}
            </div>
          ))}
        </div>

        <form className={styles.inputBar} onSubmit={handleSubmit}>
          <span className={styles.prompt} aria-hidden="true">&gt;</span>
          <input
            className={styles.input}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={account ? "message or /command" : "/sign up or /help"}
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal input"
            disabled={busy}
          />
        </form>
      </section>
    </main>
  );
}
