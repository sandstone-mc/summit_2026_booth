# Rhythm Section Code Review

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

4. **`endGame()` can double-fire in one tick** — `game/end.ts:95-104`. The
   disconnect-triggered and timer-expiry-triggered branches aren't mutually exclusive
   in the same tick; mostly idempotent but can double the "Game Over!"
   title/tellraw/sound.

6. **Minor / dead code:**
   - Inconsistent empty-list handling: `updateMapLine` shows "No maps" for
     `mapCount===0` but `updateSongLine` just renders blank for `songCount===0` —
     `game/settings.ts:138` vs `:170`.

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
- `settings.ts:534-550` and `leaderboard.ts:496,500` hardcode literal line indices for
  click hitboxes instead of reusing the named line constants declared earlier in the
  same files — a silent desync risk if a row ever moves.
