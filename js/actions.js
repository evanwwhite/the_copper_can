import { createCombatState, game, runtime } from "./gameState.js";
import {
  BEEHIVE_UNLOCK_AMOUNT,
  BENT_MAGNET_COST,
  BOOTS_COST,
  BOOTS_DAMAGE_REDUCTION,
  COMBAT_ARENA_WIDTH,
  COMBAT_MOVE_STEP,
  COMBAT_PLAYER_DAMAGE,
  COMBAT_TICK_MS,
  FREE_WILL_COST,
  INN_REST_COST,
  SLINGSHOT_APPROACH_DAMAGE,
  SLINGSHOT_COST,
  SWORD_ATTACK_BONUS,
  SWORD_COST,
  combatEnemies,
} from "./data.js";
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
  return {
    attackDamage:
      COMBAT_PLAYER_DAMAGE + (game.inventory.sword ? SWORD_ATTACK_BONUS : 0),
    damageReduction: game.inventory.boots ? BOOTS_DAMAGE_REDUCTION : 0,
    approachDamage: game.inventory.slingshot ? SLINGSHOT_APPROACH_DAMAGE : 0,
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

function resolveApproachPhase(enemy) {
  const approach = enemy.approach ?? {};
  const mover = approach.mover === "enemy" ? "enemy" : "player";
  const direction = approach.direction ?? (mover === "enemy" ? "left" : "right");
  const step = Math.max(1, approach.step ?? COMBAT_MOVE_STEP);
  const supportStep = Math.max(0, approach.supportStep ?? 0);
  const stopDistance = Math.max(1, approach.stopDistance ?? 8);

  if (mover === "enemy") {
    if (direction === "right") {
      const currentGap = game.combat.playerX - game.combat.enemyX;

      if (currentGap <= stopDistance) return true;

      let closableDistance = currentGap - stopDistance;
      const enemyMove = Math.min(step, closableDistance);
      closableDistance -= enemyMove;
      const playerMove = Math.min(supportStep, closableDistance);

      game.combat.enemyX += enemyMove;
      game.combat.playerX -= playerMove;

      return game.combat.playerX - game.combat.enemyX <= stopDistance;
    }

    const currentGap = game.combat.enemyX - game.combat.playerX;

    if (currentGap <= stopDistance) return true;

    let closableDistance = currentGap - stopDistance;
    const enemyMove = Math.min(step, closableDistance);
    closableDistance -= enemyMove;
    const playerMove = Math.min(supportStep, closableDistance);

    game.combat.enemyX -= enemyMove;
    game.combat.playerX += playerMove;

    return game.combat.enemyX - game.combat.playerX <= stopDistance;
  }

  if (direction === "left") {
    const currentGap = game.combat.playerX - game.combat.enemyX;

    if (currentGap <= stopDistance) return true;

    let closableDistance = currentGap - stopDistance;
    const playerMove = Math.min(step, closableDistance);
    closableDistance -= playerMove;
    const enemyMove = Math.min(supportStep, closableDistance);

    game.combat.playerX -= playerMove;
    game.combat.enemyX += enemyMove;

    return game.combat.playerX - game.combat.enemyX <= stopDistance;
  }

  const currentGap = game.combat.enemyX - game.combat.playerX;

  if (currentGap <= stopDistance) return true;

  let closableDistance = currentGap - stopDistance;
  const playerMove = Math.min(step, closableDistance);
  closableDistance -= playerMove;
  const enemyMove = Math.min(supportStep, closableDistance);

  game.combat.playerX += playerMove;
  game.combat.enemyX -= enemyMove;

  return game.combat.enemyX - game.combat.playerX <= stopDistance;
}

function resolveCombatVictory(enemy) {
  clearCombatTimer();
  game.combat.active = false;
  game.combat.phase = "victory";
  game.combat.canExit = true;
  game.combat.rewardCopperBits = enemy.rewardCopperBits;
  if (enemy.id === "darkTreeWatcher") {
    game.flags.defeatedDarkTreeWatcher = true;
  }
  game.currencies.copper += enemy.rewardCopperBits;
  game.lastMessage =
    `${enemy.victoryText} You recover ${enemy.rewardCopperBits} copper bits.`;
  game.combat.message = "The path out of the fight is clear now.";
}

function resolveCombatDefeat() {
  clearCombatTimer();
  game.combat.active = false;
  game.combat.phase = "defeat";
  game.combat.canExit = true;
  game.combat.defeated = true;
  game.combat.rewardCopperBits = 0;
  game.combat.message = "You are beaten back. There is no shame in retreat.";
}

async function resolveCombatTick() {
  const enemy = getCombatEnemy();

  if (!game.combat.active || !enemy) {
    resetCombatState();
    saveGame();
    await renderGame();
    return;
  }

  const stats = getPlayerCombatStats();

  if (game.combat.phase === "approach") {
    game.combat.message = enemy.approachText;

    if (stats.approachDamage > 0) {
      game.combat.enemyHp = Math.max(
        0,
        game.combat.enemyHp - stats.approachDamage,
      );
      game.combat.message =
        `${enemy.approachText} Your slingshot stings it for ` +
        `${stats.approachDamage} damage. ${game.combat.enemyHp} enemy health remains.`;

      if (game.combat.enemyHp === 0) {
        resolveCombatVictory(enemy);
        saveGame();
        await renderGame();
        return;
      }
    }

    if (resolveApproachPhase(enemy)) {
      game.combat.phase = "attack";
      game.combat.message = enemy.attackText;
    }
  } else if (game.combat.phase === "attack") {
    game.combat.enemyHp = Math.max(
      0,
      game.combat.enemyHp - stats.attackDamage,
    );

    if (game.combat.enemyHp === 0) {
      resolveCombatVictory(enemy);
    } else {
      const damageTaken = Math.max(
        0,
        enemy.attackDamage - stats.damageReduction,
      );
      game.player.health = Math.max(0, game.player.health - damageTaken);

      if (game.player.health === 0) {
        resolveCombatDefeat();
      } else {
        game.combat.message =
          `${enemy.attackText} You take ${damageTaken} damage. ` +
          `${game.combat.enemyHp} enemy health remains. ` +
          `Your health is now ${game.player.health}/${game.player.maxHealth}.`;
      }
    }
  }

  saveGame();
  await renderGame();
}

function startCombatLoop() {
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

  game.world.screen = "game";
  game.world.currentView = "combat";
  game.combat = {
    ...createCombatState(),
    active: true,
    phase: "approach",
    enemyId: enemy.id,
    enemyHp: enemy.maxHealth,
    enemyMaxHp: enemy.maxHealth,
    playerX: 2,
    enemyX: COMBAT_ARENA_WIDTH - 12,
    returnScreen,
    returnView,
    message: enemy.introText,
  };

  saveGame();
  startCombatLoop();
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
