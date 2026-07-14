export function createCombatState() {
  return {
    active: false,
    phase: "idle", // idle | fight | victory | defeat
    enemyId: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    playerX: 2,
    enemyX: 58,
    enemyHomeX: 58,
    canExit: false,
    defeated: false,
    demo: false,
    returnScreen: "game",
    returnView: "map",
    message: "",
    rewardCopperBits: 0,

    // Player-driven input state (the tick reads these; keys/buttons write them)
    equippedWeapon: "slingshot",
    targetZone: 5, // numpad-spatial 1-9; center is always x1.0
    bracing: false,
    releasedBrace: false, // set on the keyup that ends a brace; consumed by the tick

    guard: 100,
    slingshotAmmo: 5,
    ammoRegenCounter: 0,

    cooldowns: { slingshot: 0, spear: 0, sword: 0 },
    enemyAttackTimer: 0,
    enemyTelegraph: 0,
    enemyStagger: 0,
    enemyLungeDelay: 0,
    weakRevealed: false,

    ticks: 0,
    log: [], // [{ text, kind }] append-only history
    fightBits: 0,
    hitFlash: null, // { text, over: "enemy"|"player", ticks } floating damage
  };
}

export function createWalkState() {
  return {
    active: false,
    sceneId: "plains",
    playerX: 2, // column; the player spawns on the left and walks right
    facing: 1, // 1 = facing right, -1 = facing left
    heldDir: 0, // -1/0/1, written by keys, read by the walk tick
    stepFrame: 0, // current frame in the active walk cycle
    segment: 1, // which scene in the walk sequence (1..WALK_SEGMENT_LIMIT)
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
      spear: false,
      shield: false,
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
    walk: createWalkState(),
  };
}

export const game = createInitialGameState();

export const runtime = {
  timerId: null,
  combatTimerId: null,
  walkTimerId: null,
  statusBar:
    typeof document === "undefined"
      ? null
      : document.getElementById("statusBar"),
  mainContent:
    typeof document === "undefined"
      ? null
      : document.getElementById("mainContent"),
};
