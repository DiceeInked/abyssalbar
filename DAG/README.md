# DAG: HTML Phase 1 Foundation

This is the browser-based foundation for Drawing Adventure Game. It uses plain HTML, CSS, and JavaScript modules. No game engine, server, account system, or external dependency is required.

## Run it

Open `index.html` in a modern browser. Because the code uses JavaScript modules, some browsers require a local static server instead of opening the file directly. From this folder, one option is:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Phase 1 test room

The first scene is intentionally just a closed room:

- Floor
- Ceiling
- Left wall
- Right wall
- Six-piece placeholder character

There are no platforms, enemies, ores, merchants, inventory, login, or multiplayer in this movement test.

## Controls

- **A / Left Arrow:** Move left.
- **D / Right Arrow:** Move right.
- **Space / W / Up Arrow:** Jump.
- **Touchscreen:** Hold the left/right controls to move; hold JUMP to auto-jump.

Air control is enabled. Holding jump causes the player to jump again as soon as they land. It does not allow a second jump while airborne.

## Character and movement

The placeholder character is drawn from six separate pieces: head, torso, two arms, and two legs. Its visuals are separate from the movement and collision code. The arms move independently around their own centers instead of swinging from shoulder pivots.

The room uses axis-aligned collision bounds, with separate handling for the floor, ceiling, and side walls. The room is deliberately low enough for a normal jump to reach the ceiling, making ceiling collision testable.

## Future mining and combat hook

`scripts/physics.js` exports `applyHitImpulse(player, strength)`. A future ore or creature hit handler can call this when an airborne hit connects. Repeated hits add upward velocity and can counter gravity. The room does not include fake ores or enemies just to trigger that mechanic.

## Future multiplayer boundary

The foundation separates input, simulation, and rendering so a later network session can supply player/world state without rewriting the movement rules. For now, the game is single-player and local-only. Authentication, account storage, servers, parties, matchmaking, and actual online multiplayer are intentionally not implemented or simulated.

The intended playable direction after the foundation is cave exploration and mining, followed by creatures and the blade/handle/amulet weapon system. This test room is only the first movement and collision check.

## Tests

With Node.js installed, run:

```sh
npm test
```

The automated tests cover floor landing, both side walls, ceiling collision, hold-to-auto-jump, jump release, air control, and repeated upward hit impulses.
