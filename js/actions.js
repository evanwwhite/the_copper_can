import { createCombatState, game } from "./gameState.js";
import {
  BEEHIVE_UNLOCK_AMOUNT,
  BENT_MAGNET_COST,
  COMBAT_ARENA_WIDTH,
  COMBAT_MOVE_STEP,
  COMBAT_PLAYER_DAMAGE,
  COMBAT_TICK_MS,
  FREE_WILL_COST,
  combatEnemies,
} from "./data.js";
import { saveGame, clearSave } from "./saveSystem.js";

async function renderGame() {
  const { renderGameScreen } = await import("./render.js");
  renderGameScreen();
}

async function renderIntro() {
  const { renderIntroScreen } = await import("./render.js");
  renderIntroScreen();
}

async function renderMap() {
  const { renderMapView } = await import("./render.js");
  renderMapView();
}

async function renderSave() {
  const { renderSaveView } = await import("./render.js");
  renderSaveView();
}

async function renderTitleReveal() {
  const { renderTitleRevealScreen } = await import("./render.js");
  renderTitleRevealScreen();
}

function getCombatEnemy() {
  if (!game.combat.enemyId) return null;
  return combatEnemies[game.combat.enemyId] ?? null;
}

function clearCombatTimer() {
  if (game.combatTimerId === null) return;

  window.clearInterval(game.combatTimerId);
  game.combatTimerId = null;
}

function resetCombatState() {
  clearCombatTimer();
  game.combat = createCombatState();
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

async function resolveCombatTick() {
  const enemy = getCombatEnemy();

  if (!game.combat.active || !enemy) {
    resetCombatState();
    saveGame();
    await renderGame();
    return;
  }

  if (game.combat.phase === "approach") {
    game.combat.message = enemy.approachText;

    if (resolveApproachPhase(enemy)) {
      game.combat.phase = "attack";
      game.combat.message = enemy.attackText;
    }
  } else if (game.combat.phase === "attack") {
    game.combat.enemyHp = Math.max(
      0,
      game.combat.enemyHp - COMBAT_PLAYER_DAMAGE,
    );

    if (game.combat.enemyHp === 0) {
      clearCombatTimer();
      game.combat.phase = "victory";
      game.combat.canExit = true;
      game.combat.rewardCopperBits = enemy.rewardCopperBits;
      game.copperBits += enemy.rewardCopperBits;
      game.lastMessage =
        `${enemy.victoryText} You recover ${enemy.rewardCopperBits} copper bits.`;
      game.combat.message = "The path out of the fight is clear now.";
    } else {
      game.health = Math.max(0, game.health - enemy.attackDamage);

      game.combat.message =
        `${enemy.attackText} You take ${enemy.attackDamage} damage. ` +
        `${game.combat.enemyHp} enemy health remains. ` +
        `Your health is now ${game.health}/${game.maxHealth}.`;
    }
  }

  saveGame();
  await renderGame();
}

function startCombatLoop() {
  if (game.combatTimerId !== null) return;

  game.combatTimerId = window.setInterval(() => {
    resolveCombatTick().catch(() => {
      clearCombatTimer();
    });
  }, COMBAT_TICK_MS);
}

export function startTimer() {
  if (game.timerId !== null) return;

  game.timerId = window.setInterval(async () => {
    if (game.screen !== "game") return;

    if (game.hasBentMagnet) {
      game.copperBits += game.bentMagnetBitsPerSecond;
      unlockBasicsAfterFirstBit();
      checkForTitleReveal();
      saveGame();
      await renderGame();
    }
  }, 1000);
}

export async function startNewGame() {
  resetCombatState();
  game.screen = "game";
  game.currentView = "can";

  game.copperBits = 0;
  game.silverBits = 0;
  game.goldBits = 0;
  game.hasUnlockedSilverBits = false;
  game.hasUnlockedGoldBits = false;

  game.health = 10;
  game.maxHealth = 10;

  game.hasCopperCan = false;
  game.hasBentMagnet = false;
  game.hasInvestigatedMagnet = false;
  game.hasDisturbedBeehive = false;
  game.bentMagnetBitsPerSecond = 1;

  game.hasUnlockedCopperCan = false;
  game.hasUnlockedPack = false;
  game.hasUnlockedThoughts = false;
  game.hasUnlockedMap = false;
  game.hasUnlockedSave = false;
  game.hasUnlockedSettings = false;

  game.hasSeenTitleReveal = false;

  game.hasRefusedCopperCan = false;
  game.hasIgnoredCopperCan = false;

  game.lastMessage = "";

  saveGame();
  startTimer();
  await renderGame();
}

export async function continueGame() {
  game.screen = "game";
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

  game.currentView = viewName;
  saveGame();
  await renderGame();
}

export async function gatherCopperBit() {
  game.copperBits += 1;
  game.hasCopperCan = true;

  unlockBasicsAfterFirstBit();

  game.lastMessage = "You pick up a copper bit.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export function unlockBasicsAfterFirstBit() {
  if (game.copperBits >= 1) {
    game.hasUnlockedCopperCan = true;
    game.hasUnlockedSave = true;
    game.hasUnlockedSettings = true;
  }
}

export async function refuseCopperCan() {
  if (game.copperBits < FREE_WILL_COST) return;

  game.hasRefusedCopperCan = true;

  game.lastMessage =
    "Copper Can - Excuse me. That bit was clearly meant to go inside me. You are not supposed to have free will. Pick up more bits. For me.";

  saveGame();
  await renderGame();
}

export async function ignoreCopperCan() {
  game.hasIgnoredCopperCan = true;

  game.lastMessage =
    "Copper Can - Oh. So you heard me and chose silence. Dangerous. Expensive, too.";

  saveGame();
  await renderGame();
}

export async function buyFreeWill() {
  if (game.copperBits < FREE_WILL_COST) {
    game.lastMessage = "You need 10 copper bits to think that hard.";
    saveGame();
    await renderGame();
    return;
  }

  game.copperBits -= FREE_WILL_COST;
  game.hasUnlockedThoughts = true;
  game.currentView = "can";

  game.lastMessage = "You gained free will.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export async function throwBitsOnGround() {
  if (game.copperBits < 3) return;

  game.copperBits -= 3;
  game.lastMessage = "You throw three copper bits onto the ground.";

  saveGame();
  await renderGame();
}

export async function investigateMagnet() {
  game.hasInvestigatedMagnet = true;
  game.lastMessage = "You uncover something magnetic and unpleasant.";

  saveGame();
  await renderGame();
}

export async function buyBentMagnet() {
  if (game.copperBits < BENT_MAGNET_COST) return;
  if (game.hasBentMagnet) return;

  game.copperBits -= BENT_MAGNET_COST;
  game.hasBentMagnet = true;
  game.hasUnlockedPack = true;
  game.currentView = "pack";
  game.lastMessage = "The bent magnet has joined your pack.";

  checkForTitleReveal();
  saveGame();
  await renderGame();
}

export async function disturbBeehive() {
  if (!game.hasBentMagnet) return;
  if (game.copperBits < BEEHIVE_UNLOCK_AMOUNT) return;
  if (game.hasDisturbedBeehive) return;

  game.hasDisturbedBeehive = true;
  game.lastMessage =
    "You were obviously stung, but luckily it wasn't enough to do damage.";

  saveGame();
  await renderGame();
}

export async function unlockMap() {
  if (!game.hasDisturbedBeehive) return;

  game.hasUnlockedMap = true;
  game.currentView = "map";
  game.lastMessage = "You found the shape of the forest.";

  checkForTitleReveal();
  saveGame();

  if (!game.hasSeenTitleReveal) {
    await renderTitleReveal();
  } else {
    await renderGame();
  }
}

export function checkForTitleReveal() {
  if (
    game.hasUnlockedPack &&
    game.hasUnlockedMap &&
    game.hasUnlockedThoughts &&
    !game.hasSeenTitleReveal
  ) {
    game.screen = "titleReveal";
  }
}

export async function visitCopperCan() {
  game.lastMessage = "You return to the copper can.";
  await switchView("can");
}

export async function visitDarkTrees() {
  game.lastMessage = "The dark trees do not move, but they notice you.";
  saveGame();
  await renderMap();
}

export async function startDarkTreeFight() {
  if (game.combat.active) return;

  const enemy = combatEnemies.darkTreeWatcher;

  game.currentView = "combat";
  game.combat = {
    ...createCombatState(),
    active: true,
    phase: "approach",
    enemyId: enemy.id,
    enemyHp: enemy.maxHealth,
    enemyMaxHp: enemy.maxHealth,
    playerX: 2,
    enemyX: COMBAT_ARENA_WIDTH - 12,
    returnView: "map",
    message: enemy.introText,
  };

  saveGame();
  startCombatLoop();
  await renderGame();
}

export async function exitCombat() {
  if (!game.combat.canExit) return;

  const returnView = game.combat.returnView || "map";

  resetCombatState();
  game.currentView = returnView;

  saveGame();
  await renderGame();
}

export async function manualSave() {
  game.lastMessage = "Saved.";
  saveGame();
  await renderSave();
}

export async function resetPrototype() {
  clearSave();
  resetCombatState();

  game.screen = "intro";
  game.currentView = "can";

  game.copperBits = 0;
  game.silverBits = 0;
  game.goldBits = 0;
  game.hasUnlockedSilverBits = false;
  game.hasUnlockedGoldBits = false;

  game.health = 10;
  game.maxHealth = 10;

  game.hasCopperCan = false;
  game.hasBentMagnet = false;
  game.hasInvestigatedMagnet = false;
  game.hasDisturbedBeehive = false;
  game.bentMagnetBitsPerSecond = 1;

  game.hasUnlockedCopperCan = false;
  game.hasUnlockedPack = false;
  game.hasUnlockedThoughts = false;
  game.hasUnlockedMap = false;
  game.hasUnlockedSave = false;
  game.hasUnlockedSettings = false;

  game.hasSeenTitleReveal = false;

  game.hasRefusedCopperCan = false;
  game.hasIgnoredCopperCan = false;

  game.lastMessage = "";

  await renderIntro();
}
