import { ATTACK_DURATION, MOVEMENT, applySurfaceBounce } from "./physics.js";
import { SOLIDS } from "./world.js";

export const COMBAT = Object.freeze({
  creatureAirHold: 2,
  surfaceBounceVelocity: MOVEMENT.jumpVelocity
});

function intersects(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function createPracticeCreatures() {
  return [{
    id: "practice-creature",
    x: 365,
    y: 158,
    width: 42,
    height: 44,
    health: 3,
    maxHealth: 3,
    alive: true,
    flashTime: 0
  }];
}

export function getAttackHitbox(player) {
  if (player.attackTime <= 0) return null;

  const progress = Math.max(0, Math.min(1, 1 - player.attackTime / ATTACK_DURATION));
  const reach = 20 + progress * 50;
  const drop = -6 + Math.sin(progress * Math.PI) * 12 + progress * 6;

  return {
    x: player.x + player.facing * reach - 42,
    y: player.y + drop - 32,
    width: 84,
    height: 64
  };
}

export function resolveAttackHits(player, creatures, solids = SOLIDS) {
  const hitbox = getAttackHitbox(player);
  if (!hitbox) return null;

  for (const creature of creatures) {
    if (!creature.alive || player.attackHits.has(creature.id)) continue;

    const creatureBox = {
      x: creature.x - creature.width / 2,
      y: creature.y - creature.height / 2,
      width: creature.width,
      height: creature.height
    };

    if (!intersects(hitbox, creatureBox)) continue;

    player.attackHits.add(creature.id);
    player.attackCreatureHit = true;
    creature.health = Math.max(0, creature.health - 1);
    creature.alive = creature.health > 0;
    creature.flashTime = 0.16;
    player.lastHitType = "CREATURE";
    player.hitFeedbackTime = 0.5;

    if (!player.grounded) {
      player.vy = 0;
      player.airHoldTimer = COMBAT.creatureAirHold;
    }

    return "creature";
  }

  if (!player.attackCreatureHit && !player.attackSurfaceHit) {
    const surface = solids.find(solid => intersects(hitbox, solid));
    if (surface) {
      player.attackSurfaceHit = true;
      applySurfaceBounce(player, COMBAT.surfaceBounceVelocity);
      return "surface";
    }
  }

  return null;
}