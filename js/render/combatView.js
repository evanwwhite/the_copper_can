import { game } from "../gameState.js";
import {
  COMBAT_ARENA_HEIGHT,
  COMBAT_ARENA_WIDTH,
  combatEnemies,
} from "../data.js";
import {
  darkTreeWatcherArt,
  darkTreeWatcherDeadArt,
  playerCombatArt,
} from "../asciiArtHelper.js";
import { makePreformattedBox, wrapText } from "../helpers.js";
import { exitCombat, returnToTownAfterDefeat } from "../actions.js";
import { getSpriteWidth, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";

function getCombatEnemyArt() {
  if (game.combat.defeated) {
    return darkTreeWatcherArt;
  }

  if (game.combat.canExit || game.combat.enemyHp === 0) {
    return darkTreeWatcherDeadArt;
  }

  return darkTreeWatcherArt;
}

function buildCombatArenaLines() {
  const canvas = Array.from({ length: COMBAT_ARENA_HEIGHT }, () =>
    Array.from({ length: COMBAT_ARENA_WIDTH }, () => " "),
  );

  const floorRow = COMBAT_ARENA_HEIGHT - 2;

  for (let column = 0; column < COMBAT_ARENA_WIDTH; column += 1) {
    canvas[floorRow][column] = "_";
  }

  const playerY = floorRow - playerCombatArt.length + 1;
  const enemyArt = getCombatEnemyArt();
  const enemyY = floorRow - enemyArt.length + 1;
  const liveEnemyWidth = getSpriteWidth(darkTreeWatcherArt);
  const enemyWidth = getSpriteWidth(enemyArt);
  const enemyX = game.combat.enemyX + (liveEnemyWidth - enemyWidth);

  placeSprite(canvas, playerCombatArt, game.combat.playerX, playerY);
  placeSprite(canvas, enemyArt, enemyX, enemyY);

  return canvas.map((row) => row.join(""));
}

export function renderCombatView() {
  setMainContentMode("combatView");

  const enemy = combatEnemies[game.combat.enemyId];

  if (!enemy) {
    mainContent.innerHTML = "";
    return;
  }

  const phaseLabel = game.combat.defeated
    ? "Defeat"
    : game.combat.canExit
      ? "Victory"
      : game.combat.phase === "approach"
        ? "Approach"
        : "Clash";

  const combatLines = [
    `Enemy: ${enemy.name}`,
    `Phase: ${phaseLabel}`,
    `Enemy health: ${game.combat.enemyHp}/${game.combat.enemyMaxHp}`,
    "",
    ...buildCombatArenaLines(),
    "",
    ...wrapText(game.combat.message, COMBAT_ARENA_WIDTH),
  ];

  let content = `
${escapeHtml(makePreformattedBox("FIGHT", combatLines, COMBAT_ARENA_WIDTH))}
`;

  if (game.combat.canExit) {
    const exitLabel = game.combat.defeated ? "Return to town" : "Exit fight";
    content += `

    <span id="exitCombatButton" class="asciiRealButton">${exitLabel}</span>

`;
  }

  mainContent.innerHTML = content;

  const exitCombatButton = document.getElementById("exitCombatButton");
  if (exitCombatButton) {
    exitCombatButton.addEventListener(
      "click",
      game.combat.defeated ? returnToTownAfterDefeat : exitCombat,
    );
  }
}
