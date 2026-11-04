export const ROOM = Object.freeze({
  left: -560,
  right: 560,
  top: -150,
  bottom: 150
});

export const PLAYER_SIZE = Object.freeze({
  width: 42,
  height: 76
});

export const MOVEMENT = Object.freeze({
  speed: 285,
  groundAcceleration: 1900,
  airAcceleration: 1150,
  groundFriction: 2200,
  gravity: 1350,
  jumpVelocity: 820,
  hitImpulse: 190
});

const halfWidth = PLAYER_SIZE.width / 2;
const halfHeight = PLAYER_SIZE.height / 2;

export function createPlayer() {
  return {
    x: 0,
    y: ROOM.bottom - halfHeight,
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

export function updatePlayer(player, input, delta) {
  const dt = Math.max(0, Math.min(delta, 0.05));
  if (dt === 0) return player;

  const direction = Math.max(-1, Math.min(1, input.move || 0));
  const acceleration = player.grounded
    ? MOVEMENT.groundAcceleration
    : MOVEMENT.airAcceleration;

  if (direction !== 0) {
    player.vx = approach(player.vx, direction * MOVEMENT.speed, acceleration * dt);
    player.facing = direction;
  } else if (player.grounded) {
    player.vx = approach(player.vx, 0, MOVEMENT.groundFriction * dt);
  }

  player.x += player.vx * dt;
  player.contacts.left = false;
  player.contacts.right = false;

  const minX = ROOM.left + halfWidth;
  const maxX = ROOM.right - halfWidth;

  if (player.x < minX) {
    player.x = minX;
    player.vx = Math.max(0, player.vx);
    player.contacts.left = true;
  } else if (player.x > maxX) {
    player.x = maxX;
    player.vx = Math.min(0, player.vx);
    player.contacts.right = true;
  }

  if (player.grounded && input.jumpHeld) {
    player.vy = -MOVEMENT.jumpVelocity;
    player.grounded = false;
    player.jumpCount += 1;
    player.contacts.floor = false;
  } else {
    player.vy += MOVEMENT.gravity * dt;
  }

  player.y += player.vy * dt;
  player.contacts.floor = false;
  player.contacts.ceiling = false;

  const minY = ROOM.top + halfHeight;
  const maxY = ROOM.bottom - halfHeight;

  if (player.y < minY) {
    player.y = minY;
    player.vy = Math.max(0, player.vy);
    player.contacts.ceiling = true;
  }

  if (player.y > maxY) {
    player.y = maxY;
    player.vy = 0;
    player.grounded = true;
    player.contacts.floor = true;
  } else {
    player.grounded = false;
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
