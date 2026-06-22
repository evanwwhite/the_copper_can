export const BENT_MAGNET_COST = 15;
export const BEEHIVE_UNLOCK_AMOUNT = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SLINGSHOT_COST = 15;
export const BOOTS_COST = 12;
export const SWORD_COST = 20;
export const INN_REST_COST = 5;
export const SWORD_ATTACK_BONUS = 2;
export const BOOTS_DAMAGE_REDUCTION = 1;
export const SLINGSHOT_APPROACH_DAMAGE = 1;
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
  darkTreeWatcher: {
    id: "darkTreeWatcher",
    name: "Fox",
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
    introText: "The fox slinks out from the dark trees, eyes fixed on you.",
    approachText: "It pads low through the dirt and closes the gap.",
    attackText: "You strike first. The fox snarls and bares its teeth.",
    victoryText: "The fox yelps, turns tail, and vanishes into the trees.",
  },
};
