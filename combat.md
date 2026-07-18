# Combat Design — Scene Combat

## Status

This document is the source of truth for active combat development.

Combat takes place inside the same horizontally walkable ASCII scenes used for
exploration. New combat work belongs in:

- `js/sceneCombatCore.js` — headless movement, targeting, attacks, defense, and
  enemy state machines.
- `js/sceneCombatData.js` — weapon, stance, enemy, and timing definitions.
- `js/render/walkScreen.js` — scene composition, combat HUD, controls, and
  animation selection.

`js/combatCore.js` and `js/render/combatView.js` are the deprecated arena-combat
prototype. They remain temporarily for save compatibility and reference, but
must not receive new mechanics or content.

## Combat Pitch

Combat is a slow, readable spacing game about deciding **when to advance, when
to hold position or retreat, and which of three weapon stances to ready**.

The player does not press an attack button. The readied weapon attacks
automatically whenever a living enemy in front of the player is inside that
weapon's valid range and the weapon is ready. Enemies use their own ranges and
telegraphed attack clocks. Positioning therefore decides which side is able to
attack and which risks being hit.

The player's deliberate inputs are:

- Move left or right.
- Stop moving and hold position.
- Switch among the Q, W, and E weapon stances.
- Use the equipped shield or defensive item when the current stance permits it.

## Core Loop

1. Read the enemies ahead: their silhouettes, distance, movement, and attack
   telegraphs.
2. Select the stance whose range, damage, and defensive tradeoff fit the threat.
3. Advance until the chosen weapon can attack, or hold back and let an enemy
   enter its range.
4. The weapon auto-attacks while its target remains in range. Its cooldown and
   recovery still matter; automatic does not mean continuous damage every tick.
5. Move, switch stance, or time a defense before the enemy's telegraphed hit.
6. Defeat the formation, collect its rewards, and continue through the scene.

The intended skill is planning and spacing, not repeatedly pressing an attack
button or aiming individual swings.

## Time and Movement

Combat runs in real time on the scene tick. Enemy movement, telegraphs,
cooldowns, and attacks continue while the player waits or switches equipment.
The pace should remain slow enough that silhouettes and `[!]` telegraphs can be
read reliably.

Movement is horizontal. The player may:

- advance to bring a short-range stance into play;
- hold position to preserve a favorable range;
- retreat to create space, avoid a heavy hit, or buy time for a cooldown.

Living ground enemies block the player from walking through them. Airborne
enemies may use a separate render/target lane, but the player does not move
vertically.

## Automatic Attacks

The currently readied stance continuously looks for the nearest valid living
target in front of the player. An automatic attack begins only when:

- the target is inside the weapon's minimum and maximum range;
- the weapon's cooldown and recovery have finished;
- the player is not hurt or committed to an incompatible defensive action;
- the stance has any required resource, such as slingshot ammunition.

Melee attacks resolve against their selected target. Projectiles travel through
the scene and hit the first valid enemy in their lane. When no target is in the
weapon's range, the player holds the weapon ready rather than swinging at empty
air.

Enemies independently attack when the player is within their reach and their
attack clock completes. A player weapon being out of range does not prevent an
enemy from attacking.

## The Three Stances

Q, W, and E are combat stance slots, not four or more individual weapon
hotkeys. The item or item combination equipped into each stance determines its
exact damage, range, animation, and defensive options.

### Q — Long Range

The initial Q stance is the **slingshot**.

- Uses both hands.
- Has the longest player attack range.
- Deals less damage than melee alternatives.
- Consumes ammunition.
- Cannot use a shield while readied because both hands are occupied.
- Best for softening or defeating enemies before they can close the distance.

Running out of ammunition stops its automatic attacks. Ammo recovery or refill
rules remain a tuning decision, but the current ammo count must always be
visible in combat.

### W — One-Handed Pairing

W readies a combination of one-handed items. The baseline pairing is **sword
and shield**; future pairings may combine another one-handed weapon, shield,
tool, or defensive item.

- Deals reliable close-range damage.
- Keeps the off hand available.
- Supports active defense when a shield is equipped.
- Trades the raw damage and reach of the E stance for protection and
  flexibility.

This is the only baseline stance that can block with a shield. A correctly
timed defense reduces part of an incoming telegraphed hit. Poor timing leaves
the player exposed or spends a limited guard resource without preventing the
full attack.

The exact input window—hold-to-guard, timed press, or press/release timing—will
be finalized during the defense polish pass. The invariant is that defense is
active and timed, not a permanent passive reduction from merely owning a
shield.

### E — Heavy Two-Handed

E readies one heavy two-handed weapon, initially a **two-handed sword or
spear**, depending on the equipped loadout.

- Deals more damage than the W pairing.
- May offer greater reach, armor penetration, stagger, or knockback.
- Has longer attack recovery.
- Cannot use a shield while readied.
- Usually exposes the player to more damage if the attack is mistimed or the
  enemy survives the commitment.

The two-handed sword and spear should feel distinct even though they share the
E stance: the sword favors damage and impact, while the spear favors reach and
spacing.

## Weapons Are Always Visible

Inside a combat scene, the player's currently readied weapon or item pairing is
drawn at all times—not only during an attack frame. Walking, standing, attacking,
recovering, blocking, and being hurt each use a pose that preserves the current
equipment silhouette.

Changing Q/W/E should immediately change the player's visible pose. This gives
the stance choice a readable physical presence and lets the player verify the
active loadout without relying only on HUD text.

Outside combat, exploration may continue to use the ordinary walk cycle.

## Enemy Behavior and Telegraphs

Each enemy definition controls:

- awareness/aggro range;
- movement speed and collision size;
- attack reach and damage;
- telegraph, active, return, and recovery timings;
- defense and weapon/stance matchups;
- reward and optional story flag.

An enemy approaches until the player is in its attack range, visibly
telegraphs, attacks, returns to its origin, and recovers. The telegraph must be
long and visually clear enough to support a weapon switch, retreat, or timed
shield response.

Different enemy types should create positioning questions rather than only
larger health totals. Examples include fast short-range enemies, armored enemies
that reward a committed E attack, and airborne enemies best handled by Q.

## Damage and Failure

Wrong positioning or an ill-timed stance switch should normally cost health,
not cause an instant loss. Longer E recovery can increase incoming damage, W
can trade damage for safety, and Q can trade ammunition and lower damage for
distance.

On defeat, the existing scene flow may return the player to safety and restore
health according to whether the encounter is practice or story content.

## Inventory Contract Required by Combat

Inventory work must distinguish three states:

1. **Owned** — the item exists in the Pack.
2. **Equipped to a stance or equipment slot** — the item is available to the
   combat loadout.
3. **Readied** — Q, W, or E is the stance currently active in the scene.

The Pack determines which items occupy Q, W, E, armor, and defensive slots.
Combat reads that prepared loadout and does not silently make every owned weapon
available. If a required stance has no valid equipped item, its combat control
is unavailable. A safe unarmed fallback must prevent progression dead ends.

Equipment cannot be rearranged from the Pack while a real-time combat scene is
active. Switching Q/W/E only readies a prepared stance; it does not change the
underlying inventory loadout.

## Implementation Status

Implemented in the first correct combat slice:

- Valid attacks happen automatically in `sceneCombatCore.js`.
- Q/W/E replace the former four weapon hotkeys; repeating E cycles prepared
  heavy-sword and spear styles.
- Shared equipment and stance selectors live in `sceneCombatData.js`.
- The readied weapon remains visible while a live encounter is in the scene.
- Owned, equipped, and readied behavior is connected through the Pack and save
  migration, with fists as the safe fallback.
- Headless tests cover the Fox, Iron Shell, Wire Magpie, rewards, timing, and
  save/resume behavior.

The next pass should polish telegraphs, shield timing, cooldown feedback, and
stance balance.

## Resolved Decisions

- Active architecture: horizontally walkable scene combat.
- Player attacks: automatic when a valid target is in the readied weapon's
  range and the weapon is ready.
- Player decisions: advance, hold, retreat, choose Q/W/E, and time defense.
- Stances: Q long-range two-handed, W one-handed pairing, E heavy two-handed.
- Baseline Q item: slingshot with ammunition and lower damage.
- Baseline W pairing: sword and shield with timed damage reduction.
- Baseline E items: two-handed sword or spear with stronger offense and greater
  exposure.
- Presentation: the current weapon or pairing remains visible throughout combat.
- Legacy arena combat: deprecated; no new work goes into it.

## Open Tuning Questions

- Exact automatic attack cadence for each stance.
- Whether switching stance resets, pauses, or preserves an attack cooldown.
- Whether slingshot ammunition regenerates during combat, refills between
  encounters, or comes from inventory.
- Exact shield timing input and guard-resource behavior.
- Whether W supports two offensive one-handed items as well as weapon/shield.
- How the Pack selects between a two-handed sword and spear for E.
- How much retreat is limited by enemy speed, scene boundaries, or recovery.
- Whether an enemy already inside its attack range should continue tracking a
  retreating player during its telegraph.
