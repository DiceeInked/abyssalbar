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
  created_at: string;
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

    const loadAccount = async (userId: string) => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, username, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading account:", error);
        return;
      }

      if (mounted) {
        setAccount(data);
      }
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session?.user) {
        await loadAccount(data.session.user.id);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          await loadAccount(session.user.id);
        } else {
          setAccount(null);
        }
      }
    );

    loadSession();

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

    loadMessages();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
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

  const handleSignUp = async (username: string, password: string) => {
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
      // Supabase Auth uses an email-shaped identifier internally. The public
      // terminal still exposes only the username to the user.
      const authIdentifier = `${username.toLowerCase()}@accounts.abyssalbar.local`;

      const { data, error } = await supabase.auth.signUp({
        email: authIdentifier,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        setCommandOutput(`SIGN UP ERROR: ${error.message}`);
        return;
      }

      if (!data.user) {
        setCommandOutput("SIGN UP ERROR: account could not be created.");
        return;
      }

      if (data.session) {
        const { error: accountError } = await supabase.from("accounts").upsert({
          id: data.user.id,
          username,
        });

        if (accountError) {
          console.error("Error creating account profile:", accountError);
          setCommandOutput(
            `ACCOUNT AUTHENTICATED, BUT PROFILE CREATION FAILED: ${accountError.message}`
          );
          return;
        }

        const { data: createdAccount } = await supabase
          .from("accounts")
          .select("id, username, created_at")
          .eq("id", data.user.id)
          .single();

        setAccount(createdAccount);
        setCommandOutput(`ACCOUNT CREATED. Welcome, ${username}!`);
      } else {
        setCommandOutput(
          "ACCOUNT CREATED. Supabase is requiring email confirmation before you can sign in."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
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
      const authIdentifier = `${username.toLowerCase()}@accounts.abyssalbar.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: authIdentifier,
        password,
      });

      if (error) {
        setCommandOutput(`SIGN IN ERROR: ${error.message}`);
        return;
      }

      if (!data.user) {
        setCommandOutput("SIGN IN ERROR: account could not be loaded.");
        return;
      }

      const { data: signedInAccount, error: accountError } = await supabase
        .from("accounts")
        .select("id, username, created_at")
        .eq("id", data.user.id)
        .single();

      if (accountError) {
        console.error("Error loading account profile:", accountError);
        setCommandOutput(`SIGN IN ERROR: ${accountError.message}`);
        return;
      }

      setAccount(signedInAccount);
      setCommandOutput(`SIGNED IN. Welcome back, ${signedInAccount.username}!`);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setCommandOutput(`SIGN OUT ERROR: ${error.message}`);
        return;
      }

      setAccount(null);
      setCommandOutput("SIGNED OUT.");
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

          await handleSignUp(parts[1], parts[2]);
          return;
        }

        if (action === "in") {
          if (parts.length !== 3) {
            setCommandOutput("USAGE: /sign in <username> <password>");
            return;
          }

          await handleSignIn(parts[1], parts[2]);
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

    if (!connected) return;

    const { error } = await supabase.from("messages").insert({
      account_id: account.id,
      username: account.username,
      message: trimmedInput,
    });

    if (error) {
      console.error("Error sending message:", error);
      setCommandOutput(`MESSAGE ERROR: ${error.message}`);
      return;
    }

    setInput("");
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
