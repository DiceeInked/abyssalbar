"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const WIDTH = 10;
const HEIGHT = 20;

type Cell = string | null;
type Board = Cell[][];
type Point = { x: number; y: number };
type Piece = { shape: number[][]; x: number; y: number; type: string };

const PIECES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

const TYPES = Object.keys(PIECES);

const emptyBoard = (): Board =>
  Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null));

const cloneShape = (shape: number[][]) => shape.map((row) => [...row]);

const createPiece = (): Piece => {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const shape = cloneShape(PIECES[type]);

  return {
    shape,
    x: Math.floor((WIDTH - shape[0].length) / 2),
    y: 0,
    type,
  };
};

const rotate = (shape: number[][]) =>
  shape[0].map((_, column) =>
    shape.map((row) => row[column]).reverse()
  );

const collides = (board: Board, piece: Piece, shape = piece.shape, x = piece.x, y = piece.y) => {
  for (let row = 0; row < shape.length; row += 1) {
    for (let column = 0; column < shape[row].length; column += 1) {
      if (!shape[row][column]) continue;

      const boardX = x + column;
      const boardY = y + row;

      if (boardX < 0 || boardX >= WIDTH || boardY >= HEIGHT) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }

  return false;
};

const mergePiece = (board: Board, piece: Piece): Board => {
  const next = board.map((row) => [...row]);

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((filled, columnIndex) => {
      if (filled && piece.y + rowIndex >= 0) {
        next[piece.y + rowIndex][piece.x + columnIndex] = piece.type;
      }
    });
  });

  return next;
};

const clearLines = (board: Board) => {
  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(WIDTH).fill(null));

  return {
    board: [...emptyRows, ...remaining],
    cleared,
  };
};

export default function Tetris() {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [piece, setPiece] = useState<Piece>(() => createPiece());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setPiece(createPiece());
    setScore(0);
    setLines(0);
    setGameOver(false);
  }, []);

  const lockPiece = useCallback(() => {
    setBoard((currentBoard) => {
      const merged = mergePiece(currentBoard, piece);
      const result = clearLines(merged);
      const nextPiece = createPiece();

      setLines((current) => current + result.cleared);
      setScore((current) => current + [0, 100, 300, 500, 800][result.cleared]);

      if (collides(result.board, nextPiece)) {
        setGameOver(true);
      } else {
        setPiece(nextPiece);
      }

      return result.board;
    });
  }, [piece]);

  const move = useCallback((dx: number, dy: number) => {
    if (gameOver) return false;

    if (!collides(board, piece, piece.shape, piece.x + dx, piece.y + dy)) {
      setPiece((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
      return true;
    }

    if (dy > 0) lockPiece();
    return false;
  }, [board, piece, gameOver, lockPiece]);

  const rotatePiece = useCallback(() => {
    if (gameOver) return;
    const rotated = rotate(piece.shape);

    for (const offset of [0, -1, 1, -2, 2]) {
      if (!collides(board, piece, rotated, piece.x + offset, piece.y)) {
        setPiece((current) => ({
          ...current,
          shape: rotated,
          x: current.x + offset,
        }));
        return;
      }
    }
  }, [board, piece, gameOver]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") move(-1, 0);
      else if (event.key === "ArrowRight") move(1, 0);
      else if (event.key === "ArrowDown") move(0, 1);
      else if (event.key === "ArrowUp") rotatePiece();
      else if (event.key === " ") {
        let moved = true;
        while (moved) moved = move(0, 1);
      } else if (event.key.toLowerCase() === "r") {
        reset();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, rotatePiece, reset]);

  useEffect(() => {
    if (gameOver) return;

    const speed = Math.max(100, 650 - Math.floor(lines / 10) * 70);
    const timer = window.setInterval(() => move(0, 1), speed);
    return () => window.clearInterval(timer);
  }, [move, gameOver, lines]);

  const displayBoard = useMemo(() => {
    const next = board.map((row) => [...row]);

    piece.shape.forEach((row, rowIndex) => {
      row.forEach((filled, columnIndex) => {
        const y = piece.y + rowIndex;
        const x = piece.x + columnIndex;
        if (filled && y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH) {
          next[y][x] = piece.type;
        }
      });
    });

    return next;
  }, [board, piece]);

  return (
    <main className="terminal">
      <div className="scanlines" />
      <div className="terminal-container">
        <section className="terminal-window">
          <div className="terminal-title">TETRIS</div>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${WIDTH}, 22px)`,
                gridTemplateRows: `repeat(${HEIGHT}, 22px)`,
                gap: "1px",
                border: "1px solid currentColor",
                width: "fit-content",
              }}
            >
              {displayBoard.flatMap((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      width: "22px",
                      height: "22px",
                      border: "1px solid rgba(0,255,200,.18)",
                      background: cell ? "currentColor" : "transparent",
                      opacity: cell ? 0.9 : 0.35,
                    }}
                  />
                ))
              )}
            </div>

            <div>
              <p>Score: {score}</p>
              <p>Lines: {lines}</p>
              <p>← → Move</p>
              <p>↑ Rotate</p>
              <p>↓ Drop</p>
              <p>Space: Hard drop</p>
              <p>R: Restart</p>
              {gameOver && <p>GAME OVER</p>}
              <button className="terminal-button" onClick={reset}>
                Restart
              </button>
              <button
                className="terminal-button"
                onClick={() => router.push("/")}
                style={{ marginLeft: "8px" }}
              >
                Back
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
