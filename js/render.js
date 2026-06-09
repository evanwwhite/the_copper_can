import { game, runtime } from "./gameState.js";
import {
  BENT_MAGNET_COST,
  BEEHIVE_UNLOCK_AMOUNT,
  COMBAT_ARENA_HEIGHT,
  COMBAT_ARENA_WIDTH,
  MAP_UNLOCK_AMOUNT,
  FREE_WILL_COST,
  combatEnemies,
  thoughts,
} from "./data.js";
import {
  darkTreeWatcherDeadArt,
  darkTreeWatcherArt,
  copperCanTitleArt,
  forest,
  forestTrailSignScene,
  introTitleArt,
  mapLines,
  playerCombatArt,
  townScene,
} from "./asciiArt.js";
import {
  BOX_TEXT_WIDTH,
  centerText,
  makeBox,
  makePreformattedBox,
  wrapText,
} from "./helpers.js";
import { saveGame } from "./saveSystem.js";

import {
  startNewGame,
  switchView,
  gatherCopperBit,
  refuseCopperCan,
  ignoreCopperCan,
  buyFreeWill,
  throwBitsOnGround,
  investigateMagnet,
  buyBentMagnet,
  continueOnTrail,
  continueFromTitleReveal,
  disturbBeehive,
  followWoodedPath,
  unlockMap,
  visitCopperCan,
  visitDarkTrees,
  startDarkTreeFight,
  exitCombat,
  manualSave,
  resetPrototype,
} from "./actions.js";

const { statusBar, mainContent } = runtime;

export function renderIntroScreen() {
  game.world.screen = "intro";
  saveGame();
  setMainContentMode();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


${introTitleArt}

                     You wake beneath a wet green canopy.

                     The trees are too quiet.

                     In front of you sits a small oxidized copper can.
                     A few copper bits are scattered in the dirt nearby.

                     You do not know who left them.

                     You do not know why you want them.


                                <span id="playButton" class="asciiRealButton">Begin</span>


`;

  document.getElementById("playButton").addEventListener("click", startNewGame);
}

export function renderGameScreen() {
  renderTopBar();

  if (game.world.currentView === "combat" && game.combat.active) {
    renderCombatView();
  } else if (game.world.currentView === "map" && game.unlocks.map) {
    renderMapView();
  } else if (game.world.currentView === "pack" && game.unlocks.pack) {
    renderPackView();
  } else if (game.world.currentView === "thoughts" && game.unlocks.thoughts) {
    renderThoughtsView();
  } else if (game.world.currentView === "save" && game.unlocks.save) {
    renderSaveView();
  } else if (game.world.currentView === "settings" && game.unlocks.settings) {
    renderSettingsView();
  } else {
    game.world.currentView = "can";
    renderCopperCanView();
  }

  attachTopBarListeners();
}

function fitVisibleText(text, width) {
  const value = String(text);

  if (value.length > width) {
    return value.slice(0, width - 1) + "…";
  }

  return value;
}

function makeTopBarButton(id, label, width, isUnlocked) {
  const visibleText = fitVisibleText(isUnlocked ? label : "???", width);

  if (!isUnlocked) {
    return centerText(visibleText, width);
  }

  return `<span id="${id}" class="asciiButton" style="width:${width}ch"><span class="asciiButtonLabel">${visibleText}</span></span>`;
}

function makeHealthBar(current, max, width) {
  const safeMax = Math.max(max, 1);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));

  const filledAmount = Math.round((safeCurrent / safeMax) * width);
  const emptyAmount = width - filledAmount;

  return "■".repeat(filledAmount) + "□".repeat(emptyAmount);
}

function setMainContentMode(modeName = "") {
  mainContent.className = modeName;
}

function placeSprite(canvas, spriteLines, x, y) {
  spriteLines.forEach((line, rowOffset) => {
    [...line].forEach((character, columnOffset) => {
      const rowIndex = y + rowOffset;
      const columnIndex = x + columnOffset;

      if (
        character === " " ||
        rowIndex < 0 ||
        rowIndex >= canvas.length ||
        columnIndex < 0 ||
        columnIndex >= canvas[0].length
      ) {
        return;
      }

      canvas[rowIndex][columnIndex] = character;
    });
  });
}

function getSpriteWidth(spriteLines) {
  return spriteLines.reduce((maximumWidth, line) => {
    return Math.max(maximumWidth, line.length);
  }, 0);
}

function getCombatEnemyArt() {
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

export function renderTopBar() {
  const screensWithTopBar = ["game", "forestPath", "blankPath", "town"];

  if (!screensWithTopBar.includes(game.world.screen)) {
    statusBar.textContent = "";
    return;
  }

  const showHealthBar = game.flags.disturbedBeehive || game.combat.active;

  let currencyText = `${game.currencies.copper}c`;

  if (game.unlocks.silverBits) {
    currencyText += ` / ${game.currencies.silver}s`;
  }

  if (game.unlocks.goldBits) {
    currencyText += ` / ${game.currencies.gold}g`;
  }

  const copperCanText = `Copper Can: ${currencyText}`;

  const mapWidth = 10;
  const packWidth = 10;
  const thoughtsWidth = 12;
  const saveWidth = 8;
  const settingsWidth = 3;

  /*
    The copper can gets extra room.
    If the number gets huge, the entire top bar grows instead of breaking.
  */
  const minimumCopperWidth = 28;
  const copperWidth = Math.max(minimumCopperWidth, copperCanText.length + 2);

  const mapButton = makeTopBarButton(
    "mapTab",
    "Map",
    mapWidth,
    game.unlocks.map,
  );

  const packButton = makeTopBarButton(
    "packTab",
    "Pack",
    packWidth,
    game.unlocks.pack,
  );

  const thoughtsButton = makeTopBarButton(
    "thoughtsTab",
    "Thoughts",
    thoughtsWidth,
    game.unlocks.thoughts,
  );

  const copperCanButton = makeTopBarButton(
    "copperCanTab",
    copperCanText,
    copperWidth,
    game.unlocks.copperCan,
  );

  const saveButton = makeTopBarButton(
    "saveTab",
    "Save",
    saveWidth,
    game.unlocks.save,
  );

  const settingsButton = makeTopBarButton(
    "settingsTab",
    "⚙",
    settingsWidth,
    game.unlocks.settings,
  );

  const buttonLine =
    `│ ${mapButton} │ ` +
    `${packButton} │ ` +
    `${thoughtsButton} │ ` +
    `${copperCanButton} │ ` +
    `${saveButton} │ ` +
    `${settingsButton} │`;

  const cellWidths = [
    mapWidth,
    packWidth,
    thoughtsWidth,
    copperWidth,
    saveWidth,
    settingsWidth,
  ];

  const totalCellWidth = cellWidths.reduce((sum, width) => sum + width, 0);
  const topInnerWidth =
    totalCellWidth + cellWidths.length * 2 + (cellWidths.length - 1);

  const topBorder = "┌" + "─".repeat(topInnerWidth) + "┐";

  const buttonDivider =
    "├" + cellWidths.map((width) => "─".repeat(width + 2)).join("┴") + "┤";

  const bottomBorder = "└" + "─".repeat(topInnerWidth) + "┘";

  const healthText = `${game.player.health}/${game.player.maxHealth}`;
  const healthPrefix = showHealthBar
    ? " ♥ HEALTH  ["
    : " ♥ ??????  [";
  const healthSuffix = showHealthBar
    ? `] ${healthText} `
    : "]       ";

  const healthBarWidth =
    topInnerWidth - healthPrefix.length - healthSuffix.length;

  const healthBar = showHealthBar
    ? makeHealthBar(game.player.health, game.player.maxHealth, healthBarWidth)
    : " ".repeat(Math.max(healthBarWidth, 0));

  const healthLine = `│${healthPrefix}${healthBar}${healthSuffix}│`;

  statusBar.innerHTML = `
${topBorder}
${buttonLine}
${buttonDivider}
${healthLine}
${bottomBorder}
`;
}

export function attachTopBarListeners() {
  if (game.combat.active) {
    return;
  }

  const mapTab = document.getElementById("mapTab");
  if (mapTab) {
    mapTab.addEventListener("click", () => switchView("map"));
  }

  const packTab = document.getElementById("packTab");
  if (packTab) {
    packTab.addEventListener("click", () => switchView("pack"));
  }

  const thoughtsTab = document.getElementById("thoughtsTab");
  if (thoughtsTab) {
    thoughtsTab.addEventListener("click", () => switchView("thoughts"));
  }

  const copperCanTab = document.getElementById("copperCanTab");
  if (copperCanTab) {
    copperCanTab.addEventListener("click", () => switchView("can"));
  }

  const saveTab = document.getElementById("saveTab");
  if (saveTab) {
    saveTab.addEventListener("click", () => switchView("save"));
  }

  const settingsTab = document.getElementById("settingsTab");
  if (settingsTab) {
    settingsTab.addEventListener("click", () => switchView("settings"));
  }
}

export function renderCopperCanView() {
  setMainContentMode();
  const canLines = [`Copper bits: ${game.currencies.copper}`];

  if (game.unlocks.silverBits) {
    canLines.push(`Silver bits: ${game.currencies.silver}`);
  }

  if (game.unlocks.goldBits) {
    canLines.push(`Gold bits: ${game.currencies.gold}`);
  }

  canLines.push("");
  canLines.push(
    game.inventory.bentMagnet
      ? `Collecting rate: +${game.inventory.bentMagnetBitsPerSecond}/second`
      : "Collecting rate: none",
  );

  let content = `
${makeBox("Copper Can", canLines)}


    <span id="gatherBitButton" class="asciiRealButton">Pick up a copper bit</span>

`;

  if (game.currencies.copper >= 3) {
    content += `
    <span id="throwBitsButton" class="asciiRealButton">Throw a few back on the ground</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.currencies.copper >= FREE_WILL_COST &&
    !game.flags.refusedCopperCan
  ) {
    content += `
    <span id="refuseCopperCanButton" class="asciiRealButton">Do not pick up copper bit</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.flags.refusedCopperCan &&
    !game.flags.ignoredCopperCan
  ) {
    content += `
    <span id="ignoreCopperCanButton" class="asciiRealButton">Ignore the Can</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.flags.refusedCopperCan &&
    game.flags.ignoredCopperCan
  ) {
    content += `
    <span id="buyFreeWillButton" class="asciiRealButton">Pay 10 bits to think about why you did that</span>

`;
  }

  if (
    game.unlocks.thoughts &&
    game.currencies.copper >= BENT_MAGNET_COST &&
    !game.inventory.bentMagnet &&
    !game.flags.investigatedMagnet
  ) {
    content += `
${makeBox("SOMETHING ODD", [
  "Something is poking out of the ground.",
  "",
  "It is bent.",
  "It is rusty.",
  "It might be looking at you.",
])}

    <span id="investigateMagnetButton" class="asciiRealButton">See something poking out of the ground. Investigate?</span>

`;
  }

  if (
    game.unlocks.thoughts &&
    game.currencies.copper >= BENT_MAGNET_COST &&
    !game.inventory.bentMagnet &&
    game.flags.investigatedMagnet
  ) {
    content += `
${makeBox("NEW ITEM", [
  "You uncover a bent magnet.",
  "It's weak, rusty, and slightly rude.",
  "To win the magnet over you have to pay.",
  "",
  `Cost: ${BENT_MAGNET_COST} copper bits`,
])}

    <span id="buyBentMagnetButton" class="asciiRealButton">Buy a bent magnet</span>

`;
  }

  if (
    game.inventory.bentMagnet &&
    !game.flags.disturbedBeehive &&
    game.currencies.copper >= BEEHIVE_UNLOCK_AMOUNT
  ) {
    content += `
${makeBox("DISTANT BUZZING", [
  "Something nearby has decided the forest needs more bees.",
  "",
  "The bent magnet twitches as if this is somehow your problem now.",
])}

    <span id="disturbBeehiveButton" class="asciiRealButton">Disturb the local beehive</span>

`;
  }

  if (
    game.inventory.bentMagnet &&
    game.flags.disturbedBeehive &&
    game.currencies.copper >= MAP_UNLOCK_AMOUNT
  ) {
    content += `
${makeBox("SOMETHING MOVES", [
  "The bent magnet turns in your hand.",
  "",
  "It points past the copper can, toward a path deeper in the woods.",
])}

    <span id="unlockMapButton" class="asciiRealButton">Venture toward the wooded path</span>

`;
  }

  if (game.lastMessage !== "") {
    content += `
${makeBox("MESSAGE", [game.lastMessage])}

`;
  }

  mainContent.innerHTML = content;

  const gatherBitButton = document.getElementById("gatherBitButton");
  if (gatherBitButton) {
    gatherBitButton.addEventListener("click", gatherCopperBit);
  }

  const refuseCopperCanButton = document.getElementById(
    "refuseCopperCanButton",
  );
  if (refuseCopperCanButton) {
    refuseCopperCanButton.addEventListener("click", refuseCopperCan);
  }

  const ignoreCopperCanButton = document.getElementById(
    "ignoreCopperCanButton",
  );
  if (ignoreCopperCanButton) {
    ignoreCopperCanButton.addEventListener("click", ignoreCopperCan);
  }

  const buyFreeWillButton = document.getElementById("buyFreeWillButton");
  if (buyFreeWillButton) {
    buyFreeWillButton.addEventListener("click", buyFreeWill);
  }

  const throwBitsButton = document.getElementById("throwBitsButton");
  if (throwBitsButton) {
    throwBitsButton.addEventListener("click", throwBitsOnGround);
  }

  const investigateMagnetButton = document.getElementById(
    "investigateMagnetButton",
  );
  if (investigateMagnetButton) {
    investigateMagnetButton.addEventListener("click", investigateMagnet);
  }

  const buyBentMagnetButton = document.getElementById("buyBentMagnetButton");
  if (buyBentMagnetButton) {
    buyBentMagnetButton.addEventListener("click", buyBentMagnet);
  }

  const disturbBeehiveButton = document.getElementById("disturbBeehiveButton");
  if (disturbBeehiveButton) {
    disturbBeehiveButton.addEventListener("click", disturbBeehive);
  }

  const unlockMapButton = document.getElementById("unlockMapButton");
  if (unlockMapButton) {
    unlockMapButton.addEventListener("click", unlockMap);
  }
}

export function renderMapView() {
  setMainContentMode();
  mainContent.innerHTML = `
${forest}


${makePreformattedBox("MAP", mapLines)}


    <span id="visitCopperCanButton" class="asciiRealButton">Visit the copper can</span>


    <span id="visitDarkTreesButton" class="asciiRealButton">Follow the path deeper into the woods</span>
    

    <span id="fightDarkTreesButton" class="asciiRealButton">Face the rusty iron sign</span>

`;

  document
    .getElementById("visitCopperCanButton")
    .addEventListener("click", visitCopperCan);
  document
    .getElementById("visitDarkTreesButton")
    .addEventListener("click", visitDarkTrees);
  document
    .getElementById("fightDarkTreesButton")
    .addEventListener("click", startDarkTreeFight);
}

export function renderForestPathScreen() {
  game.world.screen = "forestPath";
  saveGame();
  setMainContentMode();

  renderTopBar();

  mainContent.innerHTML = `
${forest}


    <span id="followPathButton" class="asciiRealButton">Follow path?</span>

`;

  document
    .getElementById("followPathButton")
    .addEventListener("click", followWoodedPath);
  attachTopBarListeners();
}

export function renderBlankPathScreen() {
  game.world.screen = "blankPath";
  saveGame();
  setMainContentMode();

  renderTopBar();
  mainContent.innerHTML = `
${forestTrailSignScene}


    <span id="continueTrailButton" class="asciiRealButton">Continue on the Trail</span>
`;
  document
    .getElementById("continueTrailButton")
    .addEventListener("click", continueOnTrail);
  attachTopBarListeners();
}

export function renderTownScreen() {
  game.world.screen = "town";
  saveGame();
  setMainContentMode();

  renderTopBar();
  mainContent.innerHTML = `
${townScene}
`;
  attachTopBarListeners();
}

export function renderPackView() {
  setMainContentMode();
  const magnetText = game.inventory.bentMagnet ? "Bent magnet" : "Nothing useful yet";

  mainContent.innerHTML = `
${makeBox("PACK", [
  "Copper can",
  magnetText,
  "",
  "The pack is where found things gather.",
  "Some of them may be useful.",
])}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

export function renderThoughtsView() {
  setMainContentMode();
  const unlockedThoughts = thoughts.filter((thought) =>
    thought.isUnlocked(game),
  );

  const thoughtLines = unlockedThoughts.flatMap((thought, index) => {
    const prefix = `${index + 1}. `;
    const indent = " ".repeat(prefix.length);
    const wrappedLines = wrapText(thought.text, BOX_TEXT_WIDTH - prefix.length);

    return wrappedLines.map((line, lineIndex) => {
      return lineIndex === 0 ? prefix + line : indent + line;
    });
  });

  mainContent.innerHTML = `
${makeBox("THOUGHTS", thoughtLines)}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

export function renderSaveView() {
  setMainContentMode();
  mainContent.innerHTML = `
${makeBox("SAVE", [
  "The forest remembers you automatically.",
  "",
  "Your progress is stored in localStorage.",
  "You can also press the button below to save manually.",
])}


    <span id="manualSaveButton" class="asciiRealButton">Save now</span>

`;

  document
    .getElementById("manualSaveButton")
    .addEventListener("click", manualSave);
}

export function renderSettingsView() {
  setMainContentMode();
  mainContent.innerHTML = `
${makeBox("SETTINGS", [
  "There are not many settings yet.",
  "",
  "Resetting will erase your saved prototype progress and return to the Untitled screen.",
])}


    <span id="resetButton" class="asciiRealButton">Reset prototype</span>

`;

  document
    .getElementById("resetButton")
    .addEventListener("click", resetPrototype);
}

export function renderCombatView() {
  setMainContentMode("combatView");

  const enemy = combatEnemies[game.combat.enemyId];

  if (!enemy) {
    mainContent.innerHTML = "";
    return;
  }

  const phaseLabel = game.combat.canExit
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
${makePreformattedBox("FIGHT", combatLines, COMBAT_ARENA_WIDTH)}
`;

  if (game.combat.canExit) {
    content += `

    <span id="exitCombatButton" class="asciiRealButton">Exit fight</span>

`;
  }

  mainContent.innerHTML = content;

  const exitCombatButton = document.getElementById("exitCombatButton");
  if (exitCombatButton) {
    exitCombatButton.addEventListener("click", exitCombat);
  }
}

export function renderTitleRevealScreen() {
  game.world.screen = "titleReveal";
  game.flags.seenTitleReveal = true;
  saveGame();
  setMainContentMode();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


${copperCanTitleArt}

                         The can, the magnet, the map...

                         They were not separate things.

                         They were the beginning of something.


                            THE COPPER CAN


                                 <span id="continueButton" class="asciiRealButton">Continue</span>


`;

  document
    .getElementById("continueButton")
    .addEventListener("click", continueFromTitleReveal);
}
