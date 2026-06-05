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
};

export const statusBar = document.getElementById("statusBar");
export const mainContent = document.getElementById("mainContent");