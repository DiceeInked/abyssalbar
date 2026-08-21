"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
    let mounted = true;

    const loadGames = async () => {
      const { data, error } = await supabase.storage
        .from(GAME_BUCKET)
        .list("", {
          limit: 1000,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (!mounted) return;

      if (error) {
        console.error("Error loading GameTonics:", error);
        setError("Unable to load the GameTonics library.");
        setLoading(false);
        return;
      }

      if (!data) {
        setGames([]);
        setLoading(false);
        return;
      }

      const detectedGames: Game[] = data
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

      setGames(detectedGames);
      setLoading(false);
    };

    loadGames();

    return () => {
      mounted = false;
    };
  }, []);

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
      const firstCharacter = game.name.trim().charAt(0).toUpperCase();

      if (sections[firstCharacter]) {
        sections[firstCharacter].push(game);
      }
    });

    return sections;
  }, [filteredGames]);

  const handleGameClick = (game: Game) => {
    /*
     * Game launching will be added later.
     *
     * For now, the button simply behaves like
     * the navigation buttons on the home page.
     */
    console.log("Selected GameTonics game:", game.path);
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      <div className="terminal-container">

        {/* Navigation Terminal */}

        <section className="navigation-terminal">
          <div className="terminal-title">
            GAMETONICS
          </div>

          <div className="navigation-content">
            <Link href="/">
              ABYSSAL BAR
            </Link>
          </div>
        </section>


        {/* GameTonics Terminal */}

        <section className="terminal-window">

          <div className="terminal-title">
            GAMETONICS GAME LIBRARY
          </div>


          {/* Search */}

          <div className="gametonics-search">

            <span>&gt;</span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              autoComplete="off"
              spellCheck={false}
              aria-label="Search games"
            />

          </div>


          {/* Library */}

          <div className="game-output">

            {loading && (
              <p>
                Loading GameTonics...
              </p>
            )}


            {!loading && error && (
              <p>
                {error}
              </p>
            )}


            {!loading && !error && games.length === 0 && (
              <p>
                No games have been added yet.
              </p>
            )}


            {!loading && !error && games.length > 0 && (
              <>
                <p>
                  {filteredGames.length}{" "}
                  {filteredGames.length === 1
                    ? "game"
                    : "games"}{" "}
                  found.
                </p>

                <p>
                  &nbsp;
                </p>


                {alphabet.map((letter) => {

                  const letterGames =
                    gamesByLetter[letter];

                  if (letterGames.length === 0) {
                    return null;
                  }

                  return (
                    <section
                      key={letter}
                      className="game-letter-section"
                    >

                      <p className="letter-heading">
                        [{letter}]
                      </p>


                      <div className="game-list">

                        {letterGames.map((game) => (

                          <button
                            key={game.path}
                            className="game-button"
                            onClick={() =>
                              handleGameClick(game)
                            }
                          >
                            {game.name}
                          </button>

                        ))}

                      </div>

                    </section>
                  );

                })}
              </>
            )}

          </div>


          {/* Terminal Footer */}

          <div className="gametonics-footer">
            &gt; SELECT A GAME
          </div>

        </section>

      </div>
    </main>
  );
}
