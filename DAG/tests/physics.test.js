import test from "node:test";
import assert from "node:assert/strict";
import {
  applyHitImpulse,
  createPlayer,
  MOVEMENT,
  PLAYER_SIZE,
  ROOM,
  updatePlayer
} from "../scripts/physics.js";

const step = 1 / 60;

function simulate(player, input, frames) {
  for (let i = 0; i < frames; i += 1) {
    updatePlayer(player, input, step);
  }
}

test("the player lands on the floor and stays inside the room", () => {
  const player = createPlayer();
  player.y -= 80;
  player.grounded = false;
  player.vy = 0;

  simulate(player, { move: 0, jumpHeld: false }, 120);

  assert.equal(player.grounded, true);
  assert.equal(player.y + PLAYER_SIZE.height / 2, ROOM.bottom);
  assert.equal(player.vy, 0);
});

test("left and right walls stop horizontal movement", () => {
  const player = createPlayer();

  player.x = ROOM.left + PLAYER_SIZE.width / 2 + 1;
  player.vx = -MOVEMENT.speed;
  updatePlayer(player, { move: -1, jumpHeld: false }, step);
  assert.equal(player.contacts.left, true);
  assert.equal(player.x, ROOM.left + PLAYER_SIZE.width / 2);

  player.x = ROOM.right - PLAYER_SIZE.width / 2 - 1;
  player.vx = MOVEMENT.speed;
  updatePlayer(player, { move: 1, jumpHeld: false }, step);
  assert.equal(player.contacts.right, true);
  assert.equal(player.x, ROOM.right - PLAYER_SIZE.width / 2);
});

test("the ceiling stops upward movement", () => {
  const player = createPlayer();
  player.y = ROOM.top + PLAYER_SIZE.height / 2 + 1;
  player.vy = -MOVEMENT.jumpVelocity;
  player.grounded = false;

  updatePlayer(player, { move: 0, jumpHeld: false }, step);

  assert.equal(player.contacts.ceiling, true);
  assert.equal(player.y, ROOM.top + PLAYER_SIZE.height / 2);
  assert.equal(player.vy, 0);
});

test("holding jump starts another jump immediately after landing", () => {
  const player = createPlayer();

  simulate(player, { move: 0, jumpHeld: true }, 240);

  assert.ok(player.jumpCount >= 2, "expected multiple jumps while the button stayed held");
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
