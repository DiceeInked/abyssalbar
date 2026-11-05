import { floodFillPixels, hexToRgba } from "./paint.js";

const canvas = document.querySelector("#drawing-board");
const ctx = canvas?.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#board-status");
const undoButton = document.querySelector("#undo-button");
const redoButton = document.querySelector("#redo-button");
const saveButton = document.querySelector("#save-button");
const clearButton = document.querySelector("#clear-button");
const exportButton = document.querySelector("#export-button");

const saveKey = "dag-drawing-board-v1";
const historyLimit = 40;
let activeTool = "brush";
let activeColor = "#929ba1";
let drawingPointer = null;
let previousPoint = null;
let strokeBefore = null;
let history = [];
let historyIndex = -1;

if (!canvas || !ctx || !status) {
  throw new Error("The drawing board could not be initialized.");
}

function setStatus(message) {
  status.textContent = message;
}

function readBoard() {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function samePixels(a, b) {
  if (a.data.length !== b.data.length) return false;
  for (let i = 0; i < a.data.length; i += 1) {
    if (a.data[i] !== b.data[i]) return false;
  }
  return true;
}

function refreshHistoryButtons() {
  undoButton.disabled = historyIndex <= 0;
  redoButton.disabled = historyIndex >= history.length - 1;
}

function recordHistory(before) {
  const after = readBoard();
  if (samePixels(before, after)) {
    refreshHistoryButtons();
    return;
  }

  history = history.slice(0, historyIndex + 1);
  history.push(after);
  if (history.length > historyLimit) history.shift();
  historyIndex = history.length - 1;
  refreshHistoryButtons();
}

function restoreHistory(index) {
  if (index < 0 || index >= history.length || index === historyIndex) return;
  historyIndex = index;
  ctx.putImageData(history[historyIndex], 0, 0);
  refreshHistoryButtons();
}

function initializeBoard() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.width === canvas.width
          && parsed.height === canvas.height
          && Array.isArray(parsed.pixels)
          && parsed.pixels.length === canvas.width * canvas.height * 4) {
        const image = ctx.createImageData(canvas.width, canvas.height);
        image.data.set(parsed.pixels);
        ctx.putImageData(image, 0, 0);
        setStatus("Loaded the board saved in this browser.");
      }
    }
  } catch {
    setStatus("Browser storage is unavailable. The board still works until this page closes.");
  }

  history = [readBoard()];
  historyIndex = 0;
  refreshHistoryButtons();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width))),
    y: Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)))
  };
}

function drawSegment(from, to) {
  const color = activeTool === "eraser" ? "#ffffff" : activeColor;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = activeTool === "eraser" ? 7 : 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x + 0.5, from.y + 0.5);
  ctx.lineTo(to.x + 0.5, to.y + 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(to.x + 0.5, to.y + 0.5, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyRecolor(point) {
  const before = readBoard();
  const image = readBoard();
  const changed = floodFillPixels(
    image.data,
    canvas.width,
    canvas.height,
    point.x,
    point.y,
    hexToRgba(activeColor)
  );

  if (changed === 0) {
    setStatus("No gray region there to recolor. White is the canvas background.");
    return;
  }

  ctx.putImageData(image, 0, 0);
  recordHistory(before);
  setStatus("Recolored " + changed.toLocaleString() + " connected pixels.");
}

function chooseTool(tool) {
  activeTool = tool;
  for (const button of document.querySelectorAll("[data-tool]")) {
    const selected = button.dataset.tool === tool;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }

  const messages = {
    brush: "Brush selected. Draw with a grayscale shade or an ink color.",
    recolor: "Ink fill selected. Tap a connected gray region to recolor it.",
    eraser: "Eraser selected. Draw over pixels to return them to white."
  };
  setStatus(messages[tool] || "Tool selected.");
}

for (const button of document.querySelectorAll("[data-tool]")) {
  button.addEventListener("click", () => chooseTool(button.dataset.tool));
}

for (const button of document.querySelectorAll("[data-color]")) {
  button.addEventListener("click", () => {
    activeColor = button.dataset.color;
    for (const swatch of document.querySelectorAll("[data-color]")) {
      const selected = swatch === button;
      swatch.classList.toggle("is-selected", selected);
      swatch.setAttribute("aria-pressed", String(selected));
    }
    setStatus("Selected color " + activeColor.toUpperCase() + ".");
  });
}

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  const point = canvasPoint(event);

  if (activeTool === "recolor") {
    applyRecolor(point);
    return;
  }

  drawingPointer = event.pointerId;
  previousPoint = point;
  strokeBefore = readBoard();
  canvas.setPointerCapture?.(event.pointerId);
  drawSegment(point, point);
});

canvas.addEventListener("pointermove", event => {
  if (drawingPointer !== event.pointerId || !previousPoint) return;
  event.preventDefault();
  const point = canvasPoint(event);
  drawSegment(previousPoint, point);
  previousPoint = point;
});

function finishStroke(event) {
  if (drawingPointer !== event.pointerId) return;
  if (strokeBefore) recordHistory(strokeBefore);
  drawingPointer = null;
  previousPoint = null;
  strokeBefore = null;
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
canvas.addEventListener("lostpointercapture", finishStroke);
canvas.addEventListener("contextmenu", event => event.preventDefault());

undoButton.addEventListener("click", () => restoreHistory(historyIndex - 1));
redoButton.addEventListener("click", () => restoreHistory(historyIndex + 1));

clearButton.addEventListener("click", () => {
  const before = readBoard();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  recordHistory(before);
  setStatus("Canvas cleared.");
});

saveButton.addEventListener("click", () => {
  try {
    const image = readBoard();
    localStorage.setItem(saveKey, JSON.stringify({
      width: canvas.width,
      height: canvas.height,
      pixels: Array.from(image.data)
    }));
    setStatus("Saved on this browser. This is local prototype storage, not a game account.");
  } catch {
    setStatus("Could not save in this browser. You can still export a PNG.");
  }
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * 8;
  exportCanvas.height = canvas.height * 8;
  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) {
    setStatus("PNG export is unavailable in this browser.");
    return;
  }

  exportContext.imageSmoothingEnabled = false;
  exportContext.fillStyle = "#ffffff";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

  const link = document.createElement("a");
  link.download = "dag-drawing.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
  setStatus("Exported an 8× PNG.");
});

initializeBoard();