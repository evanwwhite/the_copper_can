import { createCombatState, game, runtime } from "./gameState.js";
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
import { saveGame, clearSave, hydrateGameState } from "./saveSystem.js";

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

async function renderForestPath() {
  const { renderForestPathScreen } = await import("./render.js");
  renderForestPathScreen();
}

async function renderBlankPath() {
  const { renderBlankPathScreen } = await import("./render.js");
  renderBlankPathScreen();
}

async function renderTown() {
  const { renderTownScreen } = await import("./render.js");
  renderTownScreen();
}

function getCombatEnemy() {
  if (!game.combat.enemyId) return null;
  return combatEnemies[game.combat.enemyId] ?? null;
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
      game.currencies.copper += enemy.rewardCopperBits;
      game.lastMessage =
        `${enemy.victoryText} You recover ${enemy.rewardCopperBits} copper bits.`;
      game.combat.message = "The path out of the fight is clear now.";
    } else {
      game.player.health = Math.max(0, game.player.health - enemy.attackDamage);

      game.combat.message =
        `${enemy.attackText} You take ${enemy.attackDamage} damage. ` +
        `${game.combat.enemyHp} enemy health remains. ` +
        `Your health is now ${game.player.health}/${game.player.maxHealth}.`;
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
    if (game.world.screen !== "game") return;

    if (game.inventory.bentMagnet) {
      game.currencies.copper += game.inventory.bentMagnetBitsPerSecond;
      unlockBasicsAfterFirstBit();
      checkForTitleReveal();
      saveGame();
      await renderGame();
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

export async function visitCopperCan() {
  game.lastMessage = "You return to the copper can.";
  await switchView("can");
}

export async function visitDarkTrees() {
  game.lastMessage =
    "The bent magnet pulls hard toward an old, rusty iron sign.";
  saveGame();
  await renderMap();
}

export async function startDarkTreeFight() {
  if (game.combat.active) return;

  const enemy = combatEnemies.darkTreeWatcher;

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
  game.world.currentView = returnView;

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
  resetGameState();

  await renderIntro();
}
