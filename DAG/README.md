# DAG: Phase 4 Mining Prototype

This is the browser-based foundation for Drawing Adventure Game. It uses plain HTML, CSS, and JavaScript modules.

## Run it

Open index.html in a modern browser. Because the code uses JavaScript modules, some browsers require a local static server instead of opening the file directly. From this folder, run:

    python -m http.server 8000

Then open http://localhost:8000.

## Current test scene

The scene is a side-view cave movement, combat, and mining sandbox labelled A99. It is a technical test space, not the final cave layout.

- A long cave floor, ceiling, and side boundaries.
- Temporary ledges for testing platform collisions.
- A six-piece block-style placeholder character.
- A camera that follows the player through the cave.
- Keyboard and touchscreen controls.
- The restored gravity and jump settings, with the previous horizontal movement speed.
- Simple idle, running, rising, falling, and sword-swing poses.
- A temporary practice creature for testing damage and the airborne creature-hit pause.
- Three simple ore deposits for testing weapon-based mining and ink collection.
- Surface-hit rebound behavior for the floor, ceiling, walls, and temporary ledges.
- Simple cave-rock shapes without a large art-polish pass.

The practice creature and ledges are test objects. They are not part of the intended first cave, which is meant to be quiet and have no enemies or shopkeepers. The three ore deposits represent the first cave's small-ore introduction. The rock silhouettes are placeholders, not final cave art.

## Controls

- **A / Left Arrow:** Move left.
- **D / Right Arrow:** Move right.
- **Space / W / Up Arrow:** Jump. Holding jump causes another jump as soon as the player lands.
- **J / touchscreen HIT button:** Swing the weapon. The same action can damage the practice creature or mine nearby ore.
- **R / touchscreen RESET button:** Restart the cave test, respawning the practice creature and ore deposits and resetting the player and raw ink.
- **Touchscreen:** Hold the left/right controls to move; hold JUMP to auto-jump.

The shared HIT action is a temporary prototype choice because the design says weapons can mine ores. It can be separated into a dedicated mining action later if that feels better. RESET is only a testing convenience; it is not a planned in-world game feature.

## Combat prototype

The sword has a short attack animation and a cooldown. A swing can damage the temporary practice creature. When a creature is hit while the player is airborne, the player stops moving vertically for about two seconds and can continue attacking. Horizontal air movement remains available during the hold.

Attacking a solid surface during a swing triggers an upward rebound. The current prototype applies the same upward boost to floor, ceiling, wall, and temporary ledge contacts. These values and the attack hitbox are first-pass tuning choices, not final balance.

Creature damage, ore mining, and surface rebounds are separate outcomes. One swing that hits a creature or ore does not also trigger a surface rebound.

## Mining prototype

Three simple ore deposits sit along the cave floor. Each requires three successful weapon hits. Mining a deposit adds **5 raw test ink** to the HUD counter. The nodes are deliberately generic: ore color, ore types, yield values, respawn behavior, and the final ink economy have not been decided. The number shown is a prototype counter, not a final per-color inventory.

## Character and movement

The placeholder character uses six simple square-edged pieces: head, torso, two arms, and two legs. Movement animation stays deliberately blocky. More detailed art and animation work is postponed.

The physics module handles collisions against reusable solid rectangles. The camera has separate world coordinates, smooth follow, and world-edge limits.

## Not implemented yet

The first cave is designed to be quiet, with a few ores and no enemies or shopkeepers. The practice target is only for the combat sandbox. Weapon parts, secondary abilities, ink-color effects, the final ink inventory, mining upgrades, merchants, and creatures outside the practice target are not implemented.

Procedural cave generation, final cave geometry, Stronghold behavior, cave reset rules, login, and multiplayer are also outside this prototype.

## Future multiplayer boundary

The foundation separates input, simulation, world data, camera, and rendering so a later network session can supply player/world state without rewriting the movement rules. For now, the game is single-player and local-only.

## Tests

With Node.js installed, run:

    npm test

The automated tests cover world boundaries, floor and ceiling collisions, ledge landing and falling, jump height, hold-to-auto-jump, jump release, air control, hit impulses, attack timing, creature-hit suspension, surface rebounds, ore damage, raw ink collection, and camera behavior.