export const BENT_MAGNET_COST = 15;
export const BEEHIVE_UNLOCK_AMOUNT = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SAVE_KEY = "theCopperCanPrototypeSave";
export const LEGACY_SAVE_KEYS = ["bitsBoxPrototypeSave"];
export const COMBAT_ARENA_WIDTH = 98;
export const COMBAT_ARENA_HEIGHT = 16;
export const COMBAT_TICK_MS = 180;
export const COMBAT_MOVE_STEP = 2;
export const COMBAT_PLAYER_DAMAGE = 2;

export const items = {
  copperCan: {
    id: "copperCan",
    name: "Copper Can",
    description: "A small oxidized copper can.",
  },

  bentMagnet: {
    id: "bentMagnet",
    name: "Bent Magnet",
    description: "It's weak, rusty, and slightly rude.",
    cost: {
      copperBits: BENT_MAGNET_COST,
    },
    copperBitsPerSecond: 1,
  },
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
    isUnlocked: game => game.hasUnlockedCopperCan,
  },
  {
    id: "throwingBits",
    text: "Throwing bits away is possible. That feels important.",
    isUnlocked: game => game.copperBits >= 3,
  },
  {
    id: "buriedMagnet",
    text: "Something was buried near the can.",
    isUnlocked: game => game.hasInvestigatedMagnet,
  },
  {
    id: "bentMagnetPulls",
    text: "The bent magnet pulls bits toward you.",
    isUnlocked: game => game.hasBentMagnet,
  },
  {
    id: "forestPlaces",
    text: "The forest has places. Places mean choices.",
    isUnlocked: game => game.hasUnlockedMap,
  },
];

export const locations = {
  copperCan: {
    id: "copperCan",
    name: "Copper Can",
    description: "The place where the bits began.",
  },

  darkTrees: {
    id: "darkTrees",
    name: "Dark Trees",
    description: "The dark trees do not move, but they notice you.",
  },
};

export const combatEnemies = {
  darkTreeWatcher: {
    id: "darkTreeWatcher",
    name: "Dark Tree Watcher",
    maxHealth: 10,
    attackDamage: 1,
    rewardCopperBits: 6,
    approach: {
      mover: "enemy",
      direction: "left",
      step: COMBAT_MOVE_STEP,
      supportStep: COMBAT_MOVE_STEP,
      stopDistance: 8,
    },
    introText: "Something slender unhooks itself from the trees.",
    approachText: "It lurches left through the brush and closes the gap.",
    attackText: "You swing first. Bark and dust shake loose.",
    victoryText: "The watcher buckles and the trees go still again.",
  },
};
