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
  TERMINAL_DISPLAY_LINES,
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

const TERMINAL_VERSION = "1.3";
const COMMAND_OUTPUT_LINES = 8;

const isValidCredential = (value: string, minimum: number, maximum: number) =>
  value.length >= minimum && value.length <= maximum && !/\s/.test(value);

const splitCommand = (value: string) => value.trim().split(/\s+/);

const wrapMessage = (text: string, maximum: number) => {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/)) {
    if (word.length > maximum) {
      if (current) lines.push(current);
      current = "";
      for (let index = 0; index < word.length; index += maximum) {
        lines.push(word.slice(index, index + maximum));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maximum) {
      if (current) lines.push(current);
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
      new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
  );

export default function Home() {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement | null>(null);
  const commandRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [commandOutput, setCommandOutput] = useState<string[]>([
    "guest terminal ready.",
    "type /help for commands.",
  ]);
  const [account, setAccount] = useState<Account | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const writeCommand = (text: string) => {
    const newLines = text.split("\n").map((line) => line || " ");
    setCommandOutput((current) =>
      [...current, ...newLines].slice(-COMMAND_OUTPUT_LINES),
    );
  };

  const loadAccount = async () => {
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      const result = await response.json();
      setAccount(result.account ?? null);
    } catch (error) {
      console.error("Error loading account session:", error);
      writeCommand("authentication error: unable to load session.");
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
      writeCommand("message error: unable to load chat.");
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
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    if (commandRef.current) commandRef.current.scrollTop = commandRef.current.scrollHeight;
  }, [messages, commandOutput]);

  const authenticate = async (
    action: "sign_up" | "sign_in",
    username: string,
    password: string,
  ) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) {
      writeCommand(`username error: use ${USERNAME_MIN}-${USERNAME_MAX} characters with no spaces.`);
      return;
    }

    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) {
      writeCommand(`password error: use ${PASSWORD_MIN}-${PASSWORD_MAX} characters with no spaces.`);
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
        writeCommand(`${action === "sign_up" ? "sign up" : "sign in"} error: ${result.error}`);
        return;
      }

      setAccount(result.account);
      writeCommand(
        action === "sign_up"
          ? `account created. welcome, ${result.account.username}!`
          : `signed in. welcome back, ${result.account.username}!`,
      );
    } catch (error) {
      console.error("Authentication error:", error);
      writeCommand("authentication error: unable to contact the server.");
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
        writeCommand(`sign out error: ${result.error}`);
        return;
      }

      setAccount(null);
      writeCommand("signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      writeCommand("sign out error: unable to contact the server.");
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
        writeCommand(
          "commands:\n/help\n/home\n/sign up <username> <password>\n/sign in <username> <password>\n/sign out\n/egg\n/egg 0\n/etho\n/games\n/tetris\n/clear",
        );
        return;

      case "/home":
        if (args.length) {
          writeCommand("usage: /home");
          return;
        }
        writeCommand("opening home...");
        router.push("/");
        return;

      case "/egg":
        if (args.length === 0) {
          writeCommand("opening egg...");
          router.push("/egg");
          return;
        }
        if (args.length === 1 && args[0] === "0") {
          writeCommand("opening egg 0...");
          router.push("/egg?mode=0");
          return;
        }
        writeCommand("usage: /egg or /egg 0");
        return;

      case "/etho":
        if (args.length) {
          writeCommand("usage: /etho");
          return;
        }
        writeCommand("opening etho...");
        router.push("/etho");
        return;

      case "/games":
        if (args.length) {
          writeCommand("usage: /games");
          return;
        }
        writeCommand("opening games...");
        router.push(GAME_LIBRARY_ROUTE);
        return;

      case "/tetris":
        if (args.length) {
          writeCommand("usage: /tetris");
          return;
        }
        writeCommand("opening tetris...");
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
        writeCommand(
          "usage: /sign up <username> <password>, /sign in <username> <password>, or /sign out",
        );
        return;
      }

      default:
        writeCommand("unknown command. type /help.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;

    setInput("");

    if (value.toLowerCase() === "/clear") {
      setCommandOutput([]);
      return;
    }

    if (value.startsWith("/")) {
      writeCommand(`> ${value}`);
      await runCommand(value);
      return;
    }

    if (!account) {
      writeCommand("sign in required. use /sign up or /sign in first.");
      return;
    }

    if (!connected) {
      writeCommand("message error: chat is still connecting.");
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
      if (!response.ok) writeCommand(`message error: ${result.error}`);
    } catch (error) {
      console.error("Error sending message:", error);
      writeCommand("message error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const displayLines = messages.flatMap((message) =>
    wrapMessage(`${message.username}: ${message.message}`, MESSAGE_LINE_LENGTH),
  );
  const visibleLines = displayLines.slice(-TERMINAL_DISPLAY_LINES);

  return (
    <main className={styles.page}>
      <section className={styles.terminal} aria-label="Guest Terminal">
        <header className={styles.header}>
          <span>guest terminal</span>
          <span>v{TERMINAL_VERSION}</span>
        </header>

        <div ref={chatRef} className={styles.chatOutput} aria-live="polite">
          {visibleLines.length ? (
            visibleLines.map((line, index) => (
              <div className={styles.line} key={`${index}-${line}`}>
                {line || "\u00a0"}
              </div>
            ))
          ) : (
            <div className={styles.emptyLine}>waiting for messages...</div>
          )}
        </div>

        <form className={styles.inputBar} onSubmit={handleSubmit}>
          <span className={styles.prompt} aria-hidden="true">&gt;</span>
          <input
            className={styles.input}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="message or /help"
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal input"
            disabled={busy}
          />
        </form>

        <div ref={commandRef} className={styles.commandOutput} aria-label="Command output">
          {commandOutput.map((line, index) => (
            <div className={styles.commandLine} key={`${index}-${line}`}>
              {line || "\u00a0"}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
