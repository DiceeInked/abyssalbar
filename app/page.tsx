"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  ETHO_TRANSITION_MS,
  GAME_LIBRARY_ROUTE,
  MAX_MESSAGES,
  MESSAGE_LINE_LENGTH,
  PASSWORD_MAX,
  PASSWORD_MIN,
  SITE_VERSION,
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

type TerminalEntry = {
  id: number;
  text: string;
};

type CommandHandler = (args: string[]) => void | Promise<void>;

const isValidCredential = (value: string, min: number, max: number) =>
  value.length >= min && value.length <= max && !/\s/.test(value);

const getCommandParts = (commandText: string) =>
  commandText.trim().split(/\s+/);

const sortMessages = (messages: Message[]) =>
  [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

const wrapText = (text: string, maxLength: number) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    if (word.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      for (let index = 0; index < word.length; index += maxLength) {
        lines.push(word.slice(index, index + maxLength));
      }
      return;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
};

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [ethoTransition, setEthoTransition] = useState(false);
  const nextTerminalEntryId = useRef(0);

  const writeTerminalLine = (text: string) => {
    setTerminalEntries((current) => [
      ...current,
      { id: nextTerminalEntryId.current++, text },
    ].slice(-MAX_MESSAGES));
  };

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const result = await response.json();
        if (mounted) setAccount(result.account ?? null);
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

      if (mounted && data) setMessages(sortMessages(data.reverse()));
    };

    const channel = supabase
      .channel("abyssal-bar-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => void loadMessages(),
      )
      .subscribe((status) => {
        if (!mounted) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void loadMessages();
      });

    void loadAccount();
    void loadMessages();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const playEthoGlitchSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const gain = context.createGain();
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(70, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1800,
        context.currentTime + 0.16,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        110,
        context.currentTime + 0.42,
      );

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, context.currentTime);
      filter.Q.setValueAtTime(7, context.currentTime);

      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.055,
        context.currentTime + 0.015,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.5,
      );

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.52);

      window.setTimeout(() => void context.close(), 650);
    } catch (error) {
      console.debug("Etho transition audio unavailable:", error);
    }
  };

  const startEthoTransition = async () => {
    if (ethoTransition) return;
    setEthoTransition(true);
    playEthoGlitchSound();
    await new Promise<void>((resolve) =>
      window.setTimeout(resolve, ETHO_TRANSITION_MS),
    );
    router.push("/etho");
  };

  const authenticate = async (
    action: "sign_up" | "sign_in",
    username: string,
    password: string,
  ) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) {
      writeTerminalLine(
        `Username error: name must be ${USERNAME_MIN}-${USERNAME_MAX} characters and contain no spaces.`,
      );
      return;
    }

    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) {
      writeTerminalLine(
        `Password error: password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and contain no spaces.`,
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
        writeTerminalLine(
          `${action === "sign_up" ? "Sign up" : "Sign in"} error: ${result.error}`,
        );
        return;
      }

      setAccount(result.account);
      writeTerminalLine(
        action === "sign_up"
          ? `Account created. Welcome, ${result.account.username}!`
          : `Signed in. Welcome back, ${result.account.username}!`,
      );
    } catch (error) {
      console.error("Authentication error:", error);
      writeTerminalLine(
        "Authentication error: unable to contact the server.",
      );
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
        writeTerminalLine(`Sign out error: ${result.error}`);
        return;
      }

      setAccount(null);
      writeTerminalLine("Signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      writeTerminalLine("Sign out error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  const commands: Record<string, CommandHandler> = {
    "/help": (args) => {
      if (args.length !== 0) {
        writeTerminalLine("Usage: /help");
        return;
      }

      writeTerminalLine(
        "Commands:\n/help\n/home\n/sign up <username> <password>\n/sign in <username> <password>\n/sign out\n/egg\n/egg 0\n/etho\n/games\n/tetris",
      );
    },

    "/home": (args) => {
      if (args.length !== 0) {
        writeTerminalLine("Usage: /home");
        return;
      }
      router.push("/");
    },

    "/egg": (args) => {
      if (args.length === 0) {
        router.push("/egg");
        return;
      }

      if (args.length === 1 && args[0] === "0") {
        router.push("/egg?mode=0");
        return;
      }

      writeTerminalLine("Usage: /egg or /egg 0");
    },

    "/etho": async (args) => {
      if (args.length !== 0) {
        writeTerminalLine("Usage: /etho");
        return;
      }
      await startEthoTransition();
    },

    "/games": (args) => {
      if (args.length !== 0) {
        writeTerminalLine("Usage: /games");
        return;
      }
      router.push(GAME_LIBRARY_ROUTE);
    },

    "/tetris": (args) => {
      if (args.length !== 0) {
        writeTerminalLine("Usage: /tetris");
        return;
      }
      router.push("/tetris");
    },

    "/sign": async (args) => {
      const action = args[0]?.toLowerCase();

      if (action === "up") {
        if (args.length !== 3) {
          writeTerminalLine("Usage: /sign up <username> <password>");
          return;
        }
        await authenticate("sign_up", args[1], args[2]);
        return;
      }

      if (action === "in") {
        if (args.length !== 3) {
          writeTerminalLine("Usage: /sign in <username> <password>");
          return;
        }
        await authenticate("sign_in", args[1], args[2]);
        return;
      }

      if (action === "out") {
        if (args.length !== 1) {
          writeTerminalLine("Usage: /sign out");
          return;
        }
        await handleSignOut();
        return;
      }

      writeTerminalLine(
        "Usage: /sign up <username> <password>, /sign in <username> <password>, or /sign out",
      );
    },
  };

  const handleCommand = async (commandText: string) => {
    const parts = getCommandParts(commandText);
    const command = parts[0]?.toLowerCase();
    const handler = command ? commands[command] : undefined;

    if (!handler) {
      writeTerminalLine("Unknown command. Type /help.");
      return;
    }

    await handler(parts.slice(1));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || busy || ethoTransition) return;

    setInput("");

    if (trimmedInput === "/clear") {
      setTerminalEntries([]);
      return;
    }

    if (trimmedInput.startsWith("/")) {
      writeTerminalLine(trimmedInput);
      await handleCommand(trimmedInput);
      return;
    }

    if (!account) {
      writeTerminalLine(
        "Sign in required. Use /sign up <username> <password> or /sign in <username> <password>.",
      );
      return;
    }

    if (!connected) {
      writeTerminalLine("Message error: chat is still connecting.");
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
        writeTerminalLine(`Message error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      writeTerminalLine("Message error: unable to contact the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      {ethoTransition && (
        <div className="etho-glitch-transition" aria-hidden="true">
          <div className="etho-glitch-layer etho-glitch-layer-one" />
          <div className="etho-glitch-layer etho-glitch-layer-two" />
          <div className="etho-glitch-noise" />
          <div className="etho-glitch-text">ETHO</div>
        </div>
      )}

      <div className="terminal-container">
        <section className="terminal-window">
          <div className="terminal-title">
            Abyssal Bar Terminal v{SITE_VERSION}
          </div>

          <div className="terminal-output">
            <p>--------------------------------</p>
            <p>Account: {account ? account.username : "Not signed in"}</p>
            <p>
              Connection status: {connected ? "Online" : "Connecting..."}
            </p>
            <p>--------------------------------</p>

            {!account && terminalEntries.length === 0 && (
              <p>Type /sign up &lt;username&gt; &lt;password&gt; to create an account.</p>
            )}

            {terminalEntries.map((entry) => (
              <p key={entry.id}>
                &gt; {entry.text.split("\n").map((line, index, lines) => (
                  <span key={`${entry.id}-${index}`}>
                    {line || "\u00a0"}
                    {index < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))}

            {messages.map((message) => {
              const lines = wrapText(
                `${message.username}: ${message.message}`,
                MESSAGE_LINE_LENGTH,
              );

              return (
                <p key={message.id}>
                  {lines.map((line, index) => (
                    <span key={`${message.id}-${index}`}>
                      {line}
                      {index < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              );
            })}
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
                  ? "Type a message or /help..."
                  : "Type /sign up <username> <password> or /help..."
              }
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command or message"
              disabled={busy || ethoTransition}
            />
            <button
              className="terminal-button"
              type="submit"
              disabled={!connected || busy || ethoTransition}
            >
              Enter
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
