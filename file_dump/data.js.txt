export const BENT_MAGNET_COST = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SAVE_KEY = "bitsBoxPrototypeSave";

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