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

        // Supabase folder entries have a null id.
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

  function scrollToLetter(letter: string) {
    document
      .getElementById(`letter-${letter}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function openGame(game: Game) {
    /*
     * We will finish the game-launching system after
     * testing the first game format.
     *
     * Supabase currently serves HTML files as plain text,
     * so we don't want to assume that opening index.html
     * directly will work correctly.
     */
    console.log("Selected GameTonics game:", game.path);
  }

  return (
    <main className="ugs-page">
      <div className="ugs-scanlines" />

      <aside className="ugs-sidebar">
        {alphabet.map((letter) => (
          <button
            key={letter}
            className="ugs-sidebar-btn"
            onClick={() => scrollToLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </aside>

      <div className="ugs-main-content">
        <h1>GAMETONICS</h1>

        <h2 className="ugs-subtitle">
          Abyssal Bar Game Library
        </h2>

        <div className="ugs-search-container">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ugs-search"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {loading && (
          <div className="ugs-status">
            Loading GameTonics library...
          </div>
        )}

        {!loading && error && (
          <div className="ugs-status ugs-error">
            {error}
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="ugs-status">
            No games have been added yet.
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="ugs-status">
            {filteredGames.length} game
            {filteredGames.length === 1 ? "" : "s"} found.
          </div>
        )}

        <div className="ugs-sections-container">
          {alphabet.map((letter) => {
            const letterGames = gamesByLetter[letter];

            return (
              <section
                key={letter}
                id={`letter-${letter}`}
                className={`ugs-letter-section ${
                  letterGames.length === 0 ? "empty" : ""
                }`}
              >
                <h2 className="ugs-letter-header">
                  {letter}
                </h2>

                {letterGames.length > 0 ? (
                  <div className="ugs-buttons-container">
                    {letterGames.map((game) => (
                      <button
                        key={game.path}
                        className="ugs-game-button"
                        onClick={() => openGame(game)}
                      >
                        {game.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ugs-empty-message">
                    No games.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
