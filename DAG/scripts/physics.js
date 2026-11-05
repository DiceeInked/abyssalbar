import { PLAYER_START, SOLIDS } from "./world.js";

export const PLAYER_SIZE = Object.freeze({
  width: 42,
  height: 76
});

export const MOVEMENT = Object.freeze({
  speed: 285,
  groundAcceleration: 1900,
  airAcceleration: 1150,
  groundFriction: 2200,
  gravity: 2100,
  jumpVelocity: 680,
  hitImpulse: 190
});

const halfWidth = PLAYER_SIZE.width / 2;
const halfHeight = PLAYER_SIZE.height / 2;

export function createPlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    animationTime: 0,
    jumpCount: 0,
    contacts: {
      floor: true,
      ceiling: false,
      left: false,
      right: false
    }
  };
}

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function overlaps(minA, maxA, minB, maxB) {
  return maxA > minB && minA < maxB;
}

function resolveHorizontal(player, previousX) {
  for (const solid of SOLIDS) {
    const overlapsY = overlaps(
      player.y - halfHeight,
      player.y + halfHeight,
      solid.y,
      solid.y + solid.height
    );
    const overlapsX = overlaps(
      player.x - halfWidth,
      player.x + halfWidth,
      solid.x,
      solid.x + solid.width
    );

    if (!overlapsX || !overlapsY) continue;

    if (player.vx > 0 || (player.vx === 0 && player.x > previousX)) {
      player.x = solid.x - halfWidth;
      player.contacts.right = true;
    } else {
      player.x = solid.x + solid.width + halfWidth;
      player.contacts.left = true;
    }
    player.vx = 0;
  }
}

function resolveVertical(player, previousY) {
  for (const solid of SOLIDS) {
    const overlapsX = overlaps(
      player.x - halfWidth,
      player.x + halfWidth,
      solid.x,
      solid.x + solid.width
    );
    const overlapsY = overlaps(
      player.y - halfHeight,
      player.y + halfHeight,
      solid.y,
      solid.y + solid.height
    );

    if (!overlapsX || !overlapsY) continue;

    if (player.vy >= 0 && previousY + halfHeight <= solid.y + 1) {
      player.y = solid.y - halfHeight;
      player.vy = 0;
      player.grounded = true;
      player.contacts.floor = true;
    } else if (player.vy < 0 && previousY - halfHeight >= solid.y + solid.height - 1) {
      player.y = solid.y + solid.height + halfHeight;
      player.vy = 0;
      player.contacts.ceiling = true;
    }
  }
}

export function updatePlayer(player, input, delta) {
  const dt = Math.max(0, Math.min(delta, 0.05));
  if (dt === 0) return player;

  const direction = Math.max(-1, Math.min(1, input.move || 0));
  const wasGrounded = player.grounded;
  const acceleration = wasGrounded
    ? MOVEMENT.groundAcceleration
    : MOVEMENT.airAcceleration;

  if (direction !== 0) {
    player.vx = approach(player.vx, direction * MOVEMENT.speed, acceleration * dt);
    player.facing = direction;
  } else if (wasGrounded) {
    player.vx = approach(player.vx, 0, MOVEMENT.groundFriction * dt);
  }

  const previousX = player.x;
  player.x += player.vx * dt;
  player.contacts.left = false;
  player.contacts.right = false;
  resolveHorizontal(player, previousX);

  player.contacts.floor = false;
  player.contacts.ceiling = false;

  const support = SOLIDS.find(solid =>
    Math.abs(player.y + halfHeight - solid.y) < 1
    && overlaps(
      player.x - halfWidth,
      player.x + halfWidth,
      solid.x,
      solid.x + solid.width
    )
  );

  if (wasGrounded && input.jumpHeld) {
    player.grounded = false;
    player.vy = -MOVEMENT.jumpVelocity;
    player.jumpCount += 1;
  } else if (wasGrounded && support) {
    player.y = support.y - halfHeight;
    player.vy = 0;
    player.grounded = true;
    player.contacts.floor = true;
  } else {
    player.grounded = false;
    player.vy += MOVEMENT.gravity * dt;
    const previousY = player.y;
    player.y += player.vy * dt;
    resolveVertical(player, previousY);
  }

  player.animationTime += dt;
  return player;
}

// Mining and combat can call this when a valid airborne hit lands.
export function applyHitImpulse(player, strength = MOVEMENT.hitImpulse) {
  const impulse = Math.max(0, Number(strength) || 0);
  if (impulse === 0 || player.grounded) return player.vy;

  player.vy -= impulse;
  player.grounded = false;
  player.contacts.floor = false;
  return player.vy;
}