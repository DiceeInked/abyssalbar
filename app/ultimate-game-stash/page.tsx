"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { GAME_BUCKET } from "../../lib/constants";
import "../globals.css";

type Game = {
  name: string;
  path: string;
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GameTonics() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadGames = async () => {
      const { data, error: storageError } = await supabase.storage
        .from(GAME_BUCKET)
        .list("", {
          limit: 1000,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (!mounted) {
        return;
      }

      if (storageError) {
        console.error("Error loading GameTonics:", storageError);
        setError("Unable to load the GameTonics library.");
        setLoading(false);
        return;
      }

      const detectedGames: Game[] = (data ?? [])
        .filter(
          (item) =>
            item.name &&
            !item.name.startsWith(".") &&
            item.id === null
        )
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
    const sections: Record<string, Game[]> = Object.fromEntries(
      ALPHABET.map((letter) => [letter, []])
    );

    filteredGames.forEach((game) => {
      const firstCharacter = game.name.trim().charAt(0).toUpperCase();

      if (sections[firstCharacter]) {
        sections[firstCharacter].push(game);
      }
    });

    return sections;
  }, [filteredGames]);

  const handleGameClick = (game: Game) => {
    const gamePath = game.path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    window.open(`/play/${gamePath}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="terminal">
      <div className="scanlines" />

      <div className="terminal-container">
        <section className="navigation-terminal">
          <div className="terminal-title">GameTonics</div>

          <div className="navigation-content">
            <Link href="/">Abyssal Bar</Link>
          </div>
        </section>

        <section className="terminal-window">
          <div className="terminal-title">GameTonics Game Library</div>

          <div className="gametonics-search">
            <span aria-hidden="true">&gt;</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search games..."
              autoComplete="off"
              spellCheck={false}
              aria-label="Search games"
            />
          </div>

          <div className="game-output">
            {loading && <p>Loading GameTonics...</p>}

            {!loading && error && <p>{error}</p>}

            {!loading && !error && games.length === 0 && (
              <p>No games have been added yet.</p>
            )}

            {!loading && !error && games.length > 0 && (
              <>
                <p>
                  {filteredGames.length}{" "}
                  {filteredGames.length === 1 ? "game" : "games"} found.
                </p>

                <p>&nbsp;</p>

                {ALPHABET.map((letter) => {
                  const letterGames = gamesByLetter[letter];

                  if (letterGames.length === 0) {
                    return null;
                  }

                  return (
                    <section key={letter} className="game-letter-section">
                      <p className="letter-heading">[{letter}]</p>

                      <div className="game-list">
                        {letterGames.map((game) => (
                          <button
                            key={game.path}
                            className="game-button"
                            type="button"
                            onClick={() => handleGameClick(game)}
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

          <div className="gametonics-footer">&gt; Select a game</div>
        </section>
      </div>
    </main>
  );
}
