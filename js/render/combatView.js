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
import {
  exitCombat,
  exitCombatDemo,
  healPlayer,
  returnToTownAfterDefeat,
} from "../actions.js";
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

  if (game.combat.demo) {
    content += `

    <span id="healButton" class="asciiRealButton">Heal to full</span>

`;
  }

  if (game.combat.canExit) {
    let exitLabel = game.combat.defeated ? "Return to town" : "Exit fight";

    if (game.combat.demo) {
      exitLabel = game.combat.defeated ? "Back to demo" : "Fight again";
    }

    content += `

    <span id="exitCombatButton" class="asciiRealButton">${exitLabel}</span>

`;
  }

  mainContent.innerHTML = content;

  const healButton = document.getElementById("healButton");
  if (healButton) {
    healButton.addEventListener("click", healPlayer);
  }

  const exitCombatButton = document.getElementById("exitCombatButton");
  if (exitCombatButton) {
    let exitHandler = game.combat.defeated ? returnToTownAfterDefeat : exitCombat;

    if (game.combat.demo) {
      exitHandler = exitCombatDemo;
    }

    exitCombatButton.addEventListener("click", exitHandler);
  }
}
