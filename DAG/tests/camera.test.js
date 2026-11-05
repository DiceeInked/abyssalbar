import test from "node:test";
import assert from "node:assert/strict";
import { createCamera, getCameraScale, updateCamera } from "../scripts/camera.js";
import { createPlayer } from "../scripts/physics.js";
import { WORLD } from "../scripts/world.js";

test("camera scale stays positive for a usable viewport", () => {
  assert.ok(getCameraScale(390, 700) > 0);
  assert.ok(getCameraScale(1200, 650) > 0);
});

test("camera snaps to its initial position and then follows smoothly", () => {
  const player = createPlayer();
  const camera = createCamera(player);
  player.x = 1100;
  updateCamera(camera, player, 900, 520, 1 / 30);
  assert.equal(camera.x, player.x);
  player.x = 1300;
  updateCamera(camera, player, 900, 520, 1 / 30);
  assert.ok(camera.x > 1100);
  assert.ok(camera.x < player.x);
});

test("camera stays inside the world edges", () => {
  const player = createPlayer();
  const camera = createCamera(player);
  player.x = WORLD.right;
  updateCamera(camera, player, 900, 520, 1);
  const scale = getCameraScale(900, 520);
  assert.ok(camera.x + 900 / (2 * scale) <= WORLD.right + 0.001);
});