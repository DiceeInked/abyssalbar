import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, updatePlayer, ATTACK_DURATION, ATTACK_COOLDOWN } from "../scripts/physics.js";
import {
  COMBAT,
  createPracticeCreatures,
  createPracticeOres,
  getAttackHitbox,
  resolveAttackHits
} from "../scripts/combat.js";

const step = 1 / 60;

test("an attack press starts a timed sword swing", () => {
  const player = createPlayer();
  updatePlayer(player, { move: 0, jumpHeld: false, attackPressed: true }, step);
  assert.ok(player.attackTime > 0);
  assert.ok(player.attackTime <= ATTACK_DURATION);
  assert.ok(player.attackCooldown > 0);
});

test("the attack cooldown prevents a second swing from restarting early", () => {
  const player = createPlayer();
  updatePlayer(player, { move: 0, jumpHeld: false, attackPressed: true }, step);
  const firstTime = player.attackTime;
  updatePlayer(player, { move: 0, jumpHeld: false, attackPressed: true }, step);
  assert.ok(player.attackTime < firstTime);
  assert.ok(player.attackCooldown > 0);
  assert.ok(ATTACK_COOLDOWN > 0);
});

test("the sword hitbox only exists during an active swing", () => {
  const player = createPlayer();
  assert.equal(getAttackHitbox(player), null);
  player.attackTime = ATTACK_DURATION / 2;
  assert.ok(getAttackHitbox(player));
});

test("hitting a creature in midair pauses falling for two seconds", () => {
  const player = createPlayer();
  const creatures = createPracticeCreatures();
  player.x = 280;
  player.y = 142;
  player.grounded = false;
  player.vy = 160;
  player.attackTime = ATTACK_DURATION / 2;

  assert.equal(resolveAttackHits(player, creatures, [], []), "creature");
  assert.equal(creatures[0].health, 2);
  assert.equal(player.vy, 0);
  assert.equal(player.airHoldTimer, COMBAT.creatureAirHold);

  const heldY = player.y;
  for (let i = 0; i < 60; i += 1) {
    updatePlayer(player, { move: 0, jumpHeld: false, attackPressed: false }, step);
  }
  assert.equal(player.y, heldY);
  assert.ok(player.airHoldTimer > 0.9 && player.airHoldTimer < 1.1);
});

test("one swing cannot damage the same creature more than once", () => {
  const player = createPlayer();
  const creatures = createPracticeCreatures();
  player.x = 280;
  player.y = 142;
  player.grounded = false;
  player.attackTime = ATTACK_DURATION / 2;

  assert.equal(resolveAttackHits(player, creatures, [], []), "creature");
  player.attackTime = ATTACK_DURATION / 3;
  assert.equal(resolveAttackHits(player, creatures, [], []), null);
  assert.equal(creatures[0].health, 2);
});

test("hitting the floor rebounds the player upward", () => {
  const player = createPlayer();
  player.attackTime = ATTACK_DURATION * 0.05;

  assert.equal(resolveAttackHits(player, [], [], [
    { x: 0, y: 180, width: 500, height: 40, kind: "floor" }
  ]), "surface");
  assert.equal(player.grounded, false);
  assert.equal(player.vy, -COMBAT.surfaceBounceVelocity);
  assert.equal(player.lastHitType, "SURFACE");
});

test("hitting a wall also gives an upward boost", () => {
  const player = createPlayer();
  player.x = 100;
  player.y = 142;
  player.facing = 1;
  player.attackTime = ATTACK_DURATION / 2;

  assert.equal(resolveAttackHits(player, [], [], [
    { x: 170, y: 90, width: 30, height: 130, kind: "wall" }
  ]), "surface");
  assert.equal(player.vy, -COMBAT.surfaceBounceVelocity);
});

test("the high part of the swing can hit the ceiling and trigger an upward boost", () => {
  const player = createPlayer();
  player.y = -502;
  player.grounded = false;
  player.attackTime = ATTACK_DURATION * 0.95;

  assert.equal(resolveAttackHits(player, [], [], [
    { x: 0, y: -580, width: 500, height: 40, kind: "ceiling" }
  ]), "surface");
  assert.equal(player.vy, -COMBAT.surfaceBounceVelocity);
});

test("a single swing triggers at most one surface rebound", () => {
  const player = createPlayer();
  player.attackTime = ATTACK_DURATION * 0.05;
  const floor = [{ x: 0, y: 180, width: 500, height: 40, kind: "floor" }];

  assert.equal(resolveAttackHits(player, [], [], floor), "surface");
  player.vy = -200;
  assert.equal(resolveAttackHits(player, [], [], floor), null);
  assert.equal(player.vy, -200);
});

test("a sword hit damages a nearby ore deposit", () => {
  const player = createPlayer();
  const ores = createPracticeOres();
  player.x = 535;
  player.y = 142;
  player.attackTime = ATTACK_DURATION / 2;

  assert.equal(resolveAttackHits(player, [], ores, []), "ore");
  assert.equal(ores[0].health, 2);
  assert.equal(player.ink, 0);
});

test("mining an ore deposit completely awards its raw ink", () => {
  const player = createPlayer();
  const ore = createPracticeOres()[0];
  player.x = 535;
  player.y = 142;

  for (let hit = 0; hit < 3; hit += 1) {
    player.attackTime = ATTACK_DURATION / 2;
    player.attackHits = new Set();
    player.attackCreatureHit = false;
    player.attackOreHit = false;
    player.attackSurfaceHit = false;
    assert.equal(resolveAttackHits(player, [], [ore], []), "ore");
  }

  assert.equal(ore.alive, false);
  assert.equal(player.ink, COMBAT.inkPerOre);
});

test("mining a node prevents the same swing from also rebounding off a surface", () => {
  const player = createPlayer();
  const ore = createPracticeOres()[0];
  player.x = 535;
  player.y = 142;
  player.attackTime = ATTACK_DURATION / 2;
  const floor = [{ x: 0, y: 180, width: 1000, height: 40, kind: "floor" }];

  assert.equal(resolveAttackHits(player, [], [ore], floor), "ore");
  assert.equal(player.vy, 0);
});