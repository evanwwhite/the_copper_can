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
import {
  manualSave,
  resetPrototype,
  switchView,
  toggleEquip,
} from "../actions.js";
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

// Items that can be equipped for combat, keyed by their grid column index.
const EQUIPPABLE_BY_INDEX = { 3: "slingshot", 4: "boots", 5: "sword" };

function buildPackInventoryArt() {
  const items = [
    { has: game.inventory.copperCan, art: copperCanAsset },
    { has: game.inventory.bentMagnet, art: bentMagnetAsset },
    { has: game.inventory.map, art: mapAsset },
    { has: game.inventory.slingshot, art: slingshotAsset },
    { has: game.inventory.boots, art: bootsAsset },
    { has: game.inventory.sword, art: swordAsset },
  ];

  const overlays = [];

  items.forEach((item, index) => {
    if (!item.has) return;

    overlays.push(centerInCell(item.art, index));

    // Mark equipped gear with a star on its cell's top border so the item
    // itself visibly changes when equipped.
    const equipKey = EQUIPPABLE_BY_INDEX[index];
    if (equipKey && game.inventory[`${equipKey}Equipped`]) {
      overlays.push({
        art: "*",
        x: PACK_GRID.columnStarts[index] + Math.floor(PACK_GRID.cellWidth / 2),
        y: PACK_GRID.cellTop - 1,
      });
    }
  });

  return overlayAsciiArt(inventoryScreenMassive, overlays);
}

function buildGearControls() {
  const gear = [
    { key: "slingshot", label: "Slingshot" },
    { key: "boots", label: "Boots" },
    { key: "sword", label: "Sword" },
  ].filter((item) => game.inventory[item.key]);

  if (gear.length === 0) {
    return escapeHtml(
      makeBox("GEAR", [
        "You have no equippable gear yet.",
        "Buy a slingshot, boots, or a sword in the village.",
      ]),
    );
  }

  const box = escapeHtml(
    makeBox("GEAR", [
      "A * marks equipped gear above.",
      "Only equipped gear affects combat.",
    ]),
  );

  const buttons = gear
    .map((item) => {
      const equipped = game.inventory[`${item.key}Equipped`];
      const state = equipped ? "[EQUIPPED]" : "[ unequipped ]";
      const action = equipped ? "Unequip" : "Equip";
      return `    <span class="asciiRealButton equipButton" data-item="${item.key}">${action} ${item.label}  ${state}</span>`;
    })
    .join("\n\n");

  return `${box}\n\n${buttons}`;
}

export function renderPackView() {
  setMainContentMode();
  const inventoryArt = buildPackInventoryArt();
  const gearControls = buildGearControls();

  mainContent.innerHTML = `
${escapeHtml(inventoryArt)}


${gearControls}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.querySelectorAll(".equipButton").forEach((button) => {
    button.addEventListener("click", () => {
      toggleEquip(button.dataset.item);
    });
  });

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
