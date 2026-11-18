import { ATTACK_DURATION, MOVEMENT, applySurfaceBounce } from "./physics.js";
import { SOLIDS } from "./world.js";

export const COMBAT = Object.freeze({
  creatureAirHold: 2,
  surfaceBounceVelocity: MOVEMENT.jumpVelocity,
  oreHitsToMine: 3,
  inkPerOre: 5
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

export function createPracticeOres() {
  return [620, 1510, 2470].map((x, index) => ({
    id: "ore-" + (index + 1),
    x,
    y: 162,
    radius: 17,
    health: COMBAT.oreHitsToMine,
    maxHealth: COMBAT.oreHitsToMine,
    inkValue: COMBAT.inkPerOre,
    alive: true,
    flashTime: 0
  }));
}

export function getAttackHitbox(player) {
  if (player.attackTime <= 0) return null;

  const progress = Math.max(0, Math.min(1, 1 - player.attackTime / ATTACK_DURATION));
  const reach = 20 + progress * 50;
  const top = player.y - 54 + progress * 40;

  return {
    x: player.x + player.facing * reach - 42,
    y: top,
    width: 84,
    height: 68
  };
}

export function resolveAttackHits(player, creatures, ores = [], solids = SOLIDS) {
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

  for (const ore of ores) {
    if (!ore.alive || player.attackHits.has(ore.id)) continue;

    const oreBox = {
      x: ore.x - ore.radius,
      y: ore.y - ore.radius,
      width: ore.radius * 2,
      height: ore.radius * 2
    };

    if (!intersects(hitbox, oreBox)) continue;

    player.attackHits.add(ore.id);
    player.attackOreHit = true;
    ore.health = Math.max(0, ore.health - 1);
    ore.flashTime = 0.16;
    player.lastHitType = "ORE";
    player.hitFeedbackTime = 0.5;

    if (ore.health === 0) {
      ore.alive = false;
      player.ink += ore.inkValue;
    }

    return "ore";
  }

  if (!player.attackCreatureHit && !player.attackOreHit && !player.attackSurfaceHit) {
    const surface = solids.find(solid => intersects(hitbox, solid));
    if (surface) {
      player.attackSurfaceHit = true;
      applySurfaceBounce(player, COMBAT.surfaceBounceVelocity);
      return "surface";
    }
  }

  return null;
}