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
];

export const combatEnemies = {
  darkTreeWatcher: {
    id: "darkTreeWatcher",
    name: "Rusty Iron Sign",
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
    introText: "The old sign groans as the magnet drags you closer.",
    approachText: "It scrapes left through the dirt and closes the gap.",
    attackText: "You swing first. Rust and dust shake loose.",
    victoryText: "The sign buckles, and the magnet finally goes still.",
  },
};
