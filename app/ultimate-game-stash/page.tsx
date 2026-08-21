"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./ugs.css";

type Game = {
  name: string;
  path: string;
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const GAME_BUCKET = "gametonics";

export default function GameTonics() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.storage
      .from(GAME_BUCKET)
      .list("", {
        limit: 1000,
        sortBy: {
          column: "name",
          order: "asc",
        },
      });

    if (error) {
      console.error("GameTonics loading error:", error);
      setError("Unable to load the GameTonics library.");
      setLoading(false);
      return;
    }

    if (!data) {
      setGames([]);
      setLoading(false);
      return;
    }

    const folders: Game[] = data
      .filter((item) => {
        if (!item.name || item.name.startsWith(".")) {
          return false;
        }

        return item.id === null;
      })
      .map((folder) => ({
        name: folder.name,
        path: folder.name,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        })
      );

    setGames(folders);
    setLoading(false);
  }

  const filteredGames = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return games;
    }

    return games.filter((game) =>
      game.name.toLowerCase().includes(searchTerm)
    );
  }, [games, search]);

  const gamesByLetter = useMemo(() => {
    const sections: Record<string, Game[]> = {};

    alphabet.forEach((letter) => {
      sections[letter] = [];
    });

    filteredGames.forEach((game) => {
      const firstCharacter = game.name
        .trim()
        .charAt(0)
        .toUpperCase();

      if (sections[firstCharacter]) {
        sections[firstCharacter].push(game);
      }
    });

    return sections;
  }, [filteredGames]);

  function openGame(game: Game) {
    // Game launching will be added later.
    console.log("Selected GameTonics game:", game.path);
  }

  return (
    <main className="terminal-page">
      <div className="crt-overlay" />

      <section className="terminal-window">
        <header className="terminal-header">
          <div className="terminal-title">
            ABYSSAL BAR // GAMETONICS
          </div>

          <div className="terminal-status">
            ONLINE
          </div>
        </header>

        <div className="terminal-body">
          <div className="terminal-intro">
            <div>&gt; GAMETONICS LIBRARY</div>
            <div>&gt; SEARCHING GAME DATABASE...</div>

            {!loading && !error && (
              <div>
                &gt; {games.length} GAME
                {games.length === 1 ? "" : "S"} FOUND
              </div>
            )}
          </div>

          <div className="terminal-search">
            <span>&gt;</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SEARCH GAMES"
              autoComplete="off"
              spellCheck={false}
            />

            <span className="cursor-block" />
          </div>

          {loading && (
            <div className="terminal-message">
              &gt; LOADING...
            </div>
          )}

          {!loading && error && (
            <div className="terminal-message terminal-error">
              &gt; ERROR: {error}
            </div>
          )}

          {!loading && !error && games.length === 0 && (
            <div className="terminal-message">
              &gt; NO GAMES HAVE BEEN ADDED YET.
            </div>
          )}

          {!loading && !error && games.length > 0 && (
            <div className="game-library">
              {alphabet.map((letter) => {
                const letterGames = gamesByLetter[letter];

                if (letterGames.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={letter}
                    className="game-letter-section"
                  >
                    <div className="letter-line">
                      <span>[ {letter} ]</span>
                    </div>

                    <div className="game-list">
                      {letterGames.map((game) => (
                        <button
                          key={game.path}
                          className="game-button"
                          onClick={() => openGame(game)}
                        >
                          <span className="game-prompt">
                            &gt;
                          </span>

                          <span className="game-name">
                            {game.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className="terminal-footer">
            <span>&gt; SELECT A GAME</span>
            <span className="footer-cursor">_</span>
          </div>
        </div>
      </section>
    </main>
  );
}
