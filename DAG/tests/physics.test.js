import test from "node:test";
import assert from "node:assert/strict";
import {
  applyHitImpulse,
  createPlayer,
  MOVEMENT,
  PLAYER_SIZE,
  updatePlayer
} from "../scripts/physics.js";
import { SOLIDS, WORLD } from "../scripts/world.js";

const step = 1 / 60;

function simulate(player, input, frames) {
  for (let i = 0; i < frames; i += 1) updatePlayer(player, input, step);
}

function solid(kind) {
  return SOLIDS.find(item => item.kind === kind);
}

test("the previous jump and gravity values are restored", () => {
  assert.equal(MOVEMENT.gravity, 1350);
  assert.equal(MOVEMENT.jumpVelocity, 820);
  assert.equal(MOVEMENT.speed, 285);
});

test("the player starts on the cave floor", () => {
  const player = createPlayer();
  assert.equal(player.y + PLAYER_SIZE.height / 2, solid("floor").y);
  assert.equal(player.grounded, true);
});

test("the player lands on the floor and stays inside the world", () => {
  const player = createPlayer();
  player.y -= 80;
  player.grounded = false;
  player.vy = 0;
  simulate(player, { move: 0, jumpHeld: false }, 120);
  assert.equal(player.grounded, true);
  assert.equal(player.y + PLAYER_SIZE.height / 2, solid("floor").y);
  assert.equal(player.vy, 0);
  assert.ok(player.x >= WORLD.left && player.x <= WORLD.right);
});

test("left and right world walls stop horizontal movement", () => {
  const player = createPlayer();
  player.x = 22;
  player.vx = -MOVEMENT.speed;
  updatePlayer(player, { move: -1, jumpHeld: false }, step);
  assert.equal(player.contacts.left, true);
  assert.equal(player.x, 21);
  player.x = WORLD.right - 22;
  player.vx = MOVEMENT.speed;
  updatePlayer(player, { move: 1, jumpHeld: false }, step);
  assert.equal(player.contacts.right, true);
  assert.equal(player.x, WORLD.right - 21);
});

test("the ceiling stops upward movement", () => {
  const player = createPlayer();
  const ceiling = solid("ceiling");
  player.y = ceiling.y + ceiling.height + PLAYER_SIZE.height / 2 + 1;
  player.vy = -MOVEMENT.jumpVelocity;
  player.grounded = false;
  updatePlayer(player, { move: 0, jumpHeld: false }, step);
  assert.equal(player.contacts.ceiling, true);
  assert.equal(player.y, ceiling.y + ceiling.height + PLAYER_SIZE.height / 2);
  assert.equal(player.vy, 0);
});

test("the restored jump has its previous taller arc", () => {
  const player = createPlayer();
  const startY = player.y;
  let highestY = player.y;
  updatePlayer(player, { move: 0, jumpHeld: true }, step);
  for (let i = 0; i < 120 && !player.grounded; i += 1) {
    updatePlayer(player, { move: 0, jumpHeld: false }, step);
    highestY = Math.min(highestY, player.y);
  }
  const jumpHeight = startY - highestY;
  assert.ok(jumpHeight > 230 && jumpHeight < 260, "unexpected jump height: " + jumpHeight);
});

test("the player can land on a raised ledge", () => {
  const player = createPlayer();
  const ledge = SOLIDS.find(item => item.kind === "ledge");
  player.x = ledge.x + ledge.width / 2;
  player.y = ledge.y - PLAYER_SIZE.height / 2 - 70;
  player.grounded = false;
  player.vy = 160;
  simulate(player, { move: 0, jumpHeld: false }, 60);
  assert.equal(player.grounded, true);
  assert.equal(player.y + PLAYER_SIZE.height / 2, ledge.y);
});

test("walking off a ledge starts a fall", () => {
  const player = createPlayer();
  const ledge = SOLIDS.find(item => item.kind === "ledge");
  player.x = ledge.x + ledge.width + PLAYER_SIZE.width / 2 - 1;
  player.y = ledge.y - PLAYER_SIZE.height / 2;
  player.grounded = true;
  player.vx = MOVEMENT.speed;
  updatePlayer(player, { move: 1, jumpHeld: false }, step);
  assert.equal(player.grounded, false);
  updatePlayer(player, { move: 0, jumpHeld: false }, step);
  assert.ok(player.vy > 0);
});

test("holding jump starts another jump immediately after landing", () => {
  const player = createPlayer();
  simulate(player, { move: 0, jumpHeld: true }, 240);
  assert.ok(player.jumpCount >= 2);
});

test("releasing jump prevents another automatic jump after landing", () => {
  const player = createPlayer();
  player.y -= 100;
  player.grounded = false;
  player.vy = 0;
  simulate(player, { move: 0, jumpHeld: false }, 120);
  assert.equal(player.grounded, true);
  assert.equal(player.jumpCount, 0);
});

test("air control can change horizontal movement while airborne", () => {
  const player = createPlayer();
  player.grounded = false;
  player.y -= 40;
  simulate(player, { move: 1, jumpHeld: false }, 10);
  assert.ok(player.vx > 0);
  assert.ok(player.x > 0);
});

test("repeated airborne hit impulses add upward velocity", () => {
  const player = createPlayer();
  player.grounded = false;
  player.vy = 120;
  applyHitImpulse(player, 80);
  assert.equal(player.vy, 40);
  applyHitImpulse(player, 80);
  assert.equal(player.vy, -40);
});

test("an upward hit impulse cancels an active midair hold", () => {
  const player = createPlayer();
  player.grounded = false;
  player.airHoldTimer = 1.5;
  player.vy = 120;

  applyHitImpulse(player, 80);

  assert.equal(player.airHoldTimer, 0);
  assert.equal(player.vy, 40);
});

test("a surface bounce overrides an active midair hold", async () => {
  const { applySurfaceBounce } = await import("../scripts/physics.js");
  const player = createPlayer();
  player.grounded = false;
  player.airHoldTimer = 1.5;

  applySurfaceBounce(player);

  assert.equal(player.airHoldTimer, 0);
  assert.equal(player.vy, -MOVEMENT.jumpVelocity);
  const startY = player.y;
  updatePlayer(player, { move: 0, jumpHeld: false }, step);
  assert.ok(player.y < startY);
});
