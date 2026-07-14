import {
  createCombatState,
  createInitialGameState,
  createWalkState,
  game,
  SAVE_VERSION,
} from "./gameState.js";
import { LEGACY_SAVE_KEYS, SAVE_KEY } from "./data.js";

const SAVE_GROUP_KEYS = [
  "world",
  "currencies",
  "player",
  "inventory",
  "unlocks",
  "flags",
];

function mergeDefined(defaults, values = {}) {
  const mergedValues = { ...defaults };

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) {
      mergedValues[key] = value;
    }
  });

  return mergedValues;
}

function migrateLegacySaveData(saveData) {
  if (SAVE_GROUP_KEYS.some((key) => saveData[key])) {
    return saveData;
  }

  return {
    saveVersion: SAVE_VERSION,
    world: {
      screen: saveData.screen,
      currentView: saveData.currentView,
      nextScreenAfterTitleReveal: saveData.nextScreenAfterTitleReveal,
    },
    currencies: {
      copper: saveData.copperBits,
      silver: saveData.silverBits,
      gold: saveData.goldBits,
    },
    player: {
      health: saveData.health,
      maxHealth: saveData.maxHealth,
    },
    inventory: {
      copperCan: saveData.hasCopperCan,
      bentMagnet: saveData.hasBentMagnet,
      map: saveData.hasMap,
      bentMagnetBitsPerSecond: saveData.bentMagnetBitsPerSecond,
    },
    unlocks: {
      copperCan: saveData.hasUnlockedCopperCan,
      pack: saveData.hasUnlockedPack,
      thoughts: saveData.hasUnlockedThoughts,
      map: saveData.hasUnlockedMap,
      save: saveData.hasUnlockedSave,
      settings: saveData.hasUnlockedSettings,
      silverBits: saveData.hasUnlockedSilverBits,
      goldBits: saveData.hasUnlockedGoldBits,
    },
    flags: {
      investigatedMagnet: saveData.hasInvestigatedMagnet,
      disturbedBeehive: saveData.hasDisturbedBeehive,
      reachedWoodedPath: saveData.hasReachedWoodedPath,
      seenTitleReveal: saveData.hasSeenTitleReveal,
      refusedCopperCan: saveData.hasRefusedCopperCan,
      ignoredCopperCan: saveData.hasIgnoredCopperCan,
      acceptedDarkForestChallenge: saveData.hasAcceptedDarkForestChallenge,
      defeatedDarkTreeWatcher: saveData.hasDefeatedDarkTreeWatcher,
      receivedVillageMap: saveData.hasReceivedVillageMap,
    },
    lastMessage: saveData.lastMessage,
    combat: saveData.combat,
  };
}

export function hydrateGameState(saveData = {}) {
  const defaults = createInitialGameState();
  const migratedSaveData = migrateLegacySaveData(saveData);
  const hydratedState = {
    ...defaults,
    saveVersion: SAVE_VERSION,
    lastMessage: migratedSaveData.lastMessage ?? defaults.lastMessage,
    combat: mergeDefined(createCombatState(), migratedSaveData.combat),
    walk: mergeDefined(createWalkState(), migratedSaveData.walk),
  };

  // Saves from the brief pry-bar era: map the renamed weapon onto the spear.
  if (!["slingshot", "spear", "sword"].includes(hydratedState.combat.equippedWeapon)) {
    hydratedState.combat.equippedWeapon = "spear";
  }
  hydratedState.combat.cooldowns = {
    slingshot: 0,
    spear: 0,
    sword: 0,
    ...Object.fromEntries(
      Object.entries(hydratedState.combat.cooldowns ?? {}).filter(
        ([key]) => ["slingshot", "spear", "sword"].includes(key),
      ),
    ),
  };

  SAVE_GROUP_KEYS.forEach((key) => {
    hydratedState[key] = mergeDefined(defaults[key], migratedSaveData[key]);
  });

  // Saves made before equippable gear existed have no *Equipped flags. Default
  // each to whether the item is owned so existing gear keeps working in combat.
  const rawInventory = migratedSaveData.inventory ?? {};
  ["slingshot", "boots", "sword", "spear"].forEach((itemKey) => {
    const equippedKey = `${itemKey}Equipped`;
    if (rawInventory[equippedKey] === undefined) {
      hydratedState.inventory[equippedKey] = hydratedState.inventory[itemKey];
    }
  });

  return hydratedState;
}

export function serializeGameState(state = game) {
  const hydratedState = hydrateGameState(state);
  const saveData = {
    saveVersion: SAVE_VERSION,
    lastMessage: hydratedState.lastMessage,
    combat: { ...hydratedState.combat },
    walk: { ...hydratedState.walk },
  };

  SAVE_GROUP_KEYS.forEach((key) => {
    saveData[key] = { ...hydratedState[key] };
  });

  return saveData;
}

export function saveGame() {
  const saveData = serializeGameState();

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

  LEGACY_SAVE_KEYS.forEach((legacyKey) => {
    if (legacyKey !== SAVE_KEY) {
      localStorage.removeItem(legacyKey);
    }
  });
}

function getStoredSave() {
  const primarySave = localStorage.getItem(SAVE_KEY);

  if (primarySave) {
    return primarySave;
  }

  for (const legacyKey of LEGACY_SAVE_KEYS) {
    const legacySave = localStorage.getItem(legacyKey);

    if (legacySave) {
      return legacySave;
    }
  }

  return null;
}

export function loadGame() {
  const rawSave = getStoredSave();

  if (!rawSave) return;

  try {
    const saveData = JSON.parse(rawSave);

    Object.assign(game, hydrateGameState(saveData));

    if (game.world.currentView === "combat" && !game.combat.active) {
      game.world.screen = game.combat.returnScreen ?? "game";
      game.world.currentView = game.combat.returnView ?? "map";
    }
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);

  LEGACY_SAVE_KEYS.forEach((legacyKey) => {
    if (legacyKey !== SAVE_KEY) {
      localStorage.removeItem(legacyKey);
    }
  });
}
