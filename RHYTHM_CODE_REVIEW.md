# Rhythm Section Code Review

Review of `src/sections/rhythm/` (~7,900 lines) covering correctness, optimization,
readability for newcomers, and generated `.mcfunction` output bloat. Based on a full
read of the game-logic, walls, UI, and config subsystems, plus inspection of the
actual `bun dev:build` output.

Two of the highest-severity findings below were independently verified against the
compiled `.mcfunction` files (not just source-level reasoning).

## 🐛 Correctness bugs

1. **Uncapped score multiplier** — `game/scoring.ts:93`.
   `tempCombo('@s')['<'](maxCombo)` looks like a clamp but `'<'` is just the
   *comparison* alias (returns a discarded `ConditionClass`) — it compiles to **zero
   commands**. Disassembling the output confirms the real formula is
   `finalScore = points * (combo + 50) / 50` — combo scaling is unbounded instead of
   capped at `maxCombo` as clearly intended. This directly affects leaderboard
   fairness.
   **Fix:** something like
   `_.if(tempCombo('@s').greaterThan(maxCombo), () => tempCombo('@s').set(maxCombo))`.

2. **Map/gold-line off-by-one** — `config/index.ts:38-45` vs
   `config/internal/derived.ts:37-42`. `playable(19)+playerRoom(8)+boothWall(1)+1 = 29`,
   but `mapLayout.size[2] = 30`. Confirmed this actually fires the `console.warn` at
   build time (silent under `sand build`'s wrapper, but fires when the module loads
   directly) — the placed structure doesn't line up with the arena's gold line. Bump
   `playable` to 20 or fix `size`.

3. **Parkour visual/hitbox desync** — `game/parkour.ts:73-104`. The glass-platform
   `block_display` never gets `wallDepth` set (only its ghast hitboxes do, via the
   `PARKOUR_FRESH`-tag "nearest" trick); `walls/ticking.ts:110` explicitly excludes
   `Tags.PARKOUR` entities from the generic depth assignment. Under non-zero
   calibration offset, the visible platform and its hitbox drift apart.

4. **`endGame()` can double-fire in one tick** — `game/end.ts:95-104`. The
   disconnect-triggered and timer-expiry-triggered branches aren't mutually exclusive
   in the same tick; mostly idempotent but can double the "Game Over!"
   title/tellraw/sound.

5. **`breakNearbyWall` radius (1.5) > hit radius (0.7)** — `game/walls/collision.ts:44`.
   Kills every `WALL`-tagged entity within 1.5 blocks of the hit player, not just the
   entity that was actually touched — a hit could destroy part of an unrelated
   adjacent wall if patterns are ever spawned closer than ~1.5 blocks apart.

6. **Minor / dead code:**
   - Dead `placeholder` export, unused anywhere — `game/calibration.ts:227-229`.
   - Inconsistent empty-list handling: `updateMapLine` shows "No maps" for
     `mapCount===0` but `updateSongLine` just renders blank for `songCount===0` —
     `game/settings.ts:138` vs `:170`.
   - `songs.ts`'s `seenWallTicks` set only powers a build-time `console.warn`; nothing
     actually dedupes the colliding schedule entries at runtime — `game/songs.ts:169-195`.

## 🗑️ Generated-mcfunction bloat

The rhythm section generates **2,569 of the datapack's 9,137 total `.mcfunction`
files (28%)** — compare to 336 for the similarly-scoped "magic" section. Breakdown of
the worst offenders:

### `songs/shared/` — 1,733 files, 4.5MB (21% of *all* function bytes in the datapack)

Root cause: `game/songs.ts:87-95`. Note-block song playback dedupes identical
`(sound, pitch, volume)` chords into shared functions via `sharedFn(...)`, but
`volume` comes straight from raw MIDI velocity (`Math.min(1.0, velocity + 0.3)`) and
is **never bucketed**. Confirmed 72+ distinct volume values in use for a single
instrument's notes, when only 25 distinct pitches exist across the whole song set.
Elsewhere in the same pipeline, note *duration* already gets this treatment
(`DURATION_BUCKETS` in `config/internal/render-sounds.ts:29`) — applying the same
bucketing to volume before building the dedup key would collapse most of these 1,733
one-line functions into a couple hundred.

### Scroll-text animation — ~53 unrolled `_.if` branches per file, ×2 files

`game/settings.ts:209-228` and `game/leaderboard.ts:212-236` each generate one
`_.if(scrollPos.equalTo(offset))` branch per character-offset, per scrolling song
title. With the current 5-song roster, two long titles alone produce ~53 branches per
file (~106 total), and this scales unbounded with song name length.

### Obstacles / parkour — lower priority, more inherent to the design

- 195 near-duplicate obstacle spawn functions, of which **117 are byte-identical
  grids** reused across *different* difficulty tiers (e.g. an EASY pattern is
  pixel-identical to two MASTER patterns) — `config/obstacles.ts`. This also causes
  ~87 redundant resourcepack models (`config/internal/generate-wall-models.ts:276-288`
  keys generation by obstacle name, not grid content).
- ~135 files for parkour path-dispatch switches — `game/parkour.ts:45-116`
  (`scoreSwitch` over 8 paths × 15 steps).
- These come from compile-time-unrolled codegen over static per-obstacle grid data;
  collapsing them is a bigger architectural change (e.g. storing grids as NBT and
  using a macro-driven runtime spawn function) rather than a quick fix.

## ⚡ Optimization opportunities

- **Biggest per-tick win:** `game/walls/spawning.ts:86-115` summons one hitbox entity
  *per grid cell* (up to 25 per obstacle) instead of merging contiguous same-height
  cells into wider `interaction` entities. This directly multiplies the cost of the
  per-tick macro-teleport in `moveWalls` (`walls/ticking.ts:73-102`) and the collision
  proximity scans — the highest-leverage performance fix in the subsystem.
- `game/settings.ts` `settingsTick`/`game/leaderboard.ts` `leaderboardTick` run ~8-12
  selector queries every tick even during active gameplay, when nearly all handlers
  are WAITING-only and no-op immediately — gate them behind one
  `_.if(status.lessThan(GameStatus.ACTIVE))`.
- `game/parkour.ts:103-104` does a full `@e[...,sort=nearest]` entity search twice per
  ghast instead of once via a single `execute.as(sel).run(...)` wrapping both score
  operations.
- `game/walls/spawning.ts:289-298` uses independent `_.if` blocks instead of
  `.elseIf()` chaining for mutually-exclusive difficulty-pool ranges — every range
  gets evaluated even after a match is found.
- `game/walls/collision.ts:117-121` spends an extra `execute if entity` sub-check per
  player per tick that could be folded directly into the outer selector's tag filter,
  like the adjacent block already does (`:130-131`).

## 📖 Readability for a newcomer

- The `Tags` enum (`game/state.ts:15-66`) has zero comments on the
  `WALL_NEW → WALL_WAIT → WALL_INIT → WALL_HIT → WALL_HIT_COOLDOWN` lifecycle — a
  newcomer has to reverse-engineer a 3-stage spawn pipeline from `walls/ticking.ts`
  to understand it.
- `game/settings.ts` and `game/leaderboard.ts` independently reimplement the same
  ~90-line "scrollable panel row" pattern (scroll-position variable, animation loop,
  self-rescheduling) — worth factoring into a shared helper in `hologram.ts`, which is
  already the shared panel module. They also both define a byte-for-byte identical
  `onAttack(buttonTag, handler)` helper that should be hoisted there too.
- `config/obstacles.ts` (2,387 lines) has no header comment documenting its grid
  schema or axis conventions, despite `game/walls/spawning.ts:91` relying on a
  non-obvious mirroring quirk ("hitboxes mirror the model grid because the wall model
  faces the player").
- Several magic numbers without explanation: `game/start.ts:72`
  (`cancelDelta.greaterThanOrEqualTo(10)`, an unexplained 0.5s debounce),
  `game/parkour.ts:35` (`PARKOUR_IMMUNITY_TICKS = 61`), `game/songs.ts:19-20`
  (`NBS_BATCH_TICKS`, `SEGMENT_VOLUME`).
- `settings.ts:534-550` and `leaderboard.ts:496,500` hardcode literal line indices for
  click hitboxes instead of reusing the named line constants declared earlier in the
  same files — a silent desync risk if a row ever moves.

## Suggested next steps

Good first fixes (self-contained, low risk):
1. Fix the score-cap no-op in `scoring.ts:93`.
2. Fix the `mapLayout` depth off-by-one in `config/index.ts`.
3. Bucket `volume` before building the note-dedup key in `game/songs.ts` /
   `config/internal/songs.ts` to shrink the 1,733-file `songs/shared/` bloat.

Bigger changes worth scoping separately:
- Merge contiguous wall hitbox cells into wider `interaction` entities.
- Factor the duplicated scroll-panel logic out of `settings.ts`/`leaderboard.ts`.
- Gate WAITING-only tick handlers behind a single status check.
