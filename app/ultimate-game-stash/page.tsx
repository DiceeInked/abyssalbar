"use client";

import { useMemo, useState } from "react";
import "./ugs.css";

type Game = {
  name: string;
  letter?: string;
  path?: string;
};

/*
 * Approved games go here later.
 *
 * Nothing is automatically imported from UGS.
 *
 * Example:
 *
 * {
 *   name: "My Approved Game",
 *   letter: "M",
 *   path: "/games/my-approved-game"
 * }
 */
const approvedGames: Game[] = [];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function UltimateGameStash() {
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      return approvedGames;
    }

    return approvedGames.filter((game) =>
      game.name.toLowerCase().includes(term)
    );
  }, [search]);

  const gamesByLetter = useMemo(() => {
    const sections: Record<string, Game[]> = {};

    alphabet.forEach((letter) => {
      sections[letter] = [];
    });

    filteredGames.forEach((game) => {
      const letter =
        game.letter?.toUpperCase() ||
        game.name.charAt(0).toUpperCase();

      if (sections[letter]) {
        sections[letter].push(game);
      }
    });

    return sections;
  }, [filteredGames]);

  const scrollToLetter = (letter: string) => {
    document
      .getElementById(`letter-${letter}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <main className="ugs-page">

      {/* CRT overlay */}
      <div className="ugs-scanlines" />

      {/* Alphabet sidebar */}
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

      {/* Main content */}
      <div className="ugs-main-content">

        <h1>UGS Files</h1>

        <h2 className="ugs-subtitle">
          Files from{" "}
          <span className="ugs-link-text">
            Ultimate Game Stash
          </span>
        </h2>

        <h2 className="ugs-subtitle">
          Abyssal Bar Game Stash
        </h2>

        {/* Search */}
        <div className="ugs-search-container">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ugs-search"
          />
        </div>

        {/* Game sections */}
        <div className="ugs-sections-container">

          {alphabet.map((letter) => {
            const games = gamesByLetter[letter];

            return (
              <section
                key={letter}
                id={`letter-${letter}`}
                className={`ugs-letter-section ${
                  games.length === 0 ? "empty" : ""
                }`}
              >

                <h2 className="ugs-letter-header">
                  {letter}
                </h2>

                {games.length > 0 ? (
                  <div className="ugs-buttons-container">
                    {games.map((game) => (
                      <button
                        key={game.name}
                        className="ugs-game-button"
                        onClick={() => {
                          if (game.path) {
                            window.location.href = game.path;
                          }
                        }}
                      >
                        {game.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ugs-empty-message">
                    No approved files.
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
