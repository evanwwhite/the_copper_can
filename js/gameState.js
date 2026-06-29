export function createCombatState() {
  return {
    active: false,
    phase: "idle",
    enemyId: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    approachTicks: 0,
    attackTicks: 0,
    playerX: 2,
    enemyX: 58,
    canExit: false,
    defeated: false,
    demo: false,
    returnScreen: "game",
    returnView: "map",
    message: "",
    rewardCopperBits: 0,
  };
}

export const SAVE_VERSION = 2;

export function createInitialGameState() {
  return {
    saveVersion: SAVE_VERSION,

    world: {
      screen: "intro",
      currentView: "can",
      darkForestSceneIndex: 0,
      nextScreenAfterTitleReveal: null,
    },

    currencies: {
      copper: 0,
      silver: 0,
      gold: 0,
    },

    player: {
      health: 10,
      maxHealth: 10,
    },

    inventory: {
      copperCan: false,
      bentMagnet: false,
      map: false,
      slingshot: false,
      boots: false,
      sword: false,
      slingshotEquipped: false,
      bootsEquipped: false,
      swordEquipped: false,
      bentMagnetBitsPerSecond: 1,
    },

    unlocks: {
      copperCan: false,
      pack: false,
      thoughts: false,
      map: false,
      save: false,
      settings: false,
      silverBits: false,
      goldBits: false,
    },

    flags: {
      investigatedMagnet: false,
      disturbedBeehive: false,
      reachedWoodedPath: false,
      seenTitleReveal: false,
      refusedCopperCan: false,
      ignoredCopperCan: false,
      acceptedDarkForestChallenge: false,
      defeatedDarkTreeWatcher: false,
      receivedVillageMap: false,
      unlockedWorldMap: false,
    },

    lastMessage: "",
    combat: createCombatState(),
  };
}

export const game = createInitialGameState();

export const runtime = {
  timerId: null,
  combatTimerId: null,
  statusBar:
    typeof document === "undefined"
      ? null
      : document.getElementById("statusBar"),
  mainContent:
    typeof document === "undefined"
      ? null
      : document.getElementById("mainContent"),
};
