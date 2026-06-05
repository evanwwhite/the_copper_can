import { game } from "./gameState.js";
import { SAVE_KEY } from "./data.js";

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
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export function loadGame() {
  const rawSave = localStorage.getItem(SAVE_KEY);

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
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}