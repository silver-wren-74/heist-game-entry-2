[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/silver-wren-74/heist-game-entry-2/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/silver-wren-74/heist-game-entry-2/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# The Aurelia Heist

An original top-down heist game for the make.fun bounty
[best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).

One thief, three rooms of the Aurelia Grand, and every eye in the
building. Cross each room, bag its prize — the Star Sapphire, the
Golden Ledger, the Crown of Aurelia — plus whatever else glitters, and
reach the van. Guards patrol with torch cones; cameras sweep cold blue
cones of their own; both feed a single ALARM meter in the header, and
at 100% the job is blown. Laser lines guard the later rooms and dump a
lump of alarm on anyone who breaks one. Loot is bagged by standing
close and still for a moment — the riskiest second of the job — and
the sack on the thief's back swells with every piece.

- **Gallery Floor** — two patrols, two cameras, open marble.
- **Banking Hall** — counters, a vault block, four guards, two lasers.
- **Vault Antechamber** — a camera that never stops turning at the
  room's heart, three lasers, and the Crown between two vaults.

## Play it

The game is plain static files under `game/` — no build step, no
network. Serve the folder any way you like, or use the bundled server:

```sh
node serve.ts
# open http://localhost:8080
```

Move with WASD or the arrow keys; stand still beside loot to bag it;
R restarts a room; Enter starts and advances.

## Hand it in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with
the kit's library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page and its styles.
- `game/src/rooms.js` — the three rooms as data: walls, patrols,
  cameras, lasers, loot, the van.
- `game/src/watchers.js` — guards and cameras, and the shared cone
  geometry: ray casts, line-of-sight, the cone polygon.
- `game/src/game.js` — the thief, the alarm, grabbing, lasers, the van.
- `game/src/render.js` — the rooms from above, the cones, the ALARM meter.
- `game/src/input.js` — keyboard controls.
- `game/src/shots.js` — the staged states the screenshots were taken in.
- `game/src/audio.js` — WebAudio sounds, no audio files.
- `game/src/rng.js` — a seeded generator for dressing.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

MIT licensed — see `LICENSE`.
