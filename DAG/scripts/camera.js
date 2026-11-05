import { WORLD } from "./world.js";

export function createCamera(player) {
  return { x: player.x, y: player.y, initialized: false };
}

export function getCameraScale(width, height) {
  return Math.min((width - 24) / 820, (height - 24) / 520);
}

function clampCameraAxis(target, viewSize, min, max) {
  const halfView = viewSize / 2;
  if (viewSize >= max - min) return (min + max) / 2;
  return Math.max(min + halfView, Math.min(max - halfView, target));
}

export function updateCamera(camera, player, width, height, delta) {
  if (width <= 0 || height <= 0) return camera;

  const scale = getCameraScale(width, height);
  const viewWidth = width / scale;
  const viewHeight = height / scale;
  const targetX = clampCameraAxis(player.x, viewWidth, WORLD.left, WORLD.right);
  const targetY = clampCameraAxis(player.y, viewHeight, WORLD.top, WORLD.bottom);

  if (!camera.initialized) {
    camera.x = targetX;
    camera.y = targetY;
    camera.initialized = true;
    return camera;
  }

  const smoothing = 1 - Math.exp(-9 * Math.max(0, delta));
  camera.x += (targetX - camera.x) * smoothing;
  camera.y += (targetY - camera.y) * smoothing;
  return camera;
}