import { createCombatState, game } from "./gameState.js";
import { LEGACY_SAVE_KEYS, SAVE_KEY } from "./data.js";

export function saveGame() {
  const saveData = {
    screen: game.screen,
    currentView: game.currentView,

    copperBits: game.copperBits,
    silverBits: game.silverBits,
    goldBits: game.goldBits,
    hasUnlockedSilverBits: game.hasUnlockedSilverBits,
    hasUnlockedGoldBits: game.hasUnlockedGoldBits,

    health: game.health,
    maxHealth: game.maxHealth,

    hasCopperCan: game.hasCopperCan,
    hasBentMagnet: game.hasBentMagnet,
    hasInvestigatedMagnet: game.hasInvestigatedMagnet,
    hasDisturbedBeehive: game.hasDisturbedBeehive,
    bentMagnetBitsPerSecond: game.bentMagnetBitsPerSecond,

    hasUnlockedCopperCan: game.hasUnlockedCopperCan,
    hasUnlockedPack: game.hasUnlockedPack,
    hasUnlockedThoughts: game.hasUnlockedThoughts,
    hasUnlockedMap: game.hasUnlockedMap,
    hasUnlockedSave: game.hasUnlockedSave,
    hasUnlockedSettings: game.hasUnlockedSettings,

    hasSeenTitleReveal: game.hasSeenTitleReveal,

    hasRefusedCopperCan: game.hasRefusedCopperCan,
    hasIgnoredCopperCan: game.hasIgnoredCopperCan,

    lastMessage: game.lastMessage,
    combat: game.combat,
  };

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

    game.screen = saveData.screen ?? "intro";
    game.currentView = saveData.currentView ?? "can";

    game.copperBits = saveData.copperBits ?? 0;
    game.silverBits = saveData.silverBits ?? 0;
    game.goldBits = saveData.goldBits ?? 0;
    game.hasUnlockedSilverBits = saveData.hasUnlockedSilverBits ?? false;
    game.hasUnlockedGoldBits = saveData.hasUnlockedGoldBits ?? false;

    game.health = saveData.health ?? 10;
    game.maxHealth = saveData.maxHealth ?? 10;

    game.hasCopperCan = saveData.hasCopperCan ?? false;
    game.hasBentMagnet = saveData.hasBentMagnet ?? false;
    game.hasInvestigatedMagnet = saveData.hasInvestigatedMagnet ?? false;
    game.hasDisturbedBeehive = saveData.hasDisturbedBeehive ?? false;
    game.bentMagnetBitsPerSecond = saveData.bentMagnetBitsPerSecond ?? 1;

    game.hasUnlockedCopperCan = saveData.hasUnlockedCopperCan ?? false;
    game.hasUnlockedPack = saveData.hasUnlockedPack ?? false;
    game.hasUnlockedThoughts = saveData.hasUnlockedThoughts ?? false;
    game.hasUnlockedMap = saveData.hasUnlockedMap ?? false;
    game.hasUnlockedSave = saveData.hasUnlockedSave ?? false;
    game.hasUnlockedSettings = saveData.hasUnlockedSettings ?? false;

    game.hasSeenTitleReveal = saveData.hasSeenTitleReveal ?? false;

    game.hasRefusedCopperCan = saveData.hasRefusedCopperCan ?? false;
    game.hasIgnoredCopperCan = saveData.hasIgnoredCopperCan ?? false;

    game.lastMessage = saveData.lastMessage ?? "";
    game.combat = {
      ...createCombatState(),
      ...(saveData.combat ?? {}),
    };

    if (game.currentView === "combat" && !game.combat.active) {
      game.currentView = game.combat.returnView ?? "map";
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
