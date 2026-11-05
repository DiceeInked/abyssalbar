# DAG: Phase 2 Cave Foundation

This is the browser-based foundation for Drawing Adventure Game. It uses plain HTML, CSS, and JavaScript modules.

## Run it

Open index.html in a modern browser. Because the code uses JavaScript modules, some browsers require a local static server instead of opening the file directly. From this folder, run:

    python -m http.server 8000

Then open http://localhost:8000.

## Current test scene

The scene is a side-view cave movement sandbox labelled A99. It is a technical test space, not the final cave layout.

- A long cave floor, ceiling, and side boundaries.
- A handful of temporary ledges for testing platform collisions.
- A six-piece block-style placeholder character.
- A camera that follows the player as they travel through the cave.
- Keyboard and multitouch controls.
- The restored original gravity and jump settings, with the previous horizontal movement speed.
- Simple blocky idle, running, rising, and falling character poses.
- Basic angular cave-rock shapes so the test scene reads as underground without becoming an art-polish task.

The rock silhouettes and test ledges are deliberately simple placeholders, not final cave art or a final map design. The cave generation method, terrain shapes, and layout rules remain open design decisions.

## Controls

- **A / Left Arrow:** Move left.
- **D / Right Arrow:** Move right.
- **Space / W / Up Arrow:** Jump.
- **Touchscreen:** Hold the left/right controls to move; hold JUMP to auto-jump.

Holding jump causes the player to jump again as soon as they land. It does not allow a second jump while airborne. Horizontal movement speed is unchanged.

## Character and movement

The placeholder character is built from six separate square-edged pieces: head, torso, two arms, and two legs. It uses deliberately simple block-style movement animation. More detailed animation work is postponed.

The physics module handles collisions against reusable solid rectangles. The camera has separate world coordinates, smooth follow, and world-edge limits.

## Intentionally not implemented yet

The first cave is designed to be quiet, with a few ores and no enemies or shopkeepers. This sandbox does not include ore objects or mining yet. Exact ore spawn rules and the mining interaction still need to be specified before they are implemented.

Procedural cave generation, final cave geometry, Stronghold behavior, cave reset rules, merchants, creatures, inventory, login, and multiplayer are not part of this phase.

## Future mining and combat hook

scripts/physics.js exports applyHitImpulse(player, strength). A future ore or creature hit handler can call this when an airborne hit connects. Repeated hits add upward velocity and can counter gravity.

## Future multiplayer boundary

The foundation separates input, simulation, world data, camera, and rendering so a later network session can supply player/world state without rewriting the movement rules. For now, the game is single-player and local-only.

## Tests

With Node.js installed, run:

    npm test

The automated tests cover world boundaries, floor and ceiling collisions, ledge landing and falling, jump height, hold-to-auto-jump, jump release, air control, repeated upward hit impulses, and camera behavior.