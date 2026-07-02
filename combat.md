# The Copper Can — Combat System

This document specs the active combat system for The Copper Can: an ASCII duel
where the can strides right across the arena while the player decides *what it
does with the shrinking distance* — which weapon to swing, where to aim it, and
when to raise the shield.

It describes the **target design**, not the code currently on `main`. The live
build runs a zero-input two-phase auto-battler (`resolveCombatTick` in
`js/actions.js`, driven by a `setInterval` at `COMBAT_TICK_MS`). This system keeps
that tick skeleton and turns the player from a spectator into a driver. See
**Integration Notes** for the migration path.

This file is the reference of record. If the implementation and this doc disagree,
the doc is the intent; fix the code or amend the doc, don't let them drift.

---

## Design Pillars

1. **The can runs right on its own.** The player never steers it. The agency is in
   *what it does with its limited time before it's in the enemy's face.* A can with
   somewhere to be.
2. **Range is risk.** Far away is safe and slow; up close is dangerous and lethal.
   The auto-advance forces that gradient on the player whether they like it or not.
3. **Input rewards, never required.** Leave a weapon equipped and touch nothing, and
   the can still fights — just worse. It chips with the slingshot until the ammo runs
   dry, then auto-swings at melee. It never braces, so it never parries and never
   crits, and it takes full hits. Casual players can watch it resolve like today;
   engaged players optimize. **The skill ceiling is high and the floor is zero** —
   ammo, guard, and weak points add depth without ever locking a passive player out
   of *winning*.
4. **Deliberate, not twitchy.** The 180ms tick keeps combat readable and on-brand for
   an incremental game. This is a game of decisions under mild time pressure, not
   reflexes. The parry is a *release timed to a telegraphed wind-up you braced ahead
   of*, a rhythm read, not a reaction from neutral.
5. **Deadpan throughout.** Every log line is in the can's dry, self-deprecating voice.
   Combat is funny because the can refuses to take it seriously.

---

## The Arena

Reuses the existing constants: `COMBAT_ARENA_WIDTH = 98`, `COMBAT_ARENA_HEIGHT = 16`.

```text
+--------------------------------------------------------------------------+
|                                                                          |
|   [can]                                                  [enemy]         |
|   o_O                                                      /\__           |
|  /|=|                                                     ( oo )          |
|   |_|------------------------------------------------------\  /-----------|  <- floor
+--------------------------------------------------------------------------+
  playerX -->                                              <-- enemyX
```

The can spawns at `playerX = 2` and advances rightward. The enemy holds near
`enemyX = COMBAT_ARENA_WIDTH - 12`. The **gap** between them is the most important
number in the fight — it decides which weapons are in band and how much danger the
can is in.

The 16-line height comfortably holds a 3×3 targeting grid over a mid-sized enemy.
Sprites taller than the arena (the dragon at 25 lines) are boss-arena cases that bump
`COMBAT_ARENA_HEIGHT` to a dedicated constant — keep the standard height for basic and
medium tiers.

### Screen Layout

The combat screen is **three stacked regions**, all the same 98-wide footprint:

```text
+-- FIGHT --------------------------------------------------------------+
|                                                                       |
|   o_O                                                       /\__      |
|  /|=|                                                      ( oo )     |   <- arena: just the fight,
|   |_|___________________________________________________________\  /_|      16 lines, no text clutter
+-----------------------------------------------------------------------+
+-- STATUS -------------------------------------------------------------+
| WEAPON Sword   ·  vs Fox  [######....] 6/10   ·  YOU 7/10  ·  BITS +0  |   <- updates in place,
| AMMO [####.] 4/5   ·  GUARD [########..]   ·  RANGE melee              |      two lines
+-----------------------------------------------------------------------+
+-- LOG ----------------------------------------------------------------+ ^
| The fox slinks out from the dark trees, eyes fixed on you.            | #
| You ready the Sword.                                                  | #
| Caught it on the shield. We're both surprised. Its side looks soft.  | #
| Sword bites its right for 27. It reels back across the dirt.         | #
| > Recovered 6 copper bits.                                           | v
+-----------------------------------------------------------------------+
```

This is a deliberate change from today's `renderCombatView`, which packs the status
header, the arena, and a single overwritten `message` line into one `FIGHT` box.
Pulling the status into its own strip declutters the arena, and the **log replaces the
single message line with a scrolling history** (see below).

---

## The Combat Log (Terminal)

A scrolling terminal beneath the arena, in the spirit of Candy Box 2's combat readout.
It is where the fight *narrates itself* in the can's voice. Two distinct pieces do two
different jobs — keeping them separate is what stops the log from drowning in noise.

### Status strip — updates in place

Two fixed lines directly under the arena that always show the *current* state. They
never scroll; they overwrite themselves each tick:

```text
WEAPON Sword   ·  vs Fox  [######....] 6/10   ·  YOU 7/10  ·  BITS +0
AMMO [####.] 4/5   ·  GUARD [########..]   ·  RANGE melee
```

- **WEAPON** — the equipped Q/W/E choice.
- **vs `name`** — the enemy's name and an HP gauge (ASCII bar, e.g. `######....`).
- **YOU** — `player.health` / `maxHealth`.
- **BITS** — copper earned *this fight*, jumping to the reward total on the kill.
- **AMMO** — the slingshot's refilling pool (gauge + `current/max`).
- **GUARD** — the shield's guard meter (gauge only).
- **RANGE** — the current band: `long` / `mid` / `melee`. A free readout of which
  weapons are live, so the player doesn't have to eyeball the gap.

Because these values change constantly, they belong here, not in the feed. The strip
answers "what's true right now"; the log answers "what just happened".

### Event feed — append-only, scrollable

A scrollable list below the strip. New lines append at the **bottom**, oldest at the
top, auto-scrolled so the newest is always in view. The player can scroll back to
re-read. It is a real scroll region, not a faked one:

- State holds the history: `combat.log = [{ text, kind }, ...]`.
- Render the whole array into a monospace element with `max-height` and
  `overflow-y: auto`.
- After each render, **auto-scroll to the bottom only if the player was already at the
  bottom** — don't yank them down mid-scroll-back.
- Cap the buffer (e.g. last 200 entries) so it can't grow without bound.

### The one rule: one line per event, never per tick

This is the rule that makes or breaks the log. The loop runs every 180ms; if it
appended a line every tick the feed would be unreadable garbage in two seconds.
**Append only on state transitions**, never on the steady state:

| Append a line when…                | Example (the can's voice)                          |
|------------------------------------|----------------------------------------------------|
| The fight starts                   | `The fox slinks out from the dark trees.`          |
| The player swaps weapon            | `You ready the Sword.`                             |
| A weapon actually lands a hit      | `Slingshot stings its right for 3.`                |
| The slingshot runs dry             | `Out of rivets. Typical.`                          |
| A block resolves                   | `Took it on the shield. Rang like a bell.`         |
| A parry resolves (negate+stagger)  | `Caught it clean. It staggers, side wide open.`    |
| A weak point is first revealed     | `> Found the soft spot. It won't like that.`       |
| A weak-point crit lands            | `> Right in the seam. 27 damage.`                  |
| The can takes a hit                | `That'll dent. 7/10 left.`                         |
| Knockback fires                    | `It reels back across the dirt.`                   |
| Bits are collected                 | `> Recovered 6 copper bits.`                       |
| Victory / defeat / flee            | `Still a can. Still standing.`                     |

Do **not** append for: a weapon on cooldown, a tick where nothing connected, the can
advancing, the enemy simply being in range, ammo or guard regenerating, or the gap
changing. The status strip already covers all of that steady state.

### Message kinds (for styling)

Each entry carries a `kind` so the renderer can color or mark it, the way Candy Box
highlights important lines:

- `info` — neutral narration (fight start, weapon swap, ammo out).
- `hit` — the can deals ordinary damage.
- `crit` — weak-point hit or first reveal; render emphasized, often prefixed `>`.
- `guard` — block or parry resolves.
- `hurt` — the can takes damage.
- `reward` — bits collected; prefixed `>` and tinted.
- `result` — victory / defeat / flee; the closing line.

### Rendering approach

Add a `pushCombatLog(text, kind)` helper that appends to `combat.log` and trims to the
cap. A `renderCombatLog()` reads the array into the scrollable element. The existing
single `game.combat.message` becomes the *latest* entry rather than the whole readout —
keep it if convenient, but the array is the source of truth.

Style a `.combatLog` class in `css/design.css`: monospace, the same border treatment as
the ASCII boxes, a fixed `max-height` (≈ 8 visible rows), and `overflow-y: auto`. The
auto-scroll is a one-liner in JS after render: `el.scrollTop = el.scrollHeight`
(guarded by the at-bottom check above).

---

## Movement: The Can Runs Right

There is no manual movement. The can closes the gap each tick at a fixed run speed
(`COMBAT_MOVE_STEP`). This is what makes the weapon triad matter: as the gap shrinks,
different weapons come into band.

Two things bend the distance without ever handing the player a steering control:

- **Bracing slows the run** to half speed (`braceMoveMultiplier`, default 0.5). It
  does *not* stop the can — release and it resumes full speed. This gives brace a
  spatial identity (plant and fish a parry instead of marching straight into melee)
  without becoming free movement. See **Blocking And Shields**.
- **Knockback re-opens the gap.** A landed **sword hit** or a **weak-point crit**
  shoves the enemy back; enemies **lunge** to re-close on their own timers.

The result is an in-and-out rhythm — chip from range, close in, big hit, knockback,
repeat — with the player never once steering the can.

### Knockback is a routing lever

Where the sword's knockback *lands the enemy* decides which weapon the rhythm loops
through, so it isn't just "distance juice" — it's a tuning knob that shapes the whole
fight:

- Knock the enemy back **into the mid band (6–20)** → the loop cycles through the
  **Pry Bar**: a tight, close-quarters rhythm.
- Knock it back **into the long band (20+)** → the loop resets to the **Slingshot**: a
  longer, more ranged rhythm where banked ammo matters.

Knockback distance is a base tuning value scaled by each enemy's `knockbackResist`
(`0` = full knockback, higher = sturdier). **Tuning rule: keep base knockback at least
~4× `COMBAT_MOVE_STEP`**, or the can re-closes the gap before the ranged weapon gets a
shot off and the in-and-out rhythm collapses into "stand in melee and sword."

---

## The Weapon Triad

Three weapons, all tied to items the player already earns (`slingshot`, a new `pryBar`,
`sword`). Weapons occupy **range bands with dead zones** — each has a stretch of the
arena where it simply doesn't reach — so closing the gap *forces* hand-offs. The
slingshot is the deliberate exception: it works across the whole arena, and its limiter
is **ammo**, not range.

| Slot | Weapon    | Band (gap)          | Cooldown         | Damage | Ammo            | Knockback              |
|------|-----------|---------------------|------------------|--------|-----------------|------------------------|
| Q    | Slingshot | whole arena (0–98)  | 2 ticks (~0.36s) | 1–2    | Yes, refilling  | none                   |
| W    | Pry Bar   | 0–20                | 4 ticks (~0.72s) | 4–5    | no              | none                   |
| E    | Sword     | 0–`reach` (~0–6)    | 7 ticks (~1.3s)  | 10–12  | no              | strong (resets the gap)|

A weapon only fires when the enemy is **inside its band** and its **cooldown has
elapsed** (and, for the slingshot, it has ammo). The UI dims a weapon's icon when the
enemy is outside its band, so switching is an informed read, not a guess. Damage values
seed from the existing `COMBAT_PLAYER_DAMAGE` and `SWORD_ATTACK_BONUS`; every number
above is tunable.

### The three decision bands

As the gap closes, the interesting choice changes:

- **Long (20–98): Slingshot only.** Chip while you approach. Every rivet spent here is
  a rivet not banked for a weak-point opening later — that's the tension.
- **Mid (6–20): Pry Bar, or conserve.** The Pry Bar out-damages the slingshot and costs
  no ammo, so this band is mostly "Pry Bar while banking rivets."
- **Melee (0–6): the real decision.** The Pry Bar **overlaps down into melee**, so it
  and the Sword coexist here, and that's the crux choice of the fight:
  - **Sword** — highest burst (~1.5 dmg/tick) *plus knockback that resets your
    position.* Take it when you want to reopen range.
  - **Pry Bar** — lower burst (~1.1 dmg/tick) but **no knockback**, so you *hold
    position.* Take it when resetting would be bad: a weak zone is open at melee, or
    you want to keep a lunging enemy pinned rather than shoving it away to re-lunge.
  - **Banked Slingshot** — dump saved ammo into a lit weak zone for the x2.5 (see
    Targeting). Your on-demand crit when an opening appears.

The DPS ladder still climbs with proximity, but knockback makes the top of it
*situational* rather than always-correct — that's the non-monotonic decision that keeps
weapon choice from collapsing into "always sword at melee."

### Ammo

The slingshot draws from a refilling pool (`slingshotAmmo` / `slingshotAmmoMax`) that
**regenerates passively over ticks** (`slingshotRegenTicks`), full at the start of each
fight. It does not come from pickups. Burn it dry chipping on the approach and you have
no long-range option until it trickles back — so the smart play is to **bank rivets for
the moment a weak zone opens.** The idle floor is unaffected: a do-nothing can fires
until dry, then auto-swings at melee.

---

## Targeting And Weak Points

The player aims with the number keys, numpad-spatial, exactly as a numpad reads:

```text
 7 8 9      top-left   top-center   top-right
 4 5 6      mid-left   center       mid-right
 1 2 3      bot-left   bot-center   bot-right
```

**All three weapons target any zone equally** — aiming is a pure overlay on the damage
model, not differentiated per weapon. The selected zone persists until changed; default
is **center (5)**.

### Canonical zone mapping (one map for both modes)

Keys always map to the 3×3 grid above. `zoneMode` decides how many of those cells are
*distinct*:

- **Columns**: `1/4/7` = left, `2/5/8` = center, `3/6/9` = right.
- `zoneMode: "grid"` — full 3×3; all nine cells are distinct.
- `zoneMode: "thirds"` — small sprites (3–5 lines); the **row is ignored** and each key
  collapses to its column. `3` and `9` both mean "right." Number keys 1–3 suffice, but
  the numpad muscle memory is identical to grid enemies.

Author `weakZones` / `armorZones` in either granularity; the engine reads the column in
`thirds` mode and the exact cell in `grid` mode. This is the fix for the old bug where a
`thirds` enemy carried grid coordinates (`9`, `1`) that its own mode couldn't address.

### The center-is-safe rule

**Center (the default aim) is always x1.0 — never weak, never armored.** This is what
keeps the zero-input floor honest: the do-nothing can mashes center and deals clean
ordinary damage, never accidentally landing on an armor plate. Weak and armor zones
therefore always live **off-center**.

### Multipliers are gated, and only matter in openings

Each enemy carries a **zone multiplier map**:

- **Weak zone** — bonus multiplier (e.g. x2.5). Gated by the parry (below): a player who
  never braces never reveals it and so **never crits**. That's intended — crits are the
  reward for engaging the defensive layer, not a baseline.
- **Armor zone** — penalty multiplier (e.g. x0.4). Always live, but always off-center,
  so the floor player never touches it. It only bites the player who's *aiming around* —
  hunting the weak zone, or fat-fingering next to it under the time pressure of an open
  window. **Armor is a `grid`-tier mechanic:** in `thirds` mode the only neighbor of the
  weak column is the safe center, so there's nowhere to place armor adjacent to weak
  without breaking the center-is-safe rule. Basic/`thirds` enemies get a weak zone and
  no armor — fumbling the aim there costs you the *bonus*, not a penalty.
- **Default** — x1.0 everywhere else.

### How the weak zone is revealed: `weakZoneModel`

The weak zone lights up when you **parry** (negate an attack inside its telegraph
window, which staggers the enemy). Two models, split by tier:

- `"discover"` — **basic and medium.** The first parry *reveals and permanently unlocks*
  the weak zone; after that, aiming it lands the x2.5 for the rest of the fight, no
  further parries required. Parry is a one-time key that opens the enemy up.
- `"window"` — **bosses.** The weak zone is vulnerable **only during each stagger
  opening.** Every crit needs a fresh parry. This replaces the old boss-only
  `weakOpensOn: "recovery"` flag with a general field, and makes bosses about learning
  the *pattern* rather than the *map*.

**Tuning rule: the stagger opening must be at least as long as your fastest weapon's
cooldown** (`staggerTicks ≥ slingshot cooldown`), or a parry can whiff with nothing
ready to fire into the opening and the payoff feels stolen. This is also the strongest
argument for banking slingshot ammo — it's your guaranteed crit-on-demand the instant
the zone lights.

### Discovery is the fun part

Don't hand the player the weak zone on a plate — but do make the reveal legible when it
happens:

- The stagger frame **lights the weak zone's glyph** (highlight / pulse).
- The can narrates it: *"Something about its side looks soft. Or I'm projecting."*
- For `window` bosses, the zone only opens during recovery, so the player learns the
  attack pattern to earn each opening.

---

## Blocking And Shields

A held **brace** key (Shift) raises the shield. There is no backpedal — bracing is
purely defensive, it slows your approach, and it costs you offense. It stacks four
effects, so the telegraph it plays against must be *unmissable* or the layer feels like
guesswork:

- **Hold to brace** — incoming damage reduced (e.g. −50%, `blockReduction`) for as long
  as held. The can does not attack while bracing and its weapon cooldowns pause. It also
  runs at half speed (`braceMoveMultiplier`). The cost is DPS *and* tempo.
- **Timed parry** — *releasing* the brace inside the enemy's telegraph window negates the
  hit entirely and **staggers** the enemy, opening its weak zone (revealing it for
  `"discover"`, opening the window for `"window"`). This wires the defensive layer
  straight into the targeting reward loop: **parry → opening → aimed crit.**
- **Guard meter** — bracing drains a meter (`guard`, 0–100) that refills when not
  bracing. Its job isn't to stop perma-brace (the DPS and tempo costs already do that);
  it's **timing pressure on the parry**: you can't brace early and hold, fishing for the
  wind-up. **Size it against the enemy's own clock** — a budget of roughly
  *1.5 × `telegraphTicks`* of brace per attack cycle, refilling over the enemy's
  `attack.intervalTicks`. The result: you can parry about once per enemy attack *if you
  brace late and read the cadence*, but you can't hold the shield open indefinitely.

Shields are equippable items (a `shieldAsset` already exists in the art files).
Different shields tune block percentage, parry window width, and guard meter size. The
existing `boots` damage reduction stacks underneath as flat passive mitigation.

---

## Fleeing And Defeat

The can loses when `player.health` (currently 10) hits zero — the same health pool used
everywhere else. On defeat, combat ends, no reward, and the can is beaten back to the
map. Keep the forgiving tone: *"There is no shame in retreat."*

**Flee is available at any time.** A flee key/button ends the fight immediately and
returns to `returnScreen` / `returnView`. Fleeing forfeits the reward and (by default)
resets the enemy's HP for next time. It is never punished beyond the lost progress —
retrying is free.

---

## Controls

| Key            | Action                                             |
|----------------|----------------------------------------------------|
| Q / W / E      | Equip Slingshot / Pry Bar / Sword                  |
| 1–9 (numpad)   | Aim at zone (numpad-spatial, 1 = BL, 9 = TR)       |
| Shift (hold)   | Brace; release inside the telegraph window = parry |
| F              | Flee the fight                                     |

Numpad targeting is ideal on a full keyboard. On laptops the number row works with the
same spatial map (1–3 = bottom, 4–6 = mid, 7–9 = top). All bindings are configurable;
this is the recommended default (left hand on weapons, right hand on the numpad, either
thumb on Shift).

---

## The Tick Model

The 180ms `setInterval` stays the heartbeat. The shift from the current system: **player
input is state the tick reads, not events that fire attacks.** The player sets
`equippedWeapon`, `targetZone`, and `bracing`; the tick resolves them.

Each tick, in order:

1. **Advance.** Move the can right by `COMBAT_MOVE_STEP` (halved if `bracing`); recompute
   the gap and the current range band.
2. **Regen.** Tick up `slingshotAmmo` toward its max; drain `guard` if bracing, refill it
   otherwise.
3. **Player action.** If `bracing`, skip the attack (cooldowns already paused). Otherwise,
   if the equipped weapon is **in band** *and* its cooldown is ready *and* (for the
   slingshot) it has ammo: deal `damage × zoneMultiplier(targetZone)`, spend ammo if
   slingshot, reset that weapon's cooldown. Sword hits and crits apply knockback.
   `zoneMultiplier` returns x2.5 only if the target is the weak zone *and* it's currently
   creditable (`weakRevealed` for `"discover"`, `enemyStagger > 0` for `"window"`), x0.4
   for an armor zone, x1.0 otherwise.
4. **Enemy.** Resolve behavior on its own timers: advance / lunge, set `enemyTelegraph`
   on wind-up, attack. If an attack lands, apply
   `enemyDamage − blockReduction − bootsReduction` to `player.health`. A valid parry
   (brace released during `enemyTelegraph`) negates it, sets `enemyStagger`, and reveals
   / opens the weak zone.
5. **Decrement & check.** Tick down all cooldowns, `enemyTelegraph`, `enemyStagger`, and
   enemy timers. Check victory / defeat.

This is expressed as a **pure reducer** so it can be tested headless and tuned offline
before wiring to the DOM:

```js
// No DOM, no localStorage, no setInterval inside.
stepCombat(combatState, enemy, playerStats, input, tuning) -> newCombatState
// input:   { weapon: "slingshot"|"pryBar"|"sword", targetZone: 1..9, bracing: bool,
//            releasedBrace: bool }   // releasedBrace flags the parry attempt this tick
// tuning:  bands, cooldowns, damages, ammo regen, guard drain/refill, knockback,
//          block/parry, multipliers — all the tweakables
```

The `setInterval` becomes a thin driver: read input state, call `stepCombat`, render,
persist (throttled). Keeping the reducer pure is what lets you balance the triad in a
scratch harness (`combat-lab.html`) instead of in-game.

---

## Feedback And Juice

The mechanics only feel good if the player can read them. Priorities:

- **Attack telegraph** — a wind-up glyph or line before *every* enemy attack, so blocking
  and parrying are a fair read, not reactive guesswork. This is load-bearing given how
  much brace stacks onto one key.
- **Floating damage numbers** off the struck zone; weak-point hits render larger or
  flagged (`!`, `CRIT`).
- **Weak-zone light** — the zone's glyph highlights on stagger (and stays lit for
  `"discover"` enemies once revealed).
- **Weapon pose swap** — the can's sprite changes per equipped weapon, so its current
  tool is always visible.
- **Out-of-band dimming** — weapon icons dim when the enemy is outside their band; the
  `RANGE` readout names the current band.
- **Enemy flinch frame** on hit; **stagger frame** on parry with the weak zone lit.
- **Ammo and guard gauges** in the status strip, ticking live.
- **One log line per event, not per tick.** Notable beats only (a crit, a parry, a
  knockback, the kill), always in the can's voice.

Avoid: reflex-tier pacing (keep the tick slow), and unflagged weak points that force
blind trial-and-error.

---

## Enemy Definition

New fields extend the existing `combatEnemies` shape in `js/data.js`.

**Basic tier — `thirds`, no armor, `discover` reveal:**

```js
darkTreeWatcher: {
  id: "darkTreeWatcher",
  name: "Fox",
  maxHealth: 10,
  rewardCopperBits: 6,

  reach: 6,                 // melee range; also the sword's effective band ceiling
  knockbackResist: 0,       // 0 = full knockback, higher = sturdier

  zoneMode: "thirds",       // keys collapse to column: 1/4/7=L, 2/5/8=C, 3/6/9=R
  weakZoneModel: "discover",// first parry reveals, then permanent
  weakZones: { 3: 2.5 },    // right column is soft
  // no armorZones on basic tier — a fumbled aim just forfeits the bonus

  attack: {
    damage: 1,
    intervalTicks: 6,       // attacks every ~1.1s when in reach
    telegraphTicks: 3,      // wind-up frames = the parry window (widened for basic tier)
    staggerTicks: 3,        // opening length; must be >= fastest weapon cooldown
  },

  introText: "The fox slinks out from the dark trees, eyes fixed on you.",
  approachText: "It pads low through the dirt and closes the gap.",
  victoryText: "The fox yelps, turns tail, and vanishes into the trees.",
}
```

**Medium tier — `grid`, armored adjacent to weak, `discover` reveal:**

```js
boneRattle: {
  id: "boneRattle",
  name: "Skeleton",
  maxHealth: 22,
  rewardCopperBits: 14,

  reach: 6,
  knockbackResist: 1,       // sturdier; sword shoves it less far

  zoneMode: "grid",         // full 3x3
  weakZoneModel: "discover",
  weakZones: { 9: 2.5 },    // top-right (the exposed skull) is soft
  armorZones: { 6: 0.4 },   // mid-right, directly under the skull: fat-finger 9->6 and you glance off bone

  attack: {
    damage: 2,
    intervalTicks: 5,
    telegraphTicks: 2,      // tighter window than the fox
    staggerTicks: 3,
  },

  introText: "It clatters upright, rebuilding itself one bad idea at a time.",
  approachText: "It rattles forward, all elbows.",
  victoryText: "It comes apart into a pile of parts and grievances.",
}
```

Bosses set `weakZoneModel: "window"` and may bump `COMBAT_ARENA_HEIGHT` for tall sprites
(the 25-line dragon).

---

## Player Combat State

New fields on `createCombatState()` in `js/gameState.js`:

```js
{
  // ...existing: active, phase, enemyId, enemyHp, enemyMaxHp, playerX, enemyX,
  //              canExit, defeated, returnScreen, returnView, message, rewardCopperBits

  equippedWeapon: "slingshot",   // current Q/W/E selection
  targetZone: 5,                 // current 1–9 aim, default center (always x1.0)
  bracing: false,                // shield held this tick

  guard: 100,                    // guard meter, 0–100
  slingshotAmmo: 5,              // current rivets; max + regen live in tuning

  cooldowns: { slingshot: 0, pryBar: 0, sword: 0 },  // ticks remaining
  enemyTelegraph: 0,             // ticks left in enemy wind-up (the parry window)
  enemyStagger: 0,               // ticks left in the stagger opening
  weakRevealed: false,           // set true on first parry (for "discover" enemies)

  log: [],                       // [{ text, kind }] append-only history
  fightBits: 0,                  // copper earned this fight (status strip "BITS +n")
}
```

New inventory flags: `pryBar`, `shield`.

Keep `phase` for `idle` / `victory` / `defeat` only — the old `approach` → `attack`
split is gone; the gap and the range bands decide what happens now, not a phase flag.

---

## Tuning Reference

Every balance lever in one place.

| Constant / field                | Where        | Effect                                                    |
|----------------------------------|--------------|-----------------------------------------------------------|
| `COMBAT_TICK_MS`                | `data.js`    | Combat pace. 180 = deliberate. Lower = twitchier.         |
| `COMBAT_MOVE_STEP`              | `data.js`    | How fast the gap closes per tick.                         |
| `braceMoveMultiplier`          | tuning       | Run speed while bracing (0.5 = half).                     |
| Weapon **bands** (min/max gap)  | tuning       | Where each weapon reaches. The dead zones that force swaps.|
| Weapon cooldown / damage        | tuning       | The triad's DPS ladder. Six numbers.                      |
| `slingshotAmmoMax`             | tuning       | Size of the rivet pool.                                   |
| `slingshotRegenTicks`          | tuning       | Ticks per +1 rivet. Higher = ammo is scarcer.             |
| base knockback distance         | tuning       | Gap reopened per sword hit. Keep ≥ ~4× `COMBAT_MOVE_STEP`.|
| `knockbackResist`              | per enemy    | Scales knockback down. 0 = full, higher = sturdier.       |
| `blockReduction`               | tuning       | Damage cut while bracing (e.g. 0.5).                      |
| parry negate                    | tuning       | Full negate on a valid parry (on/off, effectively).       |
| `guardMax` / drain / refill     | tuning       | How permissive bracing is. Size vs `telegraphTicks`/interval.|
| `weakZones` / `armorZones`     | per enemy    | Aiming reward (x2.5) and punishment (x0.4).               |
| `weakZoneModel`                | per enemy    | `"discover"` (reveal, permanent) vs `"window"` (per-parry).|
| `zoneMode`                     | per enemy    | `"thirds"` (column-only) vs `"grid"` (full 3×3).          |
| `reach`                        | per enemy    | Sword band ceiling and where the enemy can hit you.       |
| `attack.intervalTicks`         | per enemy    | Enemy aggression → number of parry openings offered.      |
| `attack.telegraphTicks`        | per enemy    | Parry window width. Wider = more forgiving.               |
| `attack.staggerTicks`          | per enemy    | Opening length. **Must be ≥ fastest weapon cooldown.**    |
| Log buffer cap                  | tuning       | Max retained log entries (≈200).                          |
| Log visible rows                | `design.css` | `max-height` of the scroll region (≈8 rows).              |

---

## Integration Notes

Migrating from the current `resolveCombatTick`:

1. **Extract the reducer.** Pull the damage / movement / victory logic out of
   `resolveCombatTick` into a pure `stepCombat(...)` with no `saveGame`, `renderGame`, or
   `game` mutation inside — it takes state and returns new state.
2. **Collapse the phases.** The `approach` → `attack` split disappears. One continuous
   loop; the gap and weapon bands decide what happens, not a phase flag. Keep `phase` for
   `idle` / `victory` / `defeat` only.
3. **Player becomes the mover.** Today the Fox advances and the player is static. Flip it:
   the can advances right, the enemy holds and lunges.
4. **Wire input as state.** Add keydown/keyup handlers that write `equippedWeapon`,
   `targetZone`, and `bracing` onto combat state (and flag `releasedBrace` on the keyup
   that ends a brace). The tick *reads* these; it never fires on the keypress itself.
5. **Map old items onto the triad.** `slingshot` → Q, new `pryBar` → W, `sword` → E.
   `boots` stays as flat passive mitigation under the shield's block.
6. **Add the new systems.** Range bands, slingshot ammo pool + regen, guard meter
   drain/refill, brace-slows-movement, the parry → stagger → weak-zone-reveal chain, and
   the `weakZoneModel` / `zoneMode` reads. Build and balance these in `combat-lab.html`
   against the pure reducer before touching the DOM.
7. **Throttle persistence.** The current loop writes to `localStorage` every tick. Save on
   combat end and on meaningful transitions only, never every 180ms.
8. **Split the readout.** Break the single `FIGHT` box into three regions: the arena box,
   a two-line in-place status strip (now carrying AMMO / GUARD / RANGE), and a scrollable
   log fed by `combat.log`. Replace `message =` overwrites with `pushCombatLog(text,
   kind)` calls placed at the transitions listed in **The Combat Log** — never in the
   steady tick.

---

## Open Decisions

The system is fully specified above; these are feel-tuning calls left to settle in
`combat-lab.html`, none blocking:

- **Switch cost.** Free instant weapon swaps, or a small shared cooldown so swapping
  mid-swing has a price? Free is simpler and reads better with the band hand-offs; a
  small cost adds commitment. Leaning free.
- **Knockback vs. brace as the dominant rhythm driver.** Both are in; tuning
  (`knockbackResist`, guard sizing, telegraph width) decides which one the fight *feels*
  built around, and it can differ per enemy.
- **Ammo regen rate.** How scarce should rivets feel — a steady trickle you rarely notice,
  or tight enough that banking for openings is a real sacrifice? Set once the parry loop
  is playable.
- **Guard meter permissiveness.** The 1.5×-telegraph budget is a starting point; widen for
  early enemies, tighten for bosses.

---

## The Can's Voice In Combat

Tone reference — dry, deadpan, faintly put-upon:

- On a miss: *"I threw a rivet. It bounced off. Humiliating for one of us."*
- Out of ammo: *"Out of rivets. We do this the hard way now."*
- On the reveal: *"Something about its side looks soft. Or I'm projecting."*
- On a crit: *"Found the soft spot. It did not enjoy that."*
- On a parry: *"Caught it on the shield. We're both surprised."*
- On taking a hit: *"That'll dent. I'm mostly dents at this point."*
- On knockback: *"Gave it some room. Room it did not ask for."*
- On fleeing: *"Strategic. Definitely strategic."*
- On victory: *"Still a can. Still standing. Low bar, cleared."*