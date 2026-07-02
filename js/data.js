export const BENT_MAGNET_COST = 15;
export const BEEHIVE_UNLOCK_AMOUNT = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SLINGSHOT_COST = 15;
export const BOOTS_COST = 12;
export const SWORD_COST = 20;
export const SPEAR_COST = 16;
export const INN_REST_COST = 5;
export const SWORD_ATTACK_BONUS = 1;
export const BOOTS_DAMAGE_REDUCTION = 1;
export const SLINGSHOT_APPROACH_DAMAGE = .5;
export const SLINGSHOT_TICK_INTERVAL = 7;
export const SWORD_TICK_INTERVAL = 5;
export const SAVE_KEY = "theCopperCanPrototypeSave";
export const LEGACY_SAVE_KEYS = ["bitsBoxPrototypeSave"];
export const COMBAT_ARENA_WIDTH = 98;
export const COMBAT_ARENA_HEIGHT = 16;
// 90ms tick with 1-column steps renders the same real-world pace as the
// combat.md 180ms/2-column baseline, just twice as smooth. All tick-count
// tuning below is authored against the 90ms tick (double the doc's numbers).
export const COMBAT_TICK_MS = 90;
export const COMBAT_MOVE_STEP = 1;
export const COMBAT_PLAYER_DAMAGE = 1;

// Every balance lever for the active combat system in one place. See
// combat.md ("Tuning Reference") for what each knob does.
export const COMBAT_TUNING = {
  moveStep: COMBAT_MOVE_STEP,
  braceMoveMultiplier: 0.5,

  // Weapon bands are [minGap, maxGap]. The sword's ceiling is per-enemy
  // (`reach`), so its band max here is a fallback.
  weapons: {
    slingshot: {
      label: "Slingshot",
      band: [0, COMBAT_ARENA_WIDTH],
      cooldownTicks: 4, // ~0.36s
      damage: [1, 2],
      usesAmmo: true,
      knockback: false,
    },
    spear: {
      label: "Spear",
      band: [0, 20],
      cooldownTicks: 8, // ~0.72s
      damage: [4, 5],
      usesAmmo: false,
      knockback: false,
    },
    sword: {
      label: "Sword",
      band: [0, 6], // max is replaced by the enemy's reach at runtime
      cooldownTicks: 14, // ~1.3s
      damage: [10, 12],
      usesAmmo: false,
      knockback: true,
    },
  },

  slingshotAmmoMax: 5,
  slingshotRegenTicks: 28,

  // Keep >= ~4x the per-tick closing speed or the in-and-out rhythm
  // collapses (combat.md).
  baseKnockback: 12,

  blockReduction: 0.5,
  guardMax: 100,
  guardDrainPerTick: 11,
  guardRefillPerTick: 6,

  midBandMax: 20, // gap <= this (and > reach) is the mid band

  logCap: 200,
};

export const thoughts = [
  {
    id: "refusedBit",
    text: "You chose not to pick up a copper bit.",
    isUnlocked: () => true,
  },
  {
    id: "choiceCost",
    text: "That choice cost you 10 copper bits.",
    isUnlocked: () => true,
  },
  {
    id: "canIgnored",
    text: "There is a copper can in the forest, and it does not like being ignored.",
    isUnlocked: () => true,
  },
  {
    id: "copperBitsMatter",
    text: "Copper bits matter. Probably.",
    isUnlocked: game => game.unlocks.copperCan,
  },
  {
    id: "throwingBits",
    text: "Throwing bits away is possible. That feels important.",
    isUnlocked: game => game.currencies.copper >= 3,
  },
  {
    id: "buriedMagnet",
    text: "Something was buried near the can.",
    isUnlocked: game => game.flags.investigatedMagnet,
  },
  {
    id: "bentMagnetPulls",
    text: "The bent magnet pulls bits toward you.",
    isUnlocked: game => game.inventory.bentMagnet,
  },
  {
    id: "forestPlaces",
    text: "The forest has places. Places mean choices.",
    isUnlocked: game => game.flags.reachedWoodedPath,
  },
  {
    id: "acceptedChallenge",
    text: "You agreed to cross the river and face whatever haunts the village. It sounded braver in the moment.",
    isUnlocked: game => game.flags.acceptedDarkForestChallenge,
  },
  {
    id: "onlyAFox",
    text: "All that dread out past the dark trees, and it was a fox. Just a fox. You almost feel cheated out of a real monster.",
    isUnlocked: game => game.flags.defeatedDarkTreeWatcher,
  },
  {
    id: "heroOverAFox",
    text: "The village handed you their oldest map and called you a hero. A whole town, grateful, over one small fox.",
    isUnlocked: game => game.flags.receivedVillageMap,
  },
];

export const combatEnemies = {
  // Basic tier: thirds zones, no armor, discover reveal.
  darkTreeWatcher: {
    id: "darkTreeWatcher",
    name: "Fox",
    maxHealth: 10,
    rewardCopperBits: 6,

    reach: 6,
    knockbackResist: 0,

    zoneMode: "thirds", // keys collapse to column: 1/4/7=L, 2/5/8=C, 3/6/9=R
    weakZoneModel: "discover", // first parry reveals, then permanent
    weakZones: { 3: 2.5 }, // right column is soft

    attack: {
      damage: 1,
      intervalTicks: 12,
      telegraphTicks: 6,
      staggerTicks: 6,
    },

    introText: "The fox slinks out from the dark trees, eyes fixed on you.",
    approachText: "It pads low through the dirt and closes the gap.",
    victoryText: "The fox yelps, turns tail, and vanishes into the trees.",
  },

  // Medium tier: full grid, armor adjacent to weak, discover reveal.
  boneRattle: {
    id: "boneRattle",
    name: "Skeleton",
    maxHealth: 22,
    rewardCopperBits: 14,

    reach: 6,
    knockbackResist: 1,

    zoneMode: "grid",
    weakZoneModel: "discover",
    weakZones: { 9: 2.5 }, // top-right (the exposed skull) is soft
    armorZones: { 6: 0.4 }, // fat-finger 9 -> 6 and you glance off bone

    attack: {
      damage: 2,
      intervalTicks: 10,
      telegraphTicks: 4,
      staggerTicks: 6,
    },

    introText: "It clatters upright, rebuilding itself one bad idea at a time.",
    approachText: "It rattles forward, all elbows.",
    victoryText: "It comes apart into a pile of parts and grievances.",
  },
};
