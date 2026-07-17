import { game } from "../gameState.js";
import { centerText } from "../helpers.js";
import { switchView, viewWorldMap } from "../actions.js";
import { statusBar } from "./dom.js";

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

export function renderTopBar() {
  const screensWithTopBar = [
    "game",
    "forestPath",
    "blankPath",
    "town",
    "townInterior",
    "darkForest",
    "walk",
  ];

  if (!screensWithTopBar.includes(game.world.screen)) {
    statusBar.textContent = "";
    return;
  }

  const showHealthBar =
    game.flags.disturbedBeehive ||
    game.combat.active ||
    (game.world.screen === "walk" && game.walk.active);

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
    true,
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
  if (game.combat.active || (game.world.screen === "walk" && game.walk.active)) {
    return;
  }

  const mapTab = document.getElementById("mapTab");
  if (mapTab) {
    mapTab.addEventListener("click", () => {
      if (game.world.currentView === "map") {
        viewWorldMap();
        return;
      }

      switchView("map");
    });
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
