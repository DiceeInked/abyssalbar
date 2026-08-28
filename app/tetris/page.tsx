"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../page.module.css";
import { COMMAND_HELP } from "../../lib/commands";
import { SITE_VERSION } from "../../lib/constants";

type Cell = string | null;
type Shape = number[][];
type Piece = { shape: Shape; x: number; y: number; type: string };
type Board = Cell[][];
type GameState = { board: Board; piece: Piece; score: number; lines: number; gameOver: boolean };

const WIDTH = 16;
const HEIGHT = 16;
const PLAYER_WIDTH = 8;
const TERMINAL_VERSION = "1.6";
const COMMAND_OUTPUT_LINES = 8;

const PIECES: Record<string, Shape> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

const TYPES = Object.keys(PIECES);
const SCORE_VALUES = [0, 100, 300, 500, 800];

const emptyBoard = (width: number): Board =>
  Array.from({ length: HEIGHT }, () => Array<Cell>(width).fill(null));

const cloneShape = (shape: Shape): Shape => shape.map((row) => [...row]);

const createPiece = (width: number): Piece => {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const shape = cloneShape(PIECES[type]);
  return { shape, x: Math.floor((width - shape[0].length) / 2), y: 0, type };
};

const createGame = (width: number): GameState => ({
  board: emptyBoard(width),
  piece: createPiece(width),
  score: 0,
  lines: 0,
  gameOver: false,
});

const rotateShape = (shape: Shape): Shape =>
  shape[0].map((_, column) => shape.map((row) => row[column]).reverse());

const collides = (board: Board, piece: Piece, shape = piece.shape, x = piece.x, y = piece.y) => {
  for (let row = 0; row < shape.length; row += 1) {
    for (let column = 0; column < shape[row].length; column += 1) {
      if (!shape[row][column]) continue;
      const boardX = x + column;
      const boardY = y + row;
      if (boardX < 0 || boardX >= board[0].length || boardY >= HEIGHT) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }
  return false;
};

const mergePiece = (board: Board, piece: Piece): Board => {
  const next = board.map((row) => [...row]);
  piece.shape.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
    const x = piece.x + columnIndex;
    const y = piece.y + rowIndex;
    if (filled && y >= 0 && y < HEIGHT && x >= 0 && x < board[0].length) next[y][x] = piece.type;
  }));
  return next;
};

const clearLines = (board: Board) => {
  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(board[0].length).fill(null));
  return { board: [...emptyRows, ...remaining], cleared };
};

const dropY = (board: Board, piece: Piece) => {
  let y = piece.y;
  while (!collides(board, piece, piece.shape, piece.x, y + 1)) y += 1;
  return y;
};

const advance = (game: GameState, dx: number, dy: number): GameState => {
  if (game.gameOver) return game;
  if (!collides(game.board, game.piece, game.piece.shape, game.piece.x + dx, game.piece.y + dy)) {
    return { ...game, piece: { ...game.piece, x: game.piece.x + dx, y: game.piece.y + dy } };
  }
  if (dy <= 0) return game;
  const merged = mergePiece(game.board, game.piece);
  const result = clearLines(merged);
  const nextPiece = createPiece(merged[0].length);
  const gameOver = collides(result.board, nextPiece);
  return {
    ...game,
    board: result.board,
    piece: gameOver ? game.piece : nextPiece,
    lines: game.lines + result.cleared,
    score: game.score + (SCORE_VALUES[result.cleared] ?? 0),
    gameOver,
  };
};

const rotateGame = (game: GameState): GameState => {
  if (game.gameOver) return game;
  const rotated = rotateShape(game.piece.shape);
  for (const offset of [0, -1, 1, -2, 2]) {
    if (!collides(game.board, game.piece, rotated, game.piece.x + offset, game.piece.y)) {
      return { ...game, piece: { ...game.piece, shape: rotated, x: game.piece.x + offset } };
    }
  }
  return game;
};

const hardDropGame = (game: GameState): GameState => {
  if (game.gameOver) return game;
  const y = dropY(game.board, game.piece);
  return advance({ ...game, piece: { ...game.piece, y } }, 0, 1);
};

const renderBoard = (game: GameState): Board => {
  const board = game.board.map((row) => [...row]);
  const ghostY = dropY(game.board, game.piece);
  game.piece.shape.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
    if (!filled) return;
    const x = game.piece.x + columnIndex;
    const y = ghostY + rowIndex;
    if (y >= 0 && y < HEIGHT && x >= 0 && x < board[0].length && !board[y][x]) board[y][x] = "ghost";
  }));
  game.piece.shape.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
    if (!filled) return;
    const x = game.piece.x + columnIndex;
    const y = game.piece.y + rowIndex;
    if (y >= 0 && y < HEIGHT && x >= 0 && x < board[0].length) board[y][x] = game.piece.type;
  }));
  return board;
};

const gameCells = (board: Board, keyPrefix: string) => board.flatMap((row, y) => row.map((cell, x) => (
  <div key={`${keyPrefix}-${x}-${y}`} className={`tetris-cell${cell ? " tetris-cell-filled" : ""}${cell === "ghost" ? " tetris-cell-ghost" : ""}`} />
)));

export default function Tetris() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const twoPlayer = searchParams.get("mode") === "2";
  const [single, setSingle] = useState<GameState>(() => createGame(WIDTH));
  const [playerOne, setPlayerOne] = useState<GameState>(() => createGame(PLAYER_WIDTH));
  const [playerTwo, setPlayerTwo] = useState<GameState>(() => createGame(PLAYER_WIDTH));
  const [input, setInput] = useState("");
  const [commandOutput, setCommandOutput] = useState<string[]>(["tetris ready.", "type /help for commands."]);

  const writeCommand = useCallback((text: string) => {
    setCommandOutput(text.split("\n").map((line) => line || " ").slice(-COMMAND_OUTPUT_LINES));
  }, []);

  const reset = useCallback(() => {
    if (twoPlayer) {
      setPlayerOne(createGame(PLAYER_WIDTH));
      setPlayerTwo(createGame(PLAYER_WIDTH));
    } else {
      setSingle(createGame(WIDTH));
    }
  }, [twoPlayer]);

  const runCommand = useCallback((value: string) => {
    const parts = value.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const arg = parts[1];
    if (command === "/help" && parts.length === 1) return void writeCommand(COMMAND_HELP);
    if (command === "/clear" && parts.length === 1) return void setCommandOutput([]);
    if (command === "/home" && parts.length === 1) { writeCommand("opening home..."); router.push("/"); return; }
    if (command === "/games" && parts.length === 1) { writeCommand("opening games..."); router.push("/gametonics"); return; }
    if (command === "/tetris" && (!arg || arg === "1") && parts.length <= 2) { writeCommand("opening tetris 1..."); router.push("/tetris?mode=1"); return; }
    if (command === "/tetris" && arg === "2" && parts.length === 2) { writeCommand("opening tetris 2..."); router.push("/tetris?mode=2"); return; }
    if (command === "/egg" && (!arg || arg === "0" || arg === "1") && parts.length <= 2) { writeCommand(`opening egg${arg ? ` ${arg}` : ""}...`); router.push(arg ? `/egg?mode=${arg}` : "/egg"); return; }
    if (command === "/etho" && parts.length === 1) { writeCommand("opening etho..."); router.push("/etho"); return; }
    writeCommand("unknown command. type /help.");
  }, [router, writeCommand]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");
    if (value.startsWith("/")) {
      writeCommand(`> ${value}`);
      runCommand(value);
    } else {
      writeCommand("tetris: commands only. type /help.");
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (twoPlayer) {
        setPlayerOne((game) => advance(game, 0, 1));
        setPlayerTwo((game) => advance(game, 0, 1));
      } else {
        setSingle((game) => advance(game, 0, 1));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [twoPlayer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const controlled = ["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "s", "d", "w"].includes(key);
      if (!controlled) return;
      event.preventDefault();
      if (twoPlayer) {
        if (key === "a") setPlayerOne((game) => advance(game, -1, 0));
        else if (key === "d") setPlayerOne((game) => advance(game, 1, 0));
        else if (key === "s") setPlayerOne(hardDropGame);
        else if (key === "w") setPlayerOne(rotateGame);
        else if (key === "arrowleft") setPlayerTwo((game) => advance(game, -1, 0));
        else if (key === "arrowright") setPlayerTwo((game) => advance(game, 1, 0));
        else if (key === "arrowdown") setPlayerTwo(hardDropGame);
        else if (key === "arrowup") setPlayerTwo(rotateGame);
      } else {
        if (key === "arrowleft") setSingle((game) => advance(game, -1, 0));
        else if (key === "arrowright") setSingle((game) => advance(game, 1, 0));
        else if (key === "arrowdown") setSingle(hardDropGame);
        else if (key === "arrowup") setSingle(rotateGame);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [twoPlayer]);

  const singleBoard = useMemo(() => renderBoard(single), [single]);
  const boardOne = useMemo(() => renderBoard(playerOne), [playerOne]);
  const boardTwo = useMemo(() => renderBoard(playerTwo), [playerTwo]);

  return (
    <main className={styles.page}>
      <div className={styles.siteVersion} aria-label="Site version">site v{SITE_VERSION}</div>
      <section className={`${styles.terminal} tetris-terminal`} aria-label="Tetris">
        <header className={styles.header}>
          <span>guest terminal</span>
          <span>v{TERMINAL_VERSION}</span>
        </header>
        <div className="tetris-play-area" aria-label={twoPlayer ? "Two-player Tetris board" : "Tetris board"}>
          {!twoPlayer ? (
            <div className="tetris-board tetris-board-single">{gameCells(singleBoard, "single")}</div>
          ) : (
            <div className="tetris-dual-board">
              <div className="tetris-player-panel"><div className="tetris-player-label">player 1</div><div className="tetris-board">{gameCells(boardOne, "one")}</div><div>score: {playerOne.score} · lines: {playerOne.lines}</div></div>
              <div className="tetris-divider" aria-hidden="true" />
              <div className="tetris-player-panel"><div className="tetris-player-label">player 2</div><div className="tetris-board">{gameCells(boardTwo, "two")}</div><div>score: {playerTwo.score} · lines: {playerTwo.lines}</div></div>
            </div>
          )}
          {((!twoPlayer && single.gameOver) || (twoPlayer && (playerOne.gameOver || playerTwo.gameOver))) && <div className="tetris-game-over">game over</div>}
        </div>
        <form className={styles.inputBar} onSubmit={submit}>
          <span className={styles.prompt} aria-hidden="true">&gt;</span>
          <input className={styles.input} type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="message or /help" autoComplete="off" spellCheck={false} aria-label="Terminal input" />
        </form>
        <div className={styles.commandOutput} aria-label="Command output">
          {commandOutput.map((line, index) => <div className={styles.commandLine} key={`${index}-${line}`}>{line || "\u00a0"}</div>)}
        </div>
        <div className="tetris-footer-controls">
          <span>{twoPlayer ? "p1: wasd · p2: arrow keys" : "← → move · ↑ rotate · ↓ drop"}</span>
          <button className="terminal-button" type="button" onClick={reset}>restart</button>
        </div>
      </section>
    </main>
  );
}
