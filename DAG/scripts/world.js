export const WORLD = Object.freeze({
  left: 0,
  right: 3600,
  top: -540,
  bottom: 220
});

export const PLAYER_START = Object.freeze({
  x: 160,
  y: 180 - 38
});

// These simple ledges are movement-test geometry, not the final cave layout.
export const SOLIDS = Object.freeze([
  { x: 0, y: 180, width: 3600, height: 40, kind: "floor" },
  { x: 0, y: -580, width: 3600, height: 40, kind: "ceiling" },
  { x: -40, y: -540, width: 40, height: 760, kind: "wall" },
  { x: 3600, y: -540, width: 40, height: 760, kind: "wall" },
  { x: 500, y: 112, width: 190, height: 20, kind: "ledge" },
  { x: 980, y: 38, width: 210, height: 20, kind: "ledge" },
  { x: 1510, y: 112, width: 240, height: 20, kind: "ledge" },
  { x: 2110, y: 48, width: 220, height: 20, kind: "ledge" },
  { x: 2750, y: 112, width: 250, height: 20, kind: "ledge" }
]);