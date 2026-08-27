"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Cell = string | null;
type Board = Cell[][];
type Piece = {
  shape: number[][];
  x: number;
  y: number;
  type: string;
};

const WIDTH = 10;
const HEIGHT = 20;

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
const SCORE_VALUES = [0, 100, 300, 500, 800];

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

const rotateShape = (shape: number[][]) =>
  shape[0].map((_, column) => shape.map((row) => row[column]).reverse());

const collides = (
  board: Board,
  piece: Piece,
  shape = piece.shape,
  x = piece.x,
  y = piece.y,
) => {
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
      const y = piece.y + rowIndex;
      const x = piece.x + columnIndex;
      if (filled && y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH) {
        next[y][x] = piece.type;
      }
    });
  });

  return next;
};

const clearLines = (board: Board) => {
  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = HEIGHT - remaining.length;
  const emptyRows = Array.from(
    { length: cleared },
    () => Array<Cell>(WIDTH).fill(null),
  );
  return { board: [...emptyRows, ...remaining], cleared };
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

  const lockPiece = useCallback((pieceToLock: Piece) => {
    setBoard((currentBoard) => {
      const merged = mergePiece(currentBoard, pieceToLock);
      const result = clearLines(merged);
      const nextPiece = createPiece();

      setLines((current) => current + result.cleared);
      setScore((current) => current + (SCORE_VALUES[result.cleared] ?? 0));
      setGameOver(collides(result.board, nextPiece));
      if (!collides(result.board, nextPiece)) setPiece(nextPiece);

      return result.board;
    });
  }, []);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (gameOver) return false;

      if (!collides(board, piece, piece.shape, piece.x + dx, piece.y + dy)) {
        setPiece((current) => ({
          ...current,
          x: current.x + dx,
          y: current.y + dy,
        }));
        return true;
      }

      if (dy > 0) lockPiece(piece);
      return false;
    },
    [board, gameOver, lockPiece, piece],
  );

  const hardDrop = useCallback(() => {
    if (gameOver) return;

    let finalY = piece.y;
    while (!collides(board, piece, piece.shape, piece.x, finalY + 1)) {
      finalY += 1;
    }
    lockPiece({ ...piece, y: finalY });
  }, [board, gameOver, lockPiece, piece]);

  const rotatePiece = useCallback(() => {
    if (gameOver) return;
    const rotated = rotateShape(piece.shape);

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
  }, [board, gameOver, piece]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") move(-1, 0);
      else if (event.key === "ArrowRight") move(1, 0);
      else if (event.key === "ArrowDown") move(0, 1);
      else if (event.key === "ArrowUp") rotatePiece();
      else if (event.key === " ") hardDrop();
      else if (event.key.toLowerCase() === "r") reset();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hardDrop, move, reset, rotatePiece]);

  useEffect(() => {
    if (gameOver) return;
    const speed = Math.max(100, 650 - Math.floor(lines / 10) * 70);
    const timer = window.setInterval(() => move(0, 1), speed);
    return () => window.clearInterval(timer);
  }, [gameOver, lines, move]);

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
    <main className="terminal tetris-page">
      <div className="scanlines" aria-hidden="true" />
      <section className="tetris-window" aria-label="Tetris">
        <header className="tetris-title">
          <span>tetris</span>
          <span>guest terminal</span>
        </header>

        <div className="tetris-body">
          <div
            className="tetris-board"
            style={{ gridTemplateColumns: `repeat(${WIDTH}, 22px)` }}
            aria-label="Tetris board"
          >
            {displayBoard.flatMap((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`tetris-cell${cell ? " tetris-cell-filled" : ""}`}
                />
              )),
            )}
          </div>

          <aside className="tetris-info">
            <div className="tetris-stat">score: {score}</div>
            <div className="tetris-stat">lines: {lines}</div>
            <div className="tetris-controls">
              <div>← → move</div>
              <div>↑ rotate</div>
              <div>↓ drop</div>
              <div>space hard drop</div>
              <div>r restart</div>
            </div>
            {gameOver && <div className="tetris-game-over">game over</div>}
            <div className="tetris-actions">
              <button className="terminal-button" type="button" onClick={reset}>
                restart
              </button>
              <button
                className="terminal-button"
                type="button"
                onClick={() => router.push("/")}
              >
                back
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
