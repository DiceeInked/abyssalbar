# DAG Development Status

This file tracks what is actually in the browser prototype. It is separate from the full game design: a prototype feature is not automatically a final game rule.

## Working prototype

- [x] Side-view player movement with the restored gravity, jump, and horizontal speed values.
- [x] Floor, ceiling, wall, and ledge collision.
- [x] Cave-follow camera with world-edge limits.
- [x] Keyboard and touchscreen movement controls.
- [x] Simple block-piece idle, running, rising, falling, and sword-swing poses.
- [x] Dedicated attack input for the prototype: J on keyboard and HIT on touchscreen.
- [x] Optional practice creature for combat testing, hidden by default so A99 starts enemy-free.
- [x] Creature hit while airborne pauses vertical movement for about two seconds; horizontal air control remains available.
- [x] A later swing can hit the same practice creature again while the hold is still active.
- [x] Successful attacks against solid surfaces apply an upward velocity boost for floor, wall, and ceiling cases.
- [x] Three generic ore deposits can be mined with the same HIT action.
- [x] Each test deposit takes three hits and gives five units of raw test ink.
- [x] One-button test reset for the player, target, ores, and raw ink.
- [x] Separate drawing-board prototype with grayscale brush, eraser, connected-region ink recoloring, undo/redo, local save, and PNG export.
- [x] Automated flood-fill tests for isolated regions and white-space boundaries.
- [x] Automated tests and JavaScript syntax checks run in GitHub Actions.

## Drawing-board prototype limits

The drawing page uses a 96 × 96 raster canvas and stores saves only in the current browser. These are test defaults, not decisions about the final editor format, canvas dimensions, cloud persistence, tool set, region rules, or ink cost.

## Test-only content

The RESET button and R key are development conveniences for replaying this sandbox. They are not intended as a diegetic mechanic or part of the final player interface.

The practice creature is opt-in and appears only when the PRACTICE TARGET toggle is on. The default A99 scene remains quiet, with a few ores and no enemies or shopkeepers. The temporary ledges are collision-test geometry, not the finished cave layout. Ore shapes, color, hit count, and raw ink yield are placeholder values.

## Next implementation order

1. **Confirm interaction controls.** The current prototype uses one HIT action for both attacking and mining. Decide whether mining should keep that shared action or use a separate Mine action.
2. **Develop the drawing rules.** Decide whether the final editor should be raster, vector, or mixed, define how regions connect, and specify the ink-cost formula. The current drawing page is a test of one simple connected-region approach.
3. **Define the resource loop.** Decide what ore types exist, which ink colors they produce, whether the player has one raw-ink total or separate color amounts, and how deposits respawn.
4. **Build the first actual cave layout.** Replace the temporary ledges with a small hand-built test route that fits the intended quiet A99 introduction. Keep the cave visually simple.
5. **Add the first real creature outside A99.** This needs its own behavior, attacks, health, and spawn rules. Keep the practice target separate from the real creature roster.
6. **Connect weapons to their parts.** The current sword is only a simple test weapon. Blade, handle, and amulet behavior, ink costs, upgrades, and weapon eligibility for movement effects still need their own specified rules.
7. **Add the next exploration interaction.** Stronghold behavior and the exact descent destination still have open design questions, so implement those only after the unresolved rule is decided.
8. **Defer larger infrastructure.** Procedural caves, shared cave servers, multiplayer, accounts, stash persistence, and Inkoff are much later than the local movement/combat/mining prototype.

## Temporary prototype values

| Setting | Current test value | Status |
|---|---:|---|
| Horizontal speed | 285 | Restored movement setting |
| Gravity | 1350 | Restored movement setting |
| Jump velocity | 820 | Restored movement setting |
| Sword swing duration | 0.28 seconds | Temporary |
| Attack cooldown | 0.4 seconds | Temporary |
| Creature airborne hold | 2 seconds | Temporary |
| Surface rebound velocity | 820 upward | Temporary |
| Hits per ore deposit | 3 | Temporary |
| Raw test ink per deposit | 5 | Temporary |

Do not treat temporary combat or mining values as final balance.

## Verification

Run `npm test` from this folder. The GitHub Actions workflow also checks JavaScript syntax for every script and test file. Physical testing on an actual phone is still needed for the touchscreen layout and simultaneous multi-touch controls.
