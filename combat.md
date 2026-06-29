# The Copper Can — Combat System

This document specs the active combat system for The Copper Can: an ASCII duel
where the can strides right across the arena while the player decides *what it
does with the shrinking distance* — which weapon to swing, where to aim it, and
when to raise the shield.

It describes the target design, not the code currently on `main`. The live build
runs a zero-input two-phase auto-battler (`resolveCombatTick` in `js/actions.js`,
driven by a `setInterval` at `COMBAT_TICK_MS`). This system keeps that tick
skeleton and turns the player from a spectator into a driver. See
**Integration Notes** for the migration path.

## Design Pillars

1. **The can runs right on its own.** The player never steers it. The agency is
   in *what it does with its limited time before it's in the enemy's face.* A
   can with somewhere to be.
2. **Range is risk.** Far away is safe and slow; up close is dangerous and
   lethal. The auto-advance forces that gradient on the player whether they like
   it or not.
3. **Input rewards, never required.** Leave a weapon equipped and touch nothing,
   and the can still fights — just worse. Casual players can watch it resolve
   like today; engaged players optimize. The skill ceiling is high and the floor
   is zero.
4. **Deliberate, not twitchy.** The 180ms tick keeps combat readable and on-brand
   for an incremental game. This is a game of decisions under mild time pressure,
   not reflexes.
5. **Deadpan throughout.** Every log line is in the can's dry, self-deprecating
   voice. Combat is funny because the can refuses to take it seriously.

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
number in the fight.

The 16-line height comfortably holds a 3x3 targeting grid over a mid-sized enemy.
Sprites taller than the arena (the dragon at 25 lines) are boss-arena cases that
bump `COMBAT_ARENA_HEIGHT` to a dedicated constant — keep the standard height for
basic and medium tiers.

### Screen Layout

The combat screen is **three stacked regions**, all the same 98-wide footprint:

```text
+-- FIGHT --------------------------------------------------------------+
|                                                                       |
|   o_O                                                       /\__      |
|  /|=|                                                      ( oo )      |   <- arena: just the fight,
|   |_|___________________________________________________________\  /__|      16 lines, no text clutter
+-----------------------------------------------------------------------+
+-- STATUS -------------------------------------------------------------+
| WEAPON Sword  |  vs Fox  HP [######....] 6/10  |  YOU 7/10  | BITS +0 |   <- updates in place
+-----------------------------------------------------------------------+
+-- LOG ----------------------------------------------------------------+ ^
| The fox slinks out from the dark trees, eyes fixed on you.            | #
| You ready the Sword.                                                  | #
| Sword bites its top-right for 11. It reels back.                      | #
| > Recovered 6 copper bits.                                            | v
+-----------------------------------------------------------------------+
```

This is a deliberate change from today's `renderCombatView`, which packs the
status header, the arena, and a single overwritten `message` line into one
`FIGHT` box. Pulling the status into its own strip declutters the arena, and the
**log replaces the single message line with a scrolling history** (see below).

## The Combat Log (Terminal)

A scrolling terminal beneath the arena, in the spirit of Candy Box 2's combat
readout. It is where the fight *narrates itself* in the can's voice. Two distinct
pieces do two different jobs — keeping them separate is what stops the log from
drowning in noise.

### Status strip — updates in place

A single fixed line (or two) directly under the arena that always shows the
*current* state. It never scrolls; it overwrites itself each tick:

```text
WEAPON Sword  |  vs Fox  HP [######....] 6/10  |  YOU 7/10  |  BITS +0
```

- **WEAPON** — the equipped Q/W/E choice.
- **vs `name`** — the enemy's name and an HP bar (ASCII gauge, e.g. `######....`).
- **YOU** — `player.health` / `maxHealth`.
- **BITS** — copper earned *this fight*, ticking up live as you land the kill.

Because weapon and HP change constantly, they belong here, not in the feed. The
strip answers "what's true right now"; the log answers "what just happened".

### Event feed — append-only, scrollable

A scrollable list below the strip. New lines append at the **bottom**, oldest at
the top, auto-scrolled so the newest is always in view. The player can scroll back
to re-read. It is a real scroll region, not a faked one:

- State holds the history: `combat.log = [{ text, kind }, ...]`.
- Render the whole array into a monospace element with `max-height` and
  `overflow-y: auto`.
- After each render, **auto-scroll to the bottom only if the player was already at
  the bottom** — don't yank them down mid-scroll-back.
- Cap the buffer (e.g. last 200 entries) so it can't grow without bound.

### The one rule: one line per event, never per tick

This is the rule that makes or breaks the log. The loop runs every 180ms; if it
appended a line every tick the feed would be unreadable garbage in two seconds.
**Append only on state transitions**, never on the steady state:

| Append a line when…              | Example (the can's voice)                        |
|----------------------------------|--------------------------------------------------|
| The fight starts                 | `The fox slinks out from the dark trees.`        |
| The player swaps weapon          | `You ready the Sword.`                           |
| A weapon actually lands a hit    | `Slingshot stings its top-right for 3.`          |
| A weak-point crit lands          | `> Found the soft spot. 8 damage.`               |
| A block or parry resolves        | `Caught it on the shield. We're both surprised.` |
| The can takes a hit              | `That'll dent. 7/10 left.`                       |
| Knockback fires                  | `It reels back across the dirt.`                 |
| Bits are collected               | `> Recovered 6 copper bits.`                     |
| Victory / defeat / flee          | `Still a can. Still standing.`                   |

Do **not** append for: a weapon being on cooldown, a tick where nothing connected,
the can advancing, or the enemy simply being in range. The status strip already
covers the steady state.

### Message kinds (for styling)

Each entry carries a `kind` so the renderer can color or mark it, the way Candy
Box highlights important lines:

- `info` — neutral narration (fight start, weapon swap).
- `hit` — the can deals damage.
- `crit` — weak-point hit; render emphasized, often prefixed `>`.
- `guard` — block / parry.
- `hurt` — the can takes damage.
- `reward` — bits collected; prefixed `>` and tinted.
- `result` — victory / defeat / flee; the closing line.

### Rendering approach

Add a `pushCombatLog(text, kind)` helper that appends to `combat.log` and trims to
the cap. A `renderCombatLog()` reads the array into the scrollable element. The
existing single `game.combat.message` becomes the *latest* entry rather than the
whole readout — keep it if convenient, but the array is the source of truth.

Style a `.combatLog` class in `css/design.css`: monospace, the same border
treatment as the ASCII boxes, a fixed `max-height` (≈ 8 visible rows), and
`overflow-y: auto`. The auto-scroll is a one-liner in JS after render:
`el.scrollTop = el.scrollHeight` (guarded by the at-bottom check above).

## Movement: The Can Runs Right

There is no manual movement. The can closes the gap each tick at a fixed run
speed (`COMBAT_MOVE_STEP`). This is what makes the weapon triad matter: as the gap
shrinks, different weapons come into range.

Distance stays meaningful through **knockback**, not player control:

- A landed **sword hit** or a **weak-point crit** knocks the enemy back, re-opening
  the gap so the ranged weapon is briefly useful again.
- Enemies **lunge** to re-close, on their own timers.

The result is an in-and-out rhythm — chip from range, close in, big hit, knockback,
repeat — with the player never once steering the can. Knockback distance and lunge
speed are tunable per enemy.

## The Weapon Triad

Three weapons, all tied to items the player already earns (`slingshot`, a new
`pryBar`, `sword`). The tradeoff is monotonic: as range drops, damage and cooldown
both rise. Closing in is rewarding and exposing in equal measure.

| Slot | Weapon    | Effective range | Cooldown      | Damage | Notes                          |
|------|-----------|-----------------|---------------|--------|--------------------------------|
| Q    | Slingshot | whole arena     | 2 ticks (~0.36s) | 1–2 | Fast chip from anywhere        |
| W    | Pry Bar   | ~12–18 tiles    | 4 ticks (~0.72s) | 4–5 | Mid-range workhorse            |
| E    | Sword     | melee (`reach`) | 7 ticks (~1.3s)  | 10–12| Slow, heavy, knocks the enemy back |

A weapon only fires when the enemy is **inside its range** and its **cooldown has
elapsed**. The UI dims a weapon's icon when it's out of range, so switching is an
informed read, not a guess. Damage values seed from the existing
`COMBAT_PLAYER_DAMAGE` and `SWORD_ATTACK_BONUS`; all six numbers above are tunable.

The intended flow as the gap closes: Slingshot to soften → Pry Bar through the
mid-range → Sword on arrival → knockback resets to range. The player who fires the
last possible Pry Bar throw before swapping to the Sword is playing well.

## Targeting And Weak Points

The player aims with the number keys, numpad-spatial, exactly as a numpad reads:

```text
 7 8 9      top-left   top-center   top-right
 4 5 6      mid-left   center       mid-right
 1 2 3      bot-left   bot-center   bot-right
```

The grid is projected onto the enemy sprite's bounding box. **All three weapons
can target any zone equally** — aiming is a pure overlay on the damage model, not
differentiated per weapon. The selected zone persists until changed; default is
center (5).

Each enemy carries a **zone multiplier map**:

- **Weak zone** — bonus multiplier (e.g. x2.5). The reward for aiming.
- **Armored zone** — penalty multiplier (e.g. x0.4). Punishes lazy center-mass spam.
- **Default** — x1.0 everywhere else.

**Granularity scales to sprite size** via a `zoneMode` field:

- `"thirds"` — basic-tier sprites (3–5 lines) split into 3 zones only
  (left / center / right). Number keys 1–3 suffice.
- `"grid"` — medium-tier sprites use the full 3x3.
- Bosses may use `"grid"` plus weak points that **open and close** — only
  vulnerable during recovery windows after their own attacks.

**Discovery is the fun part.** Don't hand the player the weak zone. Hide it, then
reveal it through one of:

- A telegraph: the weak zone's glyph pulses for a beat.
- The can's voice: *"Something about its left shoulder looks soft. Or I'm projecting."*
- For bosses: the zone only opens during a recovery window, so the player learns
  the pattern rather than the map.

## Blocking And Shields

A held **brace** key raises the shield. There is no backpedal — bracing is purely
defensive, and it costs you offense.

- **Hold to brace** — incoming damage reduced (e.g. −50%) for as long as held. The
  can does not attack while bracing; weapon cooldowns pause. The cost is DPS.
- **Timed parry** — releasing the brace inside the enemy's telegraph window negates
  the hit entirely and **staggers** the enemy, briefly opening its weak zone. This
  ties the defensive layer straight into the targeting reward loop: parry → opening
  → aimed crit.
- **Guard meter (optional)** — bracing drains a guard meter that refills when not
  blocking, so perma-block isn't viable and timing matters.

Shields are equippable items (a `shieldAsset` already exists in the art files).
Different shields tune block percentage, parry window width, and guard meter size.
The existing `boots` damage reduction stacks underneath as flat passive mitigation.

## Fleeing And Defeat

The can loses when `player.health` (currently 10) hits zero — same health pool
used everywhere else. On defeat, combat ends, no reward, and the can is beaten
back to the map. Keep the existing forgiving tone: *"There is no shame in retreat."*

**Flee is available at any time.** A flee key/button ends the fight immediately
and returns to `returnScreen` / `returnView`. Fleeing forfeits the reward and
(by default) resets the enemy's HP for next time. It is never punished beyond the
lost progress — retrying is free.

## Controls

| Key            | Action                                  |
|----------------|-----------------------------------------|
| Q / W / E      | Equip Slingshot / Pry Bar / Sword       |
| 1–9 (numpad)   | Aim at zone (numpad-spatial, 1=BL, 9=TR)|
| Shift (hold)   | Brace; release in telegraph window = parry |
| F              | Flee the fight                          |

Numpad targeting is ideal on a full keyboard. On laptops the number row works with
the same spatial map (1–3 = bottom, 4–6 = mid, 7–9 = top). All bindings are
configurable; this is the recommended default scheme (left hand on weapons, right
hand on the numpad).

## The Tick Model

The 180ms `setInterval` stays the heartbeat. The shift from the current system:
**player input is state the tick reads, not events that fire attacks.** The player
sets `equippedWeapon`, `targetZone`, and `bracing`; the tick resolves them.

Each tick, in order:

1. Advance the can rightward by `COMBAT_MOVE_STEP`; recompute the gap.
2. If `bracing`, skip the player's attack (cooldowns paused). Otherwise, if the
   equipped weapon's cooldown is ready **and** the enemy is in range, deal
   `damage x zoneMultiplier(targetZone)` and reset that weapon's cooldown.
   Sword hits and crits apply knockback.
3. Resolve enemy behavior on its own timers: advance/lunge, telegraph, attack.
   If the enemy attack lands, apply `enemyDamage − blockReduction − bootsReduction`
   to `player.health`. A valid parry negates it and staggers the enemy.
4. Decrement all cooldowns and timers. Check for victory / defeat.

This is expressed as a **pure reducer** so it can be tested headless and tuned
offline before wiring to the DOM:

```js
// No DOM, no localStorage, no setInterval inside.
stepCombat(combatState, enemy, playerStats, input, tuning) -> newCombatState
// input:   { weapon: "slingshot"|"pryBar"|"sword", targetZone: 1..9, bracing: bool }
// tuning:  ranges, cooldowns, damages, knockback, multipliers — all the tweakables
```

The `setInterval` becomes a thin driver: read input state, call `stepCombat`,
render, persist. Keeping it pure is what lets you balance the triad in a scratch
harness instead of in-game.

## Feedback And Juice

The mechanics only feel good if the player can read them. Priorities:

- **Floating damage numbers** off the struck zone; weak-point hits render larger
  or flagged (`!`, `CRIT`).
- **Weapon pose swap** — the can's sprite changes per equipped weapon, so its
  current tool is always visible.
- **Out-of-range dimming** — weapon icons dim when the enemy is outside their range.
- **Enemy flinch frame** on hit; **stagger frame** on parry with the weak zone lit.
- **Attack telegraph** — a wind-up glyph or line before every enemy attack, so
  blocking and parrying feel fair rather than reactive guesswork.
- **One log line per event, not per tick.** The combat log is for notable beats
  (a crit, a parry, a knockback, the kill), always in the can's voice. Never spam
  a line every 180ms.

Avoid: reflex-tier pacing (keep the tick slow), and unflagged weak points that
force blind trial-and-error.

## Enemy Definition

New fields extend the existing `combatEnemies` shape in `js/data.js`:

```js
darkTreeWatcher: {
  id: "darkTreeWatcher",
  name: "Fox",
  maxHealth: 10,
  rewardCopperBits: 6,

  reach: 6,                 // melee range; also the sword's effective range
  knockbackResist: 0,       // 0 = full knockback, higher = sturdier

  zoneMode: "thirds",       // "thirds" for small sprites, "grid" for mid+
  weakZones: { 9: 2.5 },    // top-right is soft
  armorZones: { 1: 0.4 },   // bottom-left is plated
  weakOpensOn: null,        // boss-only: "recovery" gates the weak zone

  attack: {
    damage: 1,
    intervalTicks: 6,       // attacks every ~1.1s when in reach
    telegraphTicks: 2,      // wind-up frames before the hit (the parry window)
  },

  introText: "The fox slinks out from the dark trees, eyes fixed on you.",
  approachText: "It pads low through the dirt and closes the gap.",
  victoryText: "The fox yelps, turns tail, and vanishes into the trees.",
}
```

## Player Combat State

New fields on `createCombatState()` in `js/gameState.js`:

```js
{
  // ...existing: active, phase, enemyId, enemyHp, enemyMaxHp, playerX, enemyX,
  //              canExit, defeated, returnScreen, returnView, message, rewardCopperBits

  equippedWeapon: "slingshot",   // current Q/W/E selection
  targetZone: 5,                 // current 1–9 aim, default center
  bracing: false,                // shield held this tick
  guard: 100,                    // optional guard meter, 0–100
  cooldowns: { slingshot: 0, pryBar: 0, sword: 0 },  // ticks remaining
  enemyTelegraph: 0,             // ticks left in enemy wind-up (parry window)

  log: [],                       // [{ text, kind }] append-only history
  fightBits: 0,                  // copper earned this fight (status strip "BITS +n")
}
```

New inventory flags: `pryBar`, `shield`.

## Important Values To Tweak

| Constant / field            | Where        | Effect                                      |
|-----------------------------|--------------|---------------------------------------------|
| `COMBAT_TICK_MS`            | `data.js`    | Combat pace. 180 = deliberate. Lower = twitchier. |
| `COMBAT_MOVE_STEP`         | `data.js`    | How fast the gap closes per tick.           |
| Weapon range / cooldown / damage | tuning | The whole triad balance. Six numbers.       |
| `weakZones` / `armorZones` | per enemy    | Aiming reward and punishment multipliers.   |
| `reach`                    | per enemy    | Sword range and where the enemy can hit you.|
| `knockbackResist`          | per enemy    | How hard sword hits reset the distance.     |
| `attack.intervalTicks`     | per enemy    | Enemy aggression.                           |
| `attack.telegraphTicks`    | per enemy    | Parry window width. Wider = more forgiving. |
| Block reduction / parry negate | tuning   | Shield strength.                            |
| `guard` drain / refill     | tuning       | How permissive bracing is.                  |
| Log buffer cap             | tuning       | Max retained log entries (≈200).            |
| Log visible rows           | `design.css` | `max-height` of the scroll region (≈8 rows).|

## Integration Notes

Migrating from the current `resolveCombatTick`:

1. **Extract the reducer.** Pull the damage/movement/victory logic out of
   `resolveCombatTick` into a pure `stepCombat(...)` with no `saveGame`,
   `renderGame`, or `game` mutation inside — it takes state and returns new state.
2. **Collapse the phases.** The current `approach` → `attack` split disappears.
   There's one continuous loop; the gap and weapon ranges decide what happens,
   not a phase flag. (Keep `phase` for `idle` / `victory` / `defeat` only.)
3. **Player becomes the mover.** Today the Fox advances and the player is static.
   Flip it: the can advances right, the enemy holds and lunges.
4. **Wire input.** Add keydown handlers that write `equippedWeapon`, `targetZone`,
   and `bracing` onto combat state. The tick reads them; it never fires on the
   keypress itself.
5. **Map old items onto the triad.** `slingshot` → Q, new `pryBar` → W, `sword`
   → E. `boots` stays as flat passive mitigation under the shield's block.
6. **Throttle persistence.** The current loop writes to `localStorage` every tick.
   Save on combat end and on meaningful state changes only, not every 180ms.
7. **Split the readout.** Today `renderCombatView` packs status, arena, and one
   overwritten `message` into a single `FIGHT` box. Break it into three regions:
   the arena box, an in-place status strip, and a scrollable log fed by
   `combat.log`. Replace `message =` overwrites with `pushCombatLog(text, kind)`
   calls placed at the state transitions listed above — not in the steady tick.

## Open Decisions

A few knobs left to settle, none blocking:

- **Guard meter on or off?** Full timing-pressure (meter) vs. simpler hold-to-brace.
- **Ammo for the slingshot?** Free chip forever, or a refilling ammo pool that
  makes the ranged option a resource rather than a default.
- **Knockback vs. brace as the rhythm driver.** Both are in; tuning decides which
  dominates the feel.
- **Switch cost.** Free instant weapon swaps, or a small shared cooldown so
  swapping mid-swing has a price.

## The Can's Voice In Combat

Tone reference — dry, deadpan, faintly put-upon:

- On a miss: *"I threw a rivet. It bounced off. Humiliating for one of us."*
- On a crit: *"Found the soft spot. It did not enjoy that."*
- On a parry: *"Caught it on the shield. We're both surprised."*
- On taking a hit: *"That'll dent. I'm mostly dents at this point."*
- On fleeing: *"Strategic. Definitely strategic."*
- On victory: *"Still a can. Still standing. Low bar, cleared."*