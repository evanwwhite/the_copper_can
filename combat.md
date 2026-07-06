# Combat Design — Lane Sequencing

A rewrite of combat from a 1v1 duel into a **deliberate reading puzzle**: the
player advances rightward down a lane, facing a formation of enemies, and the
skill is solving the **order** to kill them given weapon switch costs and shared
spacing.

## Core loop

The player controls a character in a lane wider than the normal screen, made of
**a few vertical rows** (2–3). The character does **not** auto-run; the player
**chooses when to advance** (a discrete, telegraphed "step in") and which **row**
to occupy. The extra screen width is the **reaction runway** — enemies are
visible and identifiable well before they are in kill range, giving the player
time to read the formation and plan.

The player does **not** swing manually: the equipped weapon **auto-attacks**
whatever is in its range. The player's inputs are therefore **weapon choice,
position (row + advance), and active defense** — not individual swings. This
keeps the focus on sequencing and spacing rather than attack timing.

The one-sentence pitch of the skill: **read the formation, plan the kill order,
pick your weapon and row, and defend while the auto-attack does the work.**

## Time model — real-time, slow clocks

Enemy clocks tick on a **real timer**, but slowly enough to read and plan.
Dithering costs you (enemies keep advancing/firing), but there is no twitch
pressure. This needs a running tick loop, not a turn queue. Menus/weapon-swaps
do **not** pause time — committing to a switch mid-fight is itself a decision.

## The decision

Enemies are **obvious** (type read at a glance from far away). The hard part is
**sequencing** — what order to kill them, which weapon for each, and when to
advance. For that to be the fun, four things must hold:

1. **Switching costs something** — else order is free and there is no puzzle.
2. **Position is shared** — where you stand is good for some threats and bad for
   others *at the same time*. Killing one enemy changes whether your position is
   survivable for the rest.
3. **Threats are on visible clocks** — each enemy shows when it will act, so the
   player can plan a sequence that beats every clock.
4. **Advancing is a commitment** — closing on one enemy walks you into another's
   range. Retreat is possible but expensive.

## Weapons

Hybrid rule: **weakness decides what kills, range decides where it's safe.**

| Weapon  | Kills (weakness)                              | Owns range   | Switch-in | Rhythm / role                        |
|---------|-----------------------------------------------|--------------|-----------|--------------------------------------|
| Sword   | Sword-enemies; finishes wounded spear-enemies | Point-blank  | Fast      | Quick, repeatable — the **closer**   |
| Spear   | Spear-enemies (out-reaches); holds swords out | Mid/keep-away| Medium    | Slow wind-up thrust — the **spacer** |
| Ranged  | Ranged-enemies; softens anything approaching  | Far          | Slow      | Limited ammo — the **opener**        |

Ideal rhythm reads *ranged (opener) → spear (spacer) → sword (closer)*. Good
formations deliberately scramble that ideal order; switch cost punishes going
out of rhythm.

## Spacing model

The lane is discrete **range bands** from the player: `MELEE (0)`, `NEAR (1)`,
`MID (2)`, `FAR (3)`. Every enemy sits in a band. Advancing shifts the field one
band closer. Each enemy is **only dangerous, and only killable, in specific
bands**:

- **Sword-enemy** — harmless at MID/FAR, lethal at MELEE. Weak to spear at NEAR,
  so kill it before it closes.
- **Spear-enemy** — dangerous at NEAR (thrust reach), safe to *finish* at MELEE
  with a sword once softened. Walking past its thrust is the risk.
- **Ranged-enemy** — dangerous at FAR/MID (firing), trivial at MELEE, but usually
  sits *behind* the melee wall, so you can't reach it without solving the front.

This makes position tension automatic: advancing to finish one enemy pulls the
others into worse ranges for you.

## Rows (vertical positioning)

The lane has 2–3 **rows**. Rules:

- The equipped weapon **auto-attacks only the player's current row**. You can
  fight one row at a time.
- Row changes are **free and instant** — flicking between rows to service a
  different threat costs nothing.
- Enemies occupy **fixed rows** (only their distance changes as they advance),
  so formations are authorable, readable puzzles.

The emergent game is **attention allocation**: while you service one row, the
others' clocks keep ticking. Because row-swap is free but weapon-swap costs a
beat, and each row may hold a different enemy type, optimal play is to **batch by
weapon** — clear everything your current weapon counters across all rows, then
pay the one switch cost and clear the next type. That is the sequencing puzzle in
real time.

## Enemy types

Read at a glance by **silhouette**, not detail:

- **Spear** — long horizontal reach. Slow. Lunges/thrusts.
- **Sword** — compact, forward-leaning. Fast, closes distance.
- **Ranged** — held-back/upright pose. Stays back, fires down the lane.

Each shows a **clock** (reuse the old `enemyTelegraph` idea, per enemy): a count
until its next action, so the player can read and plan against it.

## Commitment

Advance is a discrete, telegraphed action: it moves the player one band and
takes a beat during which the player cannot attack — the formation's clocks tick
while stepping. Retreat is possible but costs more beats than advancing, so
backing out of a bad plan hurts (but never fully stalls the fight).

## Active defense

Defense is **positional + active**. Positioning (right range, right row, killing
threats in order) is the primary layer, but the player also keeps an active
**brace/parry** tool (reuse the old brace system): hold to guard, release to
parry a telegraphed hit. This adds a reflex tool for when a plan goes wrong,
without replacing the sequencing focus.

## Failure model — forgiving

A wrong sequence or a mistimed weapon switch does **not** cause instant loss. It
just gives enemies **more time to advance and deal more chip damage.** This lets
players learn matchups by experimenting. Reading puzzles want the forgiving end.

## Difficulty curve

Only **two knobs**: enemy count and type variety. They map onto the two skills.

- **Tier 1 — one type, few enemies.** Teach a single matchup in isolation
  (identity + spacing). No sequencing yet.
- **Tier 2 — one type, many enemies.** Same matchup as a conveyor. Teach rhythm
  and switch cost under volume.
- **Tier 3 — two types mixed.** First real sequencing puzzle: two clocks, one
  position, pick the order.
- **Tier 4+ — all three, larger formations.** Full puzzle; count scales pressure.

No stat inflation needed — count and variety carry the whole curve.

## Worked example (the fun test)

Formation from the player: **Sword-rusher at MID**, **Spear-guy at NEAR**,
**Archer at FAR** (behind both).

- Archer fires in 3 beats. Sword-rusher advances 1 band / 2 beats, lethal at
  MELEE. Spear-guy thrusts anyone entering NEAR/MELEE from the front.

*Naive solve* ("stab the closest, the spear-guy") fails: the medium spear
switch-in lets the rusher close and the archer fire — you eat two hits.

*Intended solve:* open **ranged** on the archer (kill the back clock before it
fires) → switch **spear**, hold the rusher out at NEAR (spacer kills it) →
switch **sword** (cheap swap) and advance to MELEE to finish the wounded
spear-guy safely, since nothing is left to punish the step-in.

If a formation has a clean solvable order like this — plus tempting-but-punishing
alternatives — the design works. Encounter design = authoring such formations.

## Migration notes (from current code)

Reuse:
- `getRangeBand` / `getGap` → generalize to per-enemy bands.
- `enemyTelegraph` → per-enemy clocks (the thing the player reads).
- Weapon slots + hotkeys + `setCombatWeapon` → keep, add switch-in cost.

Replace:
- Single-enemy state (`enemyHp`, `enemyX`, one telegraph) → `enemies: [...]`
  each with type, band, hp, and clock.
- `combatView.js` renders a scrolling slice of the wide lane instead of one duel.

## Resolved decisions

- Time: real-time, slow clocks (no pause on menus/swaps).
- Attack: auto-attack whatever's in the equipped weapon's range.
- Defense: positional + active brace/parry.
- Lane: 2–3 fixed rows; weapon hits current row only; row-swap free/instant;
  weapon-swap costs a beat.

## Open questions (tuning / still to decide)

- Exact beat/clock timings per enemy and weapon switch-in cost (tuning pass).
- Retreat cost: fixed extra beats, or limited retreats per fight?
- Does advancing move the player or pull the field? (Same math; pick for feel.)
- Win condition: clear the formation, reach the lane's end, or a boss/objective?
- Do enemies advance toward the player on their own, or only when the player
  advances? (With real-time clocks, "advance on a timer" is the natural default.)
- Ranged ammo economy: refill between fights, mid-lane pickups, or hard budget?
- Weapon access: start with all three, or unlock across tiers?
- Rewards: reuse the existing copper-bits economy (`fightBits`, rewards)?
