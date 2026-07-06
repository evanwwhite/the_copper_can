import { game } from "../gameState.js";
import { darkTreeWatcherArt } from "../asciiArtHelper.js";
import {
  darkForestOldRoot,
  darkForestPineHollow,
  darkForestWatcherBase,
} from "../asciiArt/scenes/darkForestScenes.js";
import { saveGame } from "../saveSystem.js";
import { leaveDarkForest, startDarkTreeFight } from "../actions.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const DARK_FOREST_SCENE_WIDTH = 112;
const DARK_FOREST_SCENE_COUNT = 3;
const DARK_FOREST_WATCHER_SCENE_INDEX = 2;

const DARK_FOREST_WATCHER_POSITION = {
  x: 41,
  y: 12,
};

function getLineBounds(line) {
  const firstVisibleColumn = line.search(/\S/);

  if (firstVisibleColumn === -1) {
    return null;
  }

  let lastVisibleColumn = line.length - 1;

  while (
    lastVisibleColumn > firstVisibleColumn &&
    line[lastVisibleColumn] === " "
  ) {
    lastVisibleColumn -= 1;
  }

  return {
    firstVisibleColumn,
    lastVisibleColumn,
  };
}

function placeSpriteWithRowMask(canvas, spriteLines, x, y) {
  spriteLines.forEach((line, rowOffset) => {
    const lineBounds = getLineBounds(line);

    if (!lineBounds) return;

    const rowIndex = y + rowOffset;

    if (rowIndex < 0 || rowIndex >= canvas.length) {
      return;
    }

    for (
      let columnOffset = lineBounds.firstVisibleColumn;
      columnOffset <= lineBounds.lastVisibleColumn;
      columnOffset += 1
    ) {
      const columnIndex = x + columnOffset;

      if (columnIndex < 0 || columnIndex >= canvas[0].length) {
        continue;
      }

      canvas[rowIndex][columnIndex] = line[columnOffset] ?? " ";
    }
  });
}

function getDarkForestSceneIndex() {
  const sceneIndex = game.world.darkForestSceneIndex ?? 0;

  if (
    !Number.isInteger(sceneIndex) ||
    sceneIndex < 0 ||
    sceneIndex >= DARK_FOREST_SCENE_COUNT
  ) {
    game.world.darkForestSceneIndex = 0;
    return 0;
  }

  return sceneIndex;
}

// Scene art lives as baked literals in js/asciiArt/scenes/darkForestScenes.js.
// Regenerate them with: bun scripts/bakeScenes.mjs emit
function createWatcherSceneLines() {
  const sceneLines = darkForestWatcherBase.split("\n");

  if (game.flags.defeatedDarkTreeWatcher) {
    return sceneLines;
  }

  const canvas = sceneLines.map(line => [...line]);

  placeSpriteWithRowMask(
    canvas,
    darkTreeWatcherArt,
    DARK_FOREST_WATCHER_POSITION.x,
    DARK_FOREST_WATCHER_POSITION.y,
  );

  return canvas.map(row => row.join(""));
}

function createDarkForestSceneLines() {
  const sceneIndex = getDarkForestSceneIndex();

  if (sceneIndex === 1) return darkForestPineHollow.split("\n");
  if (sceneIndex === DARK_FOREST_WATCHER_SCENE_INDEX) {
    return createWatcherSceneLines();
  }

  return darkForestOldRoot.split("\n");
}

function isDarkForestWatcherCell(x, y) {
  if (getDarkForestSceneIndex() !== DARK_FOREST_WATCHER_SCENE_INDEX) {
    return false;
  }

  if (game.flags.defeatedDarkTreeWatcher) {
    return false;
  }

  const rowOffset = y - DARK_FOREST_WATCHER_POSITION.y;

  if (rowOffset < 0 || rowOffset >= darkTreeWatcherArt.length) {
    return false;
  }

  const line = darkTreeWatcherArt[rowOffset];
  const columnOffset = x - DARK_FOREST_WATCHER_POSITION.x;

  return columnOffset >= 0 &&
    columnOffset < line.length &&
    line[columnOffset] !== " ";
}

function createDarkForestSceneMarkup() {
  return createDarkForestSceneLines().map((line, y) => {
    return [...line].map((character, x) => {
      const visibleCharacter = escapeHtml(character);

      if (!isDarkForestWatcherCell(x, y)) {
        return visibleCharacter;
      }

      return `<span class="darkTreeWatcherSprite">${visibleCharacter}</span>`;
    }).join("");
  }).join("\n");
}

function createDarkForestNavigationButton(direction, label) {
  return (
    `<span class="asciiRealButton" data-dark-forest-direction="${direction}">` +
    `${escapeHtml(label)}</span>`
  );
}

function createDarkForestNavigationMarkup() {
  const leftLabel = "< Left";
  const rightLabel = "Right >";
  const leftButton = createDarkForestNavigationButton(-1, leftLabel);
  const rightButton = createDarkForestNavigationButton(1, rightLabel);
  const spaceCount = Math.max(
    DARK_FOREST_SCENE_WIDTH - leftLabel.length - rightLabel.length,
    1,
  );

  return `${leftButton}${" ".repeat(spaceCount)}${rightButton}`;
}

function moveDarkForestScene(direction) {
  const sceneIndex = getDarkForestSceneIndex();

  game.world.darkForestSceneIndex =
    (sceneIndex + direction + DARK_FOREST_SCENE_COUNT) %
    DARK_FOREST_SCENE_COUNT;

  renderDarkForestScreen();
}

export function renderDarkForestScreen() {
  game.world.screen = "darkForest";
  getDarkForestSceneIndex();
  saveGame();
  setMainContentMode();

  renderTopBar();
  const isWatcherScene =
    getDarkForestSceneIndex() === DARK_FOREST_WATCHER_SCENE_INDEX;
  const fightButton = isWatcherScene
    ? game.flags.defeatedDarkTreeWatcher
      ? "    The dark forest is quiet now."
      : '    <span id="fightDarkForestWatcherButton" class="asciiRealButton hidden">Fight the fox</span>'
    : "";

  mainContent.innerHTML = `
${createDarkForestSceneMarkup()}


${createDarkForestNavigationMarkup()}


${fightButton}


    <span id="leaveDarkForestButton" class="asciiRealButton">Return to town</span>
`;

  document.querySelectorAll("[data-dark-forest-direction]").forEach(button => {
    button.addEventListener("click", () => {
      moveDarkForestScene(Number(button.dataset.darkForestDirection));
    });
  });

  const fightDarkForestWatcherButton = document.getElementById(
    "fightDarkForestWatcherButton",
  );

  if (fightDarkForestWatcherButton) {
    document.querySelectorAll(".darkTreeWatcherSprite").forEach(element => {
      element.addEventListener("click", () => {
        fightDarkForestWatcherButton.classList.remove("hidden");
      });
    });

    fightDarkForestWatcherButton.addEventListener("click", startDarkTreeFight);
  }

  document
    .getElementById("leaveDarkForestButton")
    .addEventListener("click", leaveDarkForest);
  attachTopBarListeners();
}
