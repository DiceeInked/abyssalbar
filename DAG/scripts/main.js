import { createPlayer, updatePlayer } from "./physics.js";
import { InputController } from "./input.js";
import { renderGame } from "./renderer.js";
import { createCamera, updateCamera } from "./camera.js";
import { createPracticeCreatures, createPracticeOres, resolveAttackHits } from "./combat.js";

const canvas = document.querySelector("#game");
const movementState = document.querySelector("#movement-state");
const collisionState = document.querySelector("#collision-state");
const inkState = document.querySelector("#ink-state");

let player = createPlayer();
let camera = createCamera(player);
const input = new InputController();
let creatures = createPracticeCreatures();
let ores = createPracticeOres();
const fixedStep = 1 / 60;

let previousTime = 0;
let accumulator = 0;

function resetTest() {
  input.clear();
  player = createPlayer();
  camera = createCamera(player);
  creatures = createPracticeCreatures();
  ores = createPracticeOres();
}

function updateReadout() {
  const contacts = player.contacts;
  const states = [];
  if (contacts.floor) states.push("FLOOR");
  if (contacts.ceiling) states.push("CEILING");
  if (contacts.left) states.push("LEFT WALL");
  if (contacts.right) states.push("RIGHT WALL");
  if (player.airHoldTimer > 0) states.push("HOLD " + player.airHoldTimer.toFixed(1) + "s");
  if (player.hitFeedbackTime > 0 && player.lastHitType) states.push(player.lastHitType + " HIT");

  const active = creatures.find(creature => creature.alive);
  const targetStatus = active
    ? "TARGET " + active.health + "/" + active.maxHealth
    : "TARGET DOWN";

  movementState.textContent = player.attackTime > 0
    ? "ATTACKING"
    : player.airHoldTimer > 0
      ? "MID-AIR HOLD"
      : player.grounded ? "ON GROUND" : "AIRBORNE";
  collisionState.textContent = states.length
    ? states.join(" · ") + " · " + targetStatus
    : "A99 · " + targetStatus;
  inkState.textContent = "RAW INK " + player.ink;
}

function frame(time) {
  if (!previousTime) previousTime = time;
  const elapsed = Math.min((time - previousTime) / 1000, 0.1);
  previousTime = time;
  accumulator += elapsed;

  while (accumulator >= fixedStep) {
    const snapshot = input.snapshot();
    if (snapshot.resetPressed) {
      resetTest();
      accumulator = 0;
      break;
    }
    updatePlayer(player, snapshot, fixedStep);
    resolveAttackHits(player, creatures, ores);
    for (const creature of creatures) {
      creature.flashTime = Math.max(0, creature.flashTime - fixedStep);
    }
    for (const ore of ores) {
      ore.flashTime = Math.max(0, ore.flashTime - fixedStep);
    }
    accumulator -= fixedStep;
  }

  updateCamera(camera, player, canvas.clientWidth, canvas.clientHeight, elapsed);
  renderGame(canvas, player, camera, creatures, ores);
  updateReadout();
  requestAnimationFrame(frame);
}

window.addEventListener("pagehide", () => input.destroy(), { once: true });
requestAnimationFrame(frame);