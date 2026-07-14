import { createCombatState, game, runtime } from "./gameState.js";
import {
  BEEHIVE_UNLOCK_AMOUNT,
  BENT_MAGNET_COST,
  BOOTS_COST,
  BOOTS_DAMAGE_REDUCTION,
  COMBAT_ARENA_WIDTH,
  COMBAT_TICK_MS,
  COMBAT_TUNING,
  FREE_WILL_COST,
  INN_REST_COST,
  SLINGSHOT_COST,
  SPEAR_COST,
  SWORD_COST,
  combatEnemies,
} from "./data.js";
import { pushCombatLog, stepCombat } from "./combatCore.js";
import { playerWalkFrames } from "./asciiArtHelper.js";
import { saveGame, clearSave, hydrateGameState } from "./saveSystem.js";

async function renderGame() {
  const { renderGameScreen } = await import("./renderHelper.js");
  renderGameScreen();
}

async function renderIntro() {
  const { renderIntroScreen } = await import("./renderHelper.js");
  renderIntroScreen();
}

async function renderSave() {
  const { renderSaveView } = await import("./renderHelper.js");
  renderSaveView();
}

async function renderTitleReveal() {
  const { renderTitleRevealScreen } = await import("./renderHelper.js");
  renderTitleRevealScreen();
}

async function renderForestPath() {
  const { renderForestPathScreen } = await import("./renderHelper.js");
  renderForestPathScreen();
}

async function renderBlankPath() {
  const { renderBlankPathScreen } = await import("./renderHelper.js");
  renderBlankPathScreen();
}

async function renderTown() {
  const { renderTownScreen } = await import("./renderHelper.js");
  renderTownScreen();
}

async function renderTownInterior() {
  const { renderTownInteriorScreen } = await import("./renderHelper.js");
  renderTownInteriorScreen();
}

async function renderDarkForest() {
  const { renderDarkForestScreen } = await import("./renderHelper.js");
  renderDarkForestScreen();
}

async function renderWalk() {
  const { renderWalkScreen } = await import("./render/walkScreen.js");
  renderWalkScreen();
}

async function refreshCopperCounter() {
  if (game.world.screen === "game") {
    await renderGame();
    return;
  }

  const { attachTopBarListeners, renderTopBar } = await import(
    "./renderHelper.js"
  );
  renderTopBar();
  attachTopBarListeners();
}

function getCombatEnemy() {
  if (!game.combat.enemyId) return null;
  return combatEnemies[game.combat.enemyId] ?? null;
}

export function getPlayerCombatStats() {
  // The demo arena lends the full kit so the beta is testable before the
  // player has bought anything.
  const demo = game.combat.demo;
  const weapons = ["slingshot", "spear", "sword"].filter(
    (key) => demo || game.inventory[key],
  );

  return {
    health: game.player.health,
    maxHealth: game.player.maxHealth,
    weapons,
    hasShield: demo || game.inventory.shield,
    damageReduction: game.inventory.bootsEquipped ? BOOTS_DAMAGE_REDUCTION : 0,
  };
}

function clearCombatTimer() {
  if (runtime.combatTimerId === null) return;

  window.clearInterval(runtime.combatTimerId);
  runtime.combatTimerId = null;
}

function resetCombatState() {
  clearCombatTimer();
  game.combat = createCombatState();
}

function resetGameState(overrides = {}) {
  resetCombatState();
  Object.assign(game, hydrateGameState(overrides));
}

function resolveCombatVictory(enemy) {
  clearCombatTimer();
  game.combat.active = false;
  game.combat.canExit = true;
  game.combat.rewardCopperBits = enemy.rewardCopperBits;
  game.combat.fightBits += enemy.rewardCopperBits;
  if (enemy.id === "darkTreeWatcher" && !game.combat.demo) {
    game.flags.defeatedDarkTreeWatcher = true;
  }
  game.currencies.copper += enemy.rewardCopperBits;
  game.lastMessage =
    `${enemy.victoryText} You recover ${enemy.rewardCopperBits} copper bits.`;
  pushCombatLog(
    game.combat,
    `> Recovered ${enemy.rewardCopperBits} copper bits.`,
    "reward",
  );
}

function resolveCombatDefeat() {
  clearCombatTimer();
  game.combat.active = false;
  game.combat.canExit = true;
  game.combat.defeated = true;
  game.combat.rewardCopperBits = 0;
}

// The setInterval is a thin driver: read input state, call the pure reducer,
// apply the reported player damage, render, and persist only on transitions
// (never every 180ms).
async function resolveCombatTick() {
  const enemy = getCombatEnemy();

  if (!game.combat.active || !enemy) {
    resetCombatState();
    saveGame();
    await renderGame();
    return;
  }

  const stats = getPlayerCombatStats();

  stepCombat(game.combat, enemy, stats, COMBAT_TUNING);

  if (game.combat.playerDamageTaken > 0) {
    game.player.health = Math.max(
      0,
      game.player.health - game.combat.playerDamageTaken,
    );
  }

  if (game.combat.phase === "victory") {
    resolveCombatVictory(enemy);
    saveGame();
  } else if (game.combat.phase === "defeat") {
    resolveCombatDefeat();
    saveGame();
  } else if (game.combat.ticks % 25 === 0) {
    saveGame();
  }

  await renderGame();
}

// --- Combat input: keys and buttons write state; the tick reads it. ---

export const COMBAT_WEAPON_KEYS = { q: "slingshot", w: "spear", e: "sword" };

export function setCombatWeapon(weaponKey) {
  if (!game.combat.active) return;
  const stats = getPlayerCombatStats();
  if (!stats.weapons.includes(weaponKey)) return;
  if (game.combat.equippedWeapon === weaponKey) return;

  game.combat.equippedWeapon = weaponKey;
  pushCombatLog(
    game.combat,
    `You ready the ${COMBAT_TUNING.weapons[weaponKey].label}.`,
    "info",
  );
}

export function setCombatTargetZone(zone) {
  if (!game.combat.active) return;
  if (zone < 1 || zone > 9) return;
  game.combat.targetZone = zone;
}

export function startBrace() {
  if (!game.combat.active) return;
  if (game.combat.bracing) return;
  if (!getPlayerCombatStats().hasShield) return;
  if (game.combat.guard <= 0) return;
  game.combat.bracing = true;
}

export function releaseBrace() {
  if (!game.combat.bracing) return;
  game.combat.bracing = false;
  game.combat.releasedBrace = true;
}

export async function fleeCombat() {
  if (!game.combat.active) return;

  clearCombatTimer();
  game.combat.active = false;
  game.combat.canExit = true;
  game.combat.rewardCopperBits = 0;
  pushCombatLog(
    game.combat,
    "You leg it. Strategic. Definitely strategic.",
    "result",
  );

  saveGame();
  await renderGame();
}

let combatKeysInstalled = false;

export function installCombatKeyHandlers() {
  if (combatKeysInstalled || typeof window === "undefined") return;
  combatKeysInstalled = true;

  window.addEventListener("keydown", (event) => {
    if (!game.combat.active) return;

    const key = event.key.toLowerCase();

    if (COMBAT_WEAPON_KEYS[key]) {
      setCombatWeapon(COMBAT_WEAPON_KEYS[key]);
    } else if (/^[1-9]$/.test(event.key)) {
      setCombatTargetZone(Number(event.key));
    } else if (key === "shift") {
      if (!event.repeat) startBrace();
    } else if (key === "f") {
      fleeCombat();
      return;
    } else {
      return;
    }

    event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    if (!game.combat.active) return;
    if (event.key.toLowerCase() === "shift") {
      releaseBrace();
    }
  });
}

// --- Walkable scenes -------------------------------------------------------

const WALK_TICK_MS = 90;
let walkKeysInstalled = false;

async function loadWalkScene(sceneId) {
  const { getWalkScene } = await import("./render/walkScenes.js");
  return getWalkScene(sceneId);
}

async function getWalkSegmentLimit() {
  const { WALK_SEGMENT_LIMIT } = await import("./render/walkScenes.js");
  return WALK_SEGMENT_LIMIT;
}

function clearWalkTimer() {
  if (runtime.walkTimerId === null) return;

  window.clearInterval(runtime.walkTimerId);
  runtime.walkTimerId = null;
}

// Enter a walkable scene, spawning on the left edge facing right. `segment` is
// the 1-based position in the walk sequence; a fresh entry (e.g. from the world
// map) resets it to 1, while edge transitions carry the incremented count.
export async function enterWalkScene(sceneId = "plains", segment = 1) {
  const scene = await loadWalkScene(sceneId);

  game.world.screen = "walk";
  game.walk.active = true;
  game.walk.sceneId = sceneId;
  game.walk.playerX = scene.minX;
  game.walk.facing = 1;
  game.walk.heldDir = 0;
  game.walk.stepFrame = 0;
  game.walk.segment = segment;
  saveGame();

  await renderWalk();
}

// Advance the player one column in `direction` (-1/1), handling scene edges.
// Walking off the right edge loads the scene's `next` (respawning on the left)
// until the segment limit is reached; otherwise the player clamps at the bounds.
async function stepWalk(direction) {
  const scene = await loadWalkScene(game.walk.sceneId);
  const nextX = game.walk.playerX + direction;

  if (direction > 0 && nextX > scene.maxX) {
    const limit = await getWalkSegmentLimit();
    if (scene.next && game.walk.segment < limit) {
      await enterWalkScene(scene.next, game.walk.segment + 1);
    }
    return;
  }

  game.walk.playerX = Math.max(scene.minX, Math.min(scene.maxX, nextX));
  game.walk.facing = direction < 0 ? -1 : 1;
  const frames = playerWalkFrames[direction < 0 ? "left" : "right"];
  game.walk.stepFrame = (game.walk.stepFrame + 1) % frames.length;
  saveGame();
  await renderWalk();
}

// Single discrete step, used by the on-screen walk buttons.
export async function moveWalk(direction) {
  if (!game.walk.active) return;
  if (direction !== -1 && direction !== 1) return;
  await stepWalk(direction);
}

function startWalkLoop() {
  if (runtime.walkTimerId !== null) return;

  runtime.walkTimerId = window.setInterval(() => {
    if (game.world.screen !== "walk" || !game.walk.active) return;
    if (game.walk.heldDir === 0) return;
    stepWalk(game.walk.heldDir).catch(() => clearWalkTimer());
  }, WALK_TICK_MS);
}

export function installWalkKeyHandlers() {
  startWalkLoop();

  if (walkKeysInstalled || typeof window === "undefined") return;
  walkKeysInstalled = true;

  window.addEventListener("keydown", (event) => {
    if (!game.walk.active) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    game.walk.heldDir = event.key === "ArrowLeft" ? -1 : 1;
    game.walk.facing = game.walk.heldDir;
    event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    if (!game.walk.active) return;
    if (
      (event.key === "ArrowLeft" && game.walk.heldDir < 0) ||
      (event.key === "ArrowRight" && game.walk.heldDir > 0)
    ) {
      game.walk.heldDir = 0;
    }
  });
}

function startCombatLoop() {
  installCombatKeyHandlers();
  if (runtime.combatTimerId !== null) return;

  runtime.combatTimerId = window.setInterval(() => {
    resolveCombatTick().catch(() => {
      clearCombatTimer();
    });
  }, COMBAT_TICK_MS);
}

export function startTimer() {
  if (runtime.timerId !== null) return;

  runtime.timerId = window.setInterval(async () => {
    if (game.inventory.bentMagnet) {
      game.currencies.copper += game.inventory.bentMagnetBitsPerSecond;
      unlockBasicsAfterFirstBit();
      checkForTitleReveal();
      saveGame();
      await refreshCopperCounter();
    }
  }, 1000);
}

export async function startNewGame() {
  resetGameState({
    world: {
      screen: "game",
      currentView: "can",
    },
  });

  saveGame();
  startTimer();
  await renderGame();
}

export async function continueGame() {
  game.world.screen = "game";
  saveGame();
  startTimer();

  if (game.combat.active) {
    startCombatLoop();
  }

  await renderGame();
}

export async function switchView(viewName) {
  if (game.combat.active && viewName !== "combat") {
    game.combat.message = "Finish the fight before leaving the arena.";
    saveGame();
    await renderGame();
    return;
  }

  if (game.combat.canExit && viewName !== "combat") {
    resetCombatState();
  }

  game.world.screen = "game";
  game.world.currentView = viewName;
  saveGame();
  await renderGame();
}

export async function gatherCopperBit() {
  game.currencies.copper += 1;
  game.inventory.copperCan = true;

  unlockBasicsAfterFirstBit();

  game.lastMessage = "You pick up a copper bit.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export function unlockBasicsAfterFirstBit() {
  if (game.currencies.copper >= 1) {
    game.unlocks.copperCan = true;
    game.unlocks.save = true;
    game.unlocks.settings = true;
  }
}

export async function refuseCopperCan() {
  if (game.currencies.copper < FREE_WILL_COST) return;

  game.flags.refusedCopperCan = true;

  game.lastMessage =
    "Copper Can - Excuse me. That bit was clearly meant to go inside me. You are not supposed to have free will. Pick up more bits. For me.";

  saveGame();
  await renderGame();
}

export async function ignoreCopperCan() {
  game.flags.ignoredCopperCan = true;

  game.lastMessage =
    "Copper Can - Oh. So you heard me and chose silence. Dangerous. Expensive, too.";

  saveGame();
  await renderGame();
}

export async function buyFreeWill() {
  if (game.currencies.copper < FREE_WILL_COST) {
    game.lastMessage = "You need 10 copper bits to think that hard.";
    saveGame();
    await renderGame();
    return;
  }

  game.currencies.copper -= FREE_WILL_COST;
  game.unlocks.thoughts = true;
  game.world.currentView = "can";

  game.lastMessage = "You gained free will.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export async function throwBitsOnGround() {
  if (game.currencies.copper < 3) return;

  game.currencies.copper -= 3;
  game.lastMessage = "You throw three copper bits onto the ground.";

  saveGame();
  await renderGame();
}

export async function investigateMagnet() {
  game.flags.investigatedMagnet = true;
  game.lastMessage = "You uncover something magnetic and unpleasant.";

  saveGame();
  await renderGame();
}

export async function buyBentMagnet() {
  if (game.currencies.copper < BENT_MAGNET_COST) return;
  if (game.inventory.bentMagnet) return;

  game.currencies.copper -= BENT_MAGNET_COST;
  game.inventory.bentMagnet = true;
  game.unlocks.pack = true;
  game.world.currentView = "pack";
  game.lastMessage = "The bent magnet has joined your pack.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export async function disturbBeehive() {
  if (!game.inventory.bentMagnet) return;
  if (game.currencies.copper < BEEHIVE_UNLOCK_AMOUNT) return;
  if (game.flags.disturbedBeehive) return;

  game.flags.disturbedBeehive = true;
  game.lastMessage =
    "You were obviously stung, but luckily it wasn't enough to do damage.";

  saveGame();
  await renderGame();
}

export async function unlockMap() {
  if (!game.flags.disturbedBeehive) return;

  if (game.flags.reachedWoodedPath) {
    game.world.screen = "forestPath";
    saveGame();
    await renderForestPath();
    return;
  }

  game.flags.reachedWoodedPath = true;
  game.unlocks.map = false;
  game.world.screen = "titleReveal";
  game.world.nextScreenAfterTitleReveal = "forestPath";
  game.lastMessage = "";

  checkForTitleReveal();
  saveGame();

  await renderTitleReveal();
}

export function checkForTitleReveal() {
  if (
    game.unlocks.pack &&
    game.unlocks.thoughts &&
    game.flags.reachedWoodedPath &&
    !game.flags.seenTitleReveal
  ) {
    game.world.screen = "titleReveal";
  }
}

export async function continueFromTitleReveal() {
  const nextScreen = game.world.nextScreenAfterTitleReveal;

  game.world.nextScreenAfterTitleReveal = null;

  if (nextScreen === "forestPath") {
    game.world.screen = "forestPath";
    saveGame();
    await renderForestPath();
    return;
  }

  game.world.screen = "game";
  game.world.currentView = "can";
  saveGame();
  await renderGame();
}

export async function followWoodedPath() {
  game.world.screen = "blankPath";
  saveGame();
  await renderBlankPath();
}

export async function continueOnTrail() {
  game.world.screen = "town";
  saveGame();
  await renderTown();
}

export async function enterTownBuilding(buildingId) {
  game.world.screen = "townInterior";
  game.world.currentView = buildingId;
  saveGame();
  await renderTownInterior();
}

export async function leaveTownBuilding() {
  game.world.screen = "town";
  saveGame();
  await renderTown();
}

async function buyGear(itemKey, cost, successMessage, { render = true } = {}) {
  let purchased = false;

  if (game.inventory[itemKey]) {
    game.lastMessage = "You already own that.";
  } else if (game.currencies.copper < cost) {
    game.lastMessage = `You need ${cost} copper bits for that.`;
  } else {
    game.currencies.copper -= cost;
    game.inventory[itemKey] = true;
    game.inventory[`${itemKey}Equipped`] = true;
    game.lastMessage = successMessage;
    purchased = true;
  }

  if (render) {
    saveGame();
    await renderTownInterior();
  }

  return purchased;
}

export async function buySlingshot() {
  await buyGear(
    "slingshot",
    SLINGSHOT_COST,
    "A worn slingshot is yours. It stings foes as they approach.",
  );
}

export async function buyBoots() {
  await buyGear(
    "boots",
    BOOTS_COST,
    "Sturdy boots are yours. Blows land softer now.",
  );
}

export async function buySword() {
  const purchased = await buyGear(
    "sword",
    SWORD_COST,
    "A keen-edged sword is yours. Your strikes bite deeper.",
    { render: false },
  );

  if (purchased && !game.flags.unlockedWorldMap) {
    game.flags.unlockedWorldMap = true;
    game.lastMessage =
      'The blacksmith presses the blade into your hands. ' +
      '"The world is dangerous out here. Take this." ' +
      "A wider map of the world unfolds in your mind.";
  }

  saveGame();
  await renderTownInterior();
}

export async function buySpear() {
  await buyGear(
    "spear",
    SPEAR_COST,
    "A long-hafted spear is yours. It keeps trouble at arm's length.",
  );
}

export async function restAtInn() {
  if (game.player.health >= game.player.maxHealth) {
    game.lastMessage = "You are already at full health.";
  } else if (game.currencies.copper < INN_REST_COST) {
    game.lastMessage = `You need ${INN_REST_COST} copper bits to rent a room.`;
  } else {
    game.currencies.copper -= INN_REST_COST;
    game.player.health = game.player.maxHealth;
    game.lastMessage = "You rest by the fire and wake fully restored.";
  }

  saveGame();
  await renderTownInterior();
}

export async function acceptDarkForestChallenge() {
  game.flags.acceptedDarkForestChallenge = true;
  game.world.screen = "town";
  saveGame();
  await renderTown();
}

export async function receiveVillageMap() {
  if (!game.flags.defeatedDarkTreeWatcher) return;

  game.inventory.map = true;
  game.unlocks.map = true;
  game.unlocks.pack = true;
  game.flags.receivedVillageMap = true;
  game.lastMessage = "The villager gives you a folded map of the road home.";

  saveGame();
  await renderTownInterior();
}

export async function enterDarkForest() {
  if (!game.flags.acceptedDarkForestChallenge) return;

  game.world.screen = "darkForest";
  game.world.darkForestSceneIndex = 0;
  saveGame();
  await renderDarkForest();
}

export async function leaveDarkForest() {
  game.world.screen = "town";
  saveGame();
  await renderTown();
}

export async function visitCopperCan() {
  game.lastMessage = "You return to the copper can.";
  await switchView("can");
}

export async function viewWorldMap() {
  if (!game.flags.unlockedWorldMap) return;
  await switchView("worldMap");
}

export async function travelToWoodedPath() {
  game.world.screen = "forestPath";
  game.lastMessage = "You follow the map back to the wooded path.";
  saveGame();
  await renderForestPath();
}

export async function travelToVillage() {
  game.world.screen = "town";
  game.lastMessage = "You follow the map back to the village.";
  saveGame();
  await renderTown();
}

export async function startDarkTreeFight() {
  if (game.combat.active) return;
  if (game.flags.defeatedDarkTreeWatcher) {
    game.lastMessage = "The fox has already been driven off.";
    saveGame();
    if (game.world.screen === "darkForest") {
      await renderDarkForest();
      return;
    }

    await renderGame();
    return;
  }

  const enemy = combatEnemies.darkTreeWatcher;
  const returnScreen = game.world.screen === "darkForest"
    ? "darkForest"
    : "game";
  const returnView = returnScreen === "game"
    ? game.world.currentView
    : "can";

  beginCombat(enemy, { returnScreen, returnView });
  saveGame();
  startCombatLoop();
  await renderGame();
}

function beginCombat(enemy, overrides = {}) {
  const enemyX = COMBAT_ARENA_WIDTH - 12;

  game.world.screen = "game";
  game.world.currentView = "combat";
  game.combat = {
    ...createCombatState(),
    active: true,
    phase: "fight",
    enemyId: enemy.id,
    enemyHp: enemy.maxHealth,
    enemyMaxHp: enemy.maxHealth,
    playerX: 2,
    enemyX,
    enemyHomeX: enemyX,
    slingshotAmmo: COMBAT_TUNING.slingshotAmmoMax,
    guard: COMBAT_TUNING.guardMax,
    ...overrides,
  };

  pushCombatLog(game.combat, enemy.introText, "info");
  pushCombatLog(
    game.combat,
    `You ready the ${COMBAT_TUNING.weapons[game.combat.equippedWeapon].label}.`,
    "info",
  );

  installCombatKeyHandlers();
}

export async function startCombatDemo(enemyId = "darkTreeWatcher") {
  if (game.combat.active) return;

  const enemy = combatEnemies[enemyId] ?? combatEnemies.darkTreeWatcher;

  beginCombat(enemy, {
    returnScreen: "game",
    returnView: "can",
    demo: true,
  });

  saveGame();
  startCombatLoop();
  await renderGame();
}

export async function exitCombatDemo() {
  if (!game.combat.canExit) return;

  resetCombatState();
  game.world.screen = "game";
  game.world.currentView = "can";
  game.lastMessage = "Demo round complete. Fight again whenever you like.";

  saveGame();
  await renderGame();
}

const EQUIPPABLE_ITEMS = {
  slingshot: "slingshot",
  boots: "boots",
  sword: "sword",
  spear: "spear",
};

export async function toggleEquip(itemKey) {
  if (!EQUIPPABLE_ITEMS[itemKey]) return;
  if (!game.inventory[itemKey]) return;

  const equippedKey = `${itemKey}Equipped`;
  const nowEquipped = !game.inventory[equippedKey];
  game.inventory[equippedKey] = nowEquipped;

  const label = itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
  game.lastMessage = nowEquipped
    ? `${label} equipped.`
    : `${label} unequipped.`;

  saveGame();
  await renderGame();
}

export async function healPlayer() {
  game.player.health = game.player.maxHealth;
  game.lastMessage = `Healed to full (${game.player.maxHealth}/${game.player.maxHealth}).`;
  game.combat.message = `You are patched up to ${game.player.health}/${game.player.maxHealth}.`;

  saveGame();
  await renderGame();
}

export async function returnToTownAfterDefeat() {
  if (!game.combat.defeated) return;

  resetCombatState();

  if (!game.flags.defeatedDarkTreeWatcher) {
    game.player.health = game.player.maxHealth;
    game.lastMessage =
      "You wake at the edge of the village, patched up by worried hands. " +
      "Try the fox again when you are ready.";
  } else {
    game.lastMessage =
      "You limp back into the village. Rest at the Riverside Inn to recover your strength.";
  }

  game.world.screen = "town";
  saveGame();
  await renderTown();
}

export async function exitCombat() {
  if (!game.combat.canExit) return;

  if (game.combat.defeated) {
    await returnToTownAfterDefeat();
    return;
  }

  const returnScreen = game.combat.returnScreen || "game";
  const returnView = game.combat.returnView || "map";

  resetCombatState();
  game.world.screen = returnScreen;
  game.world.currentView = returnView;

  saveGame();

  if (returnScreen === "darkForest") {
    await renderDarkForest();
    return;
  }

  await renderGame();
}

export async function manualSave() {
  game.lastMessage = "Saved.";
  saveGame();
  await renderSave();
}

export async function resetPrototype() {
  clearSave();
  resetGameState();

  await renderIntro();
}
