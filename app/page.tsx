"use client";

import { FormEvent, useEffect, useState } from "react";
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

type CommandHandler = (args: string[], commandText: string) => void | Promise<void>;

const MESSAGE_LINE_LENGTH = 80;
const ETHO_TRANSITION_MS = 900;

const isValidCredential = (value: string, min: number, max: number) =>
  value.length >= min && value.length <= max && !/\s/.test(value);

const getCommandParts = (commandText: string) =>
  commandText.trim().split(/\s+/);

const sortMessages = (messages: Message[]) =>
  [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
};

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
  const [ethoTransition, setEthoTransition] = useState(false);

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

  const playEthoGlitchSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context = new AudioContextClass();
      const gain = context.createGain();
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(70, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1800,
        context.currentTime + 0.16
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        110,
        context.currentTime + 0.42
      );

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, context.currentTime);
      filter.Q.setValueAtTime(7, context.currentTime);

      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.52);

      window.setTimeout(() => {
        void context.close();
      }, 650);
    } catch (error) {
      console.debug("Etho transition audio unavailable:", error);
    }
  };

  const startEthoTransition = async () => {
    if (ethoTransition) {
      return;
    }

    setEthoTransition(true);
    playEthoGlitchSound();

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ETHO_TRANSITION_MS);
    });

    router.push("/etho");
  };

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

  // Add new top-level commands to this object.
  // Each command receives its arguments and the original command text.
  const commands: Record<string, CommandHandler> = {
    "/egg": (args) => {
      if (args.length === 0) {
        router.push("/egg");
        return;
      }

      if (args.length === 1 && args[0] === "0") {
        router.push("/egg?mode=0");
        return;
      }

      setCommandOutput("Usage: /egg or /egg 0");
    },

    "/etho": async (args) => {
      if (args.length !== 0) {
        setCommandOutput("Usage: /etho");
        return;
      }

      await startEthoTransition();
    },

    "/games": (args) => {
      if (args.length !== 0) {
        setCommandOutput("Usage: /games");
        return;
      }

      router.push("/ultimate-game-stash");
    },

    "/tetris": (args) => {
      if (args.length !== 0) {
        setCommandOutput("Usage: /tetris");
        return;
      }

      router.push("/tetris");
    },

    "/sign": async (args) => {
      const action = args[0]?.toLowerCase();

      const signCommands: Record<string, () => void | Promise<void>> = {
        up: async () => {
          if (args.length !== 3) {
            setCommandOutput("Usage: /sign up <username> <password>");
            return;
          }

          await authenticate("sign_up", args[1], args[2]);
        },

        in: async () => {
          if (args.length !== 3) {
            setCommandOutput("Usage: /sign in <username> <password>");
            return;
          }

          await authenticate("sign_in", args[1], args[2]);
        },

        out: async () => {
          if (args.length !== 1) {
            setCommandOutput("Usage: /sign out");
            return;
          }

          await handleSignOut();
        },
      };

      const handler = action ? signCommands[action] : undefined;

      if (!handler) {
        setCommandOutput(
          "Usage: /sign up <username> <password>, /sign in <username> <password>, or /sign out"
        );
        return;
      }

      await handler();
    },
  };

  const handleCommand = async (commandText: string) => {
    const parts = getCommandParts(commandText);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    const handler = command ? commands[command] : undefined;

    if (!handler) {
      setCommandOutput(
        "Unknown command. Available: /sign, /egg, /etho, /games, /tetris"
      );
      return;
    }

    await handler(args, commandText);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || busy || ethoTransition) {
      return;
    }

    setInput("");

    if (trimmedInput.startsWith("/")) {
      await handleCommand(trimmedInput);
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
          <div className="terminal-title">Abyssal Bar Terminal</div>

          <div className="terminal-output">
            <p>Abyssal Bar Terminal v2.20</p>
            <p>--------------------------------</p>
            <p>
              Connection status: {connected ? "Online" : "Connecting..."}
            </p>
            <p>Account: {account ? account.username : "Not signed in"}</p>
            <p>{commandOutput}</p>
            <p>&nbsp;</p>

            {messages.map((message) => {
              const lines = wrapText(
                `${message.username}: ${message.message}`,
                MESSAGE_LINE_LENGTH
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
                  ? "Type a message or /command..."
                  : "/sign up <username> <password>"
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
