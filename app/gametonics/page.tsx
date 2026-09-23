"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COMMAND_HELP, PLAY_USAGE, parsePlayCommand } from "../../lib/commands";
import { GAME_BUCKET, GAME_LIBRARY_ROUTE, SITE_VERSION, TERMINAL_DISPLAY_LINES } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import styles from "./page.module.css";

type Game = { name: string; path: string };
const GAME_LIST_LIMIT = 1000;
const COMMAND_OUTPUT_LINES = 8;
const isValidCredential = (value: string, minimum: number, maximum: number) => value.length >= minimum && value.length <= maximum && !/\s/.test(value);
const splitCommand = (value: string) => value.trim().split(/\s+/);

export default function GameTonics() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [input, setInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [commandOutput, setCommandOutput] = useState<string[]>(["gametonics ready.", "type /help for commands."]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const writeCommand = (text: string) => setCommandOutput(text.split("\n").map((line) => line || " ").slice(-COMMAND_OUTPUT_LINES));
  useEffect(() => {
    let mounted = true;
    const loadGames = async () => {
      const { data, error: storageError } = await supabase.storage.from(GAME_BUCKET).list("", { limit: GAME_LIST_LIMIT, sortBy: { column: "name", order: "asc" } });
      if (!mounted) return;
      if (storageError) { console.error("Error loading GameTonics:", storageError); setError("unable to load the gametonics library."); setLoading(false); return; }
      const detectedGames: Game[] = (data ?? []).filter((item) => Boolean(item.name) && !item.name.startsWith(".") && item.id === null).map((folder) => ({ name: folder.name, path: folder.name })).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setGames(detectedGames); setLoading(false);
    };
    void loadGames(); return () => { mounted = false; };
  }, []);
  const filteredGames = useMemo(() => { const term = submittedSearch.trim().toLowerCase(); return term ? games.filter((game) => game.name.toLowerCase().includes(term)) : games; }, [games, submittedSearch]);
  const visibleGames = filteredGames.slice(0, TERMINAL_DISPLAY_LINES);
  const launchGame = (game: Game) => router.push(`/play/${game.path.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`);
  const runCommand = async (value: string) => {
    const parts = splitCommand(value); const command = parts[0]?.toLowerCase(); const args = parts.slice(1);
    switch (command) {
      case "/help": writeCommand(COMMAND_HELP); return;
      case "/home": if (args.length) return void writeCommand("usage: /home"); writeCommand("opening home..."); router.push("/"); return;
      case "/egg": if (!args.length) { writeCommand("opening egg..."); router.push("/egg"); return; } if (args.length === 1 && (args[0] === "0" || args[0] === "1")) { writeCommand(`opening egg ${args[0]}...`); router.push(`/egg?mode=${args[0]}`); return; } writeCommand("usage: /egg, /egg 0, or /egg 1"); return;
      case "/etho": if (args.length) return void writeCommand("usage: /etho"); writeCommand("opening etho..."); router.push("/etho"); return;
      case "/games": if (args.length) return void writeCommand("usage: /games"); writeCommand("opening games..."); router.push(GAME_LIBRARY_ROUTE); return;
      case "/tetris": if (!args.length || (args.length === 1 && args[0] === "1")) { writeCommand("opening tetris 1..."); router.push("/tetris?mode=1"); return; } if (args.length === 1 && args[0] === "2") { writeCommand("opening tetris 2..."); router.push("/tetris?mode=2"); return; } writeCommand("usage: /tetris, /tetris 1, or /tetris 2"); return;
      case "/play": { const gameName = parsePlayCommand(value); if (!gameName) return void writeCommand(PLAY_USAGE); const game = games.find((candidate) => candidate.name.toLowerCase() === gameName.toLowerCase()); if (!game) return void writeCommand(`game not found: ${gameName}`); writeCommand(`opening ${game.name}...`); launchGame(game); return; }
      case "/clear": setCommandOutput([]); return;
      default: writeCommand("unknown command. type /help.");
    }
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = input.trim(); if (!value || busy) return; setInput(""); if (value.startsWith("/")) { writeCommand(`> ${value}`); await runCommand(value); return; } setSubmittedSearch(value); writeCommand(`search: ${value}`); };
  return (
    <main className={styles.page}>
      <div className={styles.siteVersion} aria-label="Site version">site v{SITE_VERSION}</div>
      <section className={styles.terminal} aria-label="GameTonics">
        <header className={styles.header}><span>guest terminal</span></header>
        <div className={styles.gameOutput} aria-live="polite">
          {loading && <div className={styles.line}>loading gametonics...</div>}
          {!loading && error && <div className={styles.line}>{error}</div>}
          {!loading && !error && visibleGames.map((game) => <div className={styles.gameLine} key={game.path}><span className={styles.gamePrompt}>&gt;</span>{" "}<button className={styles.gameLink} type="button" onClick={() => launchGame(game)}>{game.name}</button></div>)}
          {!loading && !error && !visibleGames.length && <div className={styles.line}>no games found.</div>}
          {Array.from({ length: Math.max(0, TERMINAL_DISPLAY_LINES - visibleGames.length) }).map((_, index) => <div className={styles.line} key={`empty-${index}`}>&nbsp;</div>)}
        </div>
        <form className={styles.inputBar} onSubmit={handleSubmit}><span className={styles.prompt} aria-hidden="true">&gt;</span><input className={styles.input} type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="message or /help" autoComplete="off" spellCheck={false} aria-label="Terminal input" disabled={busy} /></form>
        <div className={styles.commandOutput} aria-label="Command output">{commandOutput.map((line, index) => <div className={styles.commandLine} key={`${index}-${line}`}>{line || "\u00a0"}</div>)}</div>
      </section>
    </main>
  );
}
