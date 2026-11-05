import { createPlayer, updatePlayer } from "./physics.js";
import { InputController } from "./input.js";
import { renderGame } from "./renderer.js";
import { createCamera, updateCamera } from "./camera.js";

const canvas = document.querySelector("#game");
const movementState = document.querySelector("#movement-state");
const collisionState = document.querySelector("#collision-state");

const player = createPlayer();
const camera = createCamera(player);
const input = new InputController();
const fixedStep = 1 / 60;

let previousTime = 0;
let accumulator = 0;

function updateReadout() {
  const contacts = player.contacts;
  const states = [];
  if (contacts.floor) states.push("FLOOR");
  if (contacts.ceiling) states.push("CEILING");
  if (contacts.left) states.push("LEFT WALL");
  if (contacts.right) states.push("RIGHT WALL");

  movementState.textContent = player.grounded ? "ON GROUND" : "AIRBORNE";
  collisionState.textContent = states.length ? states.join(" · ") : "A99 · CAVE TEST";
}

function frame(time) {
  if (!previousTime) previousTime = time;
  const elapsed = Math.min((time - previousTime) / 1000, 0.1);
  previousTime = time;
  accumulator += elapsed;

  while (accumulator >= fixedStep) {
    updatePlayer(player, input.snapshot(), fixedStep);
    accumulator -= fixedStep;
  }

  updateCamera(camera, player, canvas.clientWidth, canvas.clientHeight, elapsed);
  renderGame(canvas, player, camera);
  updateReadout();
  requestAnimationFrame(frame);
}

window.addEventListener("pagehide", () => input.destroy(), { once: true });
requestAnimationFrame(frame);