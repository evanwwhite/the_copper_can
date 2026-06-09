import { game } from "../gameState.js";
import {
  darkTreeWatcherArt,
  elderPine,
  layeredPineLarge,
} from "../asciiArt.js";
import { saveGame } from "../saveSystem.js";
import { leaveDarkForest, startDarkTreeFight } from "../actions.js";
import { getAsciiLines, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const DARK_FOREST_WATCHER_POSITION = {
  x: 53,
  y: 21,
};

function createDarkForestSceneLines() {
  const width = 112;
  const height = 29;
  const canvas = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => " "),
  );
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const elderPineLines = getAsciiLines(elderPine);

  placeSprite(canvas, layeredPineLines, 4, 1);
  placeSprite(canvas, elderPineLines, 23, 5);
  placeSprite(canvas, layeredPineLines, 39, 0);
  placeSprite(canvas, elderPineLines, 61, 4);
  placeSprite(canvas, layeredPineLines, 82, 1);
  placeSprite(canvas, elderPineLines, 96, 7);

  placeSprite(canvas, elderPineLines, 7, 13);
  placeSprite(canvas, layeredPineLines, 31, 12);
  placeSprite(canvas, elderPineLines, 55, 14);
  placeSprite(canvas, layeredPineLines, 76, 13);

  placeSprite(canvas, [
    "       DARK FOREST",
    "  the trees lean toward the river",
  ], 38, 2);
  placeSprite(canvas, [
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  ], 14, 25);
  if (!game.flags.defeatedDarkTreeWatcher) {
    placeSprite(
      canvas,
      darkTreeWatcherArt,
      DARK_FOREST_WATCHER_POSITION.x,
      DARK_FOREST_WATCHER_POSITION.y,
    );
  }

  return canvas.map(row => row.join(""));
}

function isDarkForestWatcherCell(x, y) {
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

export function renderDarkForestScreen() {
  game.world.screen = "darkForest";
  saveGame();
  setMainContentMode();

  renderTopBar();
  const fightButton = game.flags.defeatedDarkTreeWatcher
    ? "    The dark forest is quiet now."
    : '    <span id="fightDarkForestWatcherButton" class="asciiRealButton hidden">Fight the darkTree watcher</span>';

  mainContent.innerHTML = `
${createDarkForestSceneMarkup()}


${fightButton}


    <span id="leaveDarkForestButton" class="asciiRealButton">Return to town</span>
`;

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
