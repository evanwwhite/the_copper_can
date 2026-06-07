export function createCombatState() {
  return {
    active: false,
    phase: "idle",
    enemyId: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    playerX: 2,
    enemyX: 58,
    canExit: false,
    returnView: "map",
    message: "",
    rewardCopperBits: 0,
  };
}

export const game = {
  screen: "intro",
  currentView: "can",

  copperBits: 0,
  silverBits: 0,
  goldBits: 0,
  hasUnlockedSilverBits: false,
  hasUnlockedGoldBits: false,

  health: 10,
  maxHealth: 10,

  hasCopperCan: false,
  hasBentMagnet: false,
  hasInvestigatedMagnet: false,
  hasDisturbedBeehive: false,
  bentMagnetBitsPerSecond: 1,

  hasUnlockedCopperCan: false,
  hasUnlockedPack: false,
  hasUnlockedThoughts: false,
  hasUnlockedMap: false,
  hasUnlockedSave: false,
  hasUnlockedSettings: false,

  hasSeenTitleReveal: false,

  hasRefusedCopperCan: false,
  hasIgnoredCopperCan: false,

  lastMessage: "",
  timerId: null,
  combatTimerId: null,
  combat: createCombatState(),
};

export const statusBar = document.getElementById("statusBar");
export const mainContent = document.getElementById("mainContent");
