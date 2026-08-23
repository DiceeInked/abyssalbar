"use client";

import { use } from "react";

export default function GamePlayer({
  params,
}: {
  params: Promise<{ game: string[] }>;
}) {
  const { game } = use(params);
  const gamePath = game.map(encodeURIComponent).join("/");
  const gameUrl = `/api/games/${gamePath}/index.html`;

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#000",
      }}
    >
      <iframe
        title={`${game.join("/")} game`}
        src={gameUrl}
        sandbox="allow-scripts allow-forms allow-pointer-lock"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </main>
  );
}
