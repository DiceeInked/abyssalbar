"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COMMAND_HELP, PLAY_USAGE, parsePlayCommand } from "../../lib/commands";
import { GAME_BUCKET, GAME_LIBRARY_ROUTE, PASSWORD_MAX, PASSWORD_MIN, SITE_VERSION, TERMINAL_DISPLAY_LINES, USERNAME_MAX, USERNAME_MIN } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import styles from "./page.module.css";

type Game = { name: string; path: string };
type Account = { id: string; username: string; created_at?: string };

const GAME_LIST_LIMIT = 1000;
const TERMINAL_VERSION = "1.5";
const COMMAND_OUTPUT_LINES = 8;

const isValidCredential = (value: string, minimum: number, maximum: number) => value.length >= minimum && value.length <= maximum && !/\s/.test(value);
const splitCommand = (value: string) => value.trim().split(/\s+/);

export default function GameTonics() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [input, setInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [commandOutput, setCommandOutput] = useState<string[]>(["gametonics ready.", "type /help for commands."]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const writeCommand = (text: string) => setCommandOutput(text.split("\n").map((line) => line || " ").slice(-COMMAND_OUTPUT_LINES));

  useEffect(() => {
    let mounted = true;
    const loadGames = async () => {
      const { data, error: storageError } = await supabase.storage.from(GAME_BUCKET).list("", { limit: GAME_LIST_LIMIT, sortBy: { column: "name", order: "asc" } });
      if (!mounted) return;
      if (storageError) {
        console.error("Error loading GameTonics:", storageError);
        setError("unable to load the gametonics library.");
        setLoading(false);
        return;
      }
      const detectedGames: Game[] = (data ?? [])
        .filter((item) => Boolean(item.name) && !item.name.startsWith(".") && item.id === null)
        .map((folder) => ({ name: folder.name, path: folder.name }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setGames(detectedGames);
      setLoading(false);
    };
    void loadGames();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const result = await response.json();
        setAccount(result.account ?? null);
      } catch (loadError) {
        console.error("Error loading account session:", loadError);
        writeCommand("authentication error: unable to load session.");
      }
    };
    void loadAccount();
  }, []);

  const filteredGames = useMemo(() => {
    const term = submittedSearch.trim().toLowerCase();
    return term ? games.filter((game) => game.name.toLowerCase().includes(term)) : games;
  }, [games, submittedSearch]);

  const visibleGames = filteredGames.slice(0, TERMINAL_DISPLAY_LINES);

  const launchGame = (game: Game) => {
    const gamePath = game.path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    router.push(`/play/${gamePath}`);
  };

  const authenticate = async (action: "sign_up" | "sign_in", username: string, password: string) => {
    if (!isValidCredential(username, USERNAME_MIN, USERNAME_MAX)) return void writeCommand(`username error: use ${USERNAME_MIN}-${USERNAME_MAX} characters with no spaces.`);
    if (!isValidCredential(password, PASSWORD_MIN, PASSWORD_MAX)) return void writeCommand(`password error: use ${PASSWORD_MIN}-${PASSWORD_MAX} characters with no spaces.`);
    setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, username, password }) });
      const result = await response.json();
      if (!response.ok) return void writeCommand(`${action === "sign_up" ? "sign up" : "sign in"} error: ${result.error}`);
      setAccount(result.account);
      writeCommand(action === "sign_up" ? `account created. welcome, ${result.account.username}!` : `signed in. welcome back, ${result.account.username}!`);
    } catch (authError) {
      console.error("Authentication error:", authError);
      writeCommand("authentication error: unable to contact the server.");
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign_out" }) });
      const result = await response.json();
      if (!response.ok) return void writeCommand(`sign out error: ${result.error}`);
      setAccount(null);
      writeCommand("signed out.");
    } catch (signOutError) {
      console.error("Sign out error:", signOutError);
      writeCommand("sign out error: unable to contact the server.");
    } finally { setBusy(false); }
  };

  const runCommand = async (value: string) => {
    const parts = splitCommand(value);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    switch (command) {
      case "/help": writeCommand(COMMAND_HELP); return;
      case "/home": if (args.length) return void writeCommand("usage: /home"); writeCommand("opening home..."); router.push("/"); return;
      case "/egg":
        if (!args.length) { writeCommand("opening egg..."); router.push("/egg"); return; }
        if (args.length === 1 && args[0] === "0") { writeCommand("opening egg 0..."); router.push("/egg?mode=0"); return; }
        writeCommand("usage: /egg or /egg 0"); return;
      case "/etho": if (args.length) return void writeCommand("usage: /etho"); writeCommand("opening etho..."); router.push("/etho"); return;
      case "/games": if (args.length) return void writeCommand("usage: /games"); writeCommand("opening games..."); router.push(GAME_LIBRARY_ROUTE); return;
      case "/tetris": if (args.length) return void writeCommand("usage: /tetris"); writeCommand("opening tetris..."); router.push("/tetris"); return;
      case "/play": {
        const gameName = parsePlayCommand(value);
        if (!gameName) return void writeCommand(PLAY_USAGE);
        const game = games.find((candidate) => candidate.name.toLowerCase() === gameName.toLowerCase());
        if (!game) return void writeCommand(`game not found: ${gameName}`);
        writeCommand(`opening ${game.name}...`);
        launchGame(game);
        return;
      }
      case "/sign": {
        const action = args[0]?.toLowerCase();
        if (action === "up" && args.length === 3) return void await authenticate("sign_up", args[1], args[2]);
        if (action === "in" && args.length === 3) return void await authenticate("sign_in", args[1], args[2]);
        if (action === "out" && args.length === 1) return void await signOut();
        writeCommand("usage: /sign up <username> <password>, /sign in <username> <password>, or /sign out");
        return;
      }
      case "/clear": setCommandOutput([]); return;
      default: writeCommand("unknown command. type /help.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    if (value.startsWith("/")) {
      writeCommand(`> ${value}`);
      await runCommand(value);
      return;
    }
    setSubmittedSearch(value);
    writeCommand(`search: ${value}`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.siteVersion} aria-label="Site version">site v{SITE_VERSION}</div>
      <section className={styles.terminal} aria-label="GameTonics">
        <header className={styles.header}>
          <span>guest terminal</span>
          <span>v{TERMINAL_VERSION}</span>
        </header>
        <div className={styles.gameOutput} aria-live="polite">
          {loading && <div className={styles.line}>loading gametonics...</div>}
          {!loading && error && <div className={styles.line}>{error}</div>}
          {!loading && !error && visibleGames.map((game) => (
            <div className={styles.gameLine} key={game.path}>
              <span className={styles.gamePrompt}>&gt;</span>{" "}
              <button className={styles.gameLink} type="button" onClick={() => launchGame(game)}>{game.name}</button>
            </div>
          ))}
          {!loading && !error && !visibleGames.length && <div className={styles.line}>no games found.</div>}
          {Array.from({ length: Math.max(0, TERMINAL_DISPLAY_LINES - visibleGames.length) }).map((_, index) => <div className={styles.line} key={`empty-${index}`}>&nbsp;</div>)}
        </div>
        <form className={styles.inputBar} onSubmit={handleSubmit}>
          <span className={styles.prompt} aria-hidden="true">&gt;</span>
          <input className={styles.input} type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="message or /help" autoComplete="off" spellCheck={false} aria-label="Terminal input" disabled={busy} />
        </form>
        <div className={styles.commandOutput} aria-label="Command output">
          {commandOutput.map((line, index) => <div className={styles.commandLine} key={`${index}-${line}`}>{line || "\u00a0"}</div>)}
        </div>
      </section>
    </main>
  );
}
