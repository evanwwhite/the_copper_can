import { game } from "../gameState.js";
import {
  darkTreeWatcherArt,
  elderPine,
  layeredPineLarge,
} from "../asciiArtHelper.js";
import {
  darkForestBush,
  lowWideBush,
  pineGroupLarge,
  puffyBushMedium,
  splitBushPair,
} from "../asciiArt/nature.js";
import { saveGame } from "../saveSystem.js";
import { leaveDarkForest, startDarkTreeFight } from "../actions.js";
import { getAsciiLines, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const DARK_FOREST_SCENE_WIDTH = 112;
const DARK_FOREST_SCENE_HEIGHT = 29;
const DARK_FOREST_SCENE_COUNT = 3;
const DARK_FOREST_WATCHER_SCENE_INDEX = 2;

const DARK_FOREST_WATCHER_POSITION = {
  x: 41,
  y: 12,
};

function createDarkForestCanvas() {
  return Array.from({ length: DARK_FOREST_SCENE_HEIGHT }, () =>
    Array.from({ length: DARK_FOREST_SCENE_WIDTH }, () => " "),
  );
}

function placeRiverLine(canvas, x, y, width) {
  placeSprite(canvas, [
    "~".repeat(width),
  ], x, y);
}

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

function placeDepthSortedSprites(canvas, sprites) {
  [...sprites]
    .sort((firstSprite, secondSprite) => firstSprite.y - secondSprite.y)
    .forEach(({ lines, x, y }) => {
      placeSpriteWithRowMask(canvas, lines, x, y);
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

function createWatcherSceneLines() {
  const canvas = createDarkForestCanvas();
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const elderPineLines = getAsciiLines(elderPine);
  const splitBushPairLines = getAsciiLines(splitBushPair);
  const darkForestBushLines = getAsciiLines(darkForestBush);

  placeDepthSortedSprites(canvas, [
    { lines: splitBushPairLines, x: 16, y: 15 },
    //{ lines: darkForestBushLines, x: 34, y: 6 },
    //{ lines: splitBushPairLines, x: 76, y: 6 },
    //{ lines: darkForestBushLines, x: 8, y: 16 },
    //{ lines: splitBushPairLines, x: 52, y: 17 },
    //{ lines: darkForestBushLines, x: 82, y: 16 },
  ]);

  placeDepthSortedSprites(canvas, [
    { lines: layeredPineLines, x: 3, y: 2 },
    { lines: layeredPineLines, x: 11, y: 0 },
    { lines: elderPineLines, x: 18, y: 1 },
    { lines: layeredPineLines, x: 33, y: 0 },
    { lines: elderPineLines, x: 61, y: 4 },
    { lines: elderPineLines, x: 46, y: 0 },
    { lines: layeredPineLines, x: 75, y: 0 },
    { lines: elderPineLines, x: 98, y: 5 },
    { lines: elderPineLines, x: 7, y: 9 },
    { lines: layeredPineLines, x: 27, y: 9 },
    { lines: elderPineLines, x: 55, y: 9 },
    { lines: elderPineLines, x: 84, y: 3 },
    { lines: layeredPineLines, x: 72, y: 8 },
    { lines: layeredPineLines, x: 92, y: 10 },
  ]);

  placeSprite(canvas, [
    "       DARK FOREST",
    "  the trees lean toward the river",
  ], 38, 2);
  placeRiverLine(canvas, 5, 29, 100);

  if (!game.flags.defeatedDarkTreeWatcher) {
    placeSpriteWithRowMask(
      canvas,
      darkTreeWatcherArt,
      DARK_FOREST_WATCHER_POSITION.x,
      DARK_FOREST_WATCHER_POSITION.y,
    );
  }

  return canvas.map(row => row.join(""));
}

function createPineHollowSceneLines() {
  const canvas = createDarkForestCanvas();
  const lowWideBushLines = getAsciiLines(lowWideBush);
  const elderPineLines = getAsciiLines(elderPine);
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const pineGroupLines = getAsciiLines(pineGroupLarge);
  

  placeDepthSortedSprites(canvas, [
    { lines: lowWideBushLines, x: 21, y: 21 },
    { lines: lowWideBushLines, x: 54, y: 15 },
    { lines: layeredPineLines, x: 31, y: 0 },
    { lines: elderPineLines, x: 47, y: 5 },
    { lines: layeredPineLines, x: 19, y: 1 },
    { lines: elderPineLines, x: 3, y: 3 },
    { lines: layeredPineLines, x: 73, y: 0 },
    { lines: elderPineLines, x: 83, y: 2 },
    { lines: layeredPineLines, x: 66, y: 1 },
    { lines: elderPineLines, x: 9, y: 14 },
    { lines: layeredPineLines, x: 38, y: -4 },
    { lines: elderPineLines, x: 58, y: -2 },
    { lines: layeredPineLines, x: 49, y: -5 },
    { lines: layeredPineLines, x: 92, y: 12 },
  ]);

  placeSprite(canvas, [
    "        BLACK PINE HOLLOW",
    "  the path narrows and forgets itself",
  ], 35, 2);
  placeRiverLine(canvas, 6, 28, 100);

  return canvas.map(row => row.join(""));
}

function createOldRootSceneLines() {
  const canvas = createDarkForestCanvas();
  const elderPineLines = getAsciiLines(elderPine);
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const puffyBushLines = getAsciiLines(puffyBushMedium);

  placeDepthSortedSprites(canvas, [
    { lines: layeredPineLines, x: 0, y: 2 },
    { lines: layeredPineLines, x: 9, y: 0 },
    { lines: elderPineLines, x: 20, y: 4 },
    { lines: elderPineLines, x: 14, y: 2 },
    { lines: layeredPineLines, x: 34, y: 1 },
    { lines: elderPineLines, x: 54, y: 5 },
    { lines: layeredPineLines, x: 73, y: 2 },
    { lines: elderPineLines, x: 94, y: 3 },
    { lines: puffyBushLines, x: 7, y: 20 },
    { lines: puffyBushLines, x: 73, y: 18 },
    /*{
      lines: [
        "           ____             ____",
        "      __.-'    '-.__   __.-'    '-.__",
        "__..-'              '-'              '-..__",
        "      \\__        old roots        __/",
        "         '._                  _.'",
      ],
      x: 12,
      y: 16,
    },*/
  ]);

  placeSprite(canvas, [
    "          OLD ROOT STAND",
    "  the trees knit their feet together",
  ], 36, 2);
  placeRiverLine(canvas, 5, 28, 100);

  return canvas.map(row => row.join(""));
}

function createDarkForestSceneLines() {
  const sceneIndex = getDarkForestSceneIndex();

  if (sceneIndex === 1) return createPineHollowSceneLines();
  if (sceneIndex === DARK_FOREST_WATCHER_SCENE_INDEX) {
    return createWatcherSceneLines();
  }

  return createOldRootSceneLines();
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
