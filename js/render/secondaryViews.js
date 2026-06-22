import { game } from "../gameState.js";
import {
  bentMagnetAsset,
  bootsAsset,
  buildThoughtsScreenArt,
  copperCanAsset,
  inventoryScreenMassive,
  mapAsset,
  slingshotAsset,
  swordAsset,
} from "../asciiArtHelper.js";
import { thoughts } from "../data.js";
import { makeBox } from "../helpers.js";
import { manualSave, resetPrototype, switchView } from "../actions.js";
import { overlayAsciiArt, toArtLines } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";

// Geometry of the top item grid in inventoryScreenMassive. Each cell interior
// is 9 columns wide and 3 rows tall; the six cells start at these columns.
const PACK_GRID = {
  cellTop: 4,
  cellHeight: 3,
  cellWidth: 9,
  columnStarts: [3, 13, 23, 33, 43, 53],
};

// Returns an overlay placement for the asset within the grid cell at the given
// column index. Array assets are hand-positioned: they're anchored at the
// cell's top-left so the author's literal spacing controls the offset. String
// assets are auto-centered by their content bounding box.
function centerInCell(art, columnIndex) {
  const cellStart = PACK_GRID.columnStarts[columnIndex];

  if (Array.isArray(art)) {
    return { art, x: cellStart, y: PACK_GRID.cellTop };
  }

  const lines = toArtLines(art);

  let minCol = Infinity;
  let maxCol = -Infinity;
  lines.forEach((line) => {
    const firstNonSpace = line.search(/\S/);
    if (firstNonSpace === -1) return;
    const lastNonSpace = line.replace(/\s+$/, "").length - 1;
    minCol = Math.min(minCol, firstNonSpace);
    maxCol = Math.max(maxCol, lastNonSpace);
  });

  const contentWidth = maxCol - minCol + 1;
  const x =
    cellStart + Math.floor((PACK_GRID.cellWidth - contentWidth) / 2) - minCol;
  const y =
    PACK_GRID.cellTop + Math.floor((PACK_GRID.cellHeight - lines.length) / 2);

  return { art, x, y };
}

function buildPackInventoryArt() {
  const items = [
    { has: game.inventory.copperCan, art: copperCanAsset },
    { has: game.inventory.bentMagnet, art: bentMagnetAsset },
    { has: game.inventory.map, art: mapAsset },
    { has: game.inventory.slingshot, art: slingshotAsset },
    { has: game.inventory.boots, art: bootsAsset },
    { has: game.inventory.sword, art: swordAsset },
  ];

  const overlays = items
    .map((item, index) => (item.has ? centerInCell(item.art, index) : null))
    .filter(Boolean);

  return overlayAsciiArt(inventoryScreenMassive, overlays);
}

export function renderPackView() {
  setMainContentMode();
  const inventoryArt = buildPackInventoryArt();

  mainContent.innerHTML = `
${escapeHtml(inventoryArt)}


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
  const thoughtEntries = unlockedThoughts
    .map((thought, index) => ({
      number: index + 1,
      text: thought.text,
    }))
    .reverse();
  const thoughtsArt = buildThoughtsScreenArt(thoughtEntries);

  mainContent.innerHTML = `
${escapeHtml(thoughtsArt)}


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
