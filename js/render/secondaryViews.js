import { game } from "../gameState.js";
import {
  axe1,
  bentMagnetAsset,
  bootsAsset,
  bootsAsset2,
  buildThoughtsScreenArt,
  copperCanAsset,
  inventoryScreenMassive,
  largeSword1,
  mapAsset,
  shield1,
  shield2,
  shield3,
  shield4,
  slingshotAsset,
  spearAsset,
  swordAsset,
  sword2,
  sword3,
  sword4,
  sword5,
  sword6,
  sword7,
  torch,
} from "../asciiArtHelper.js";
import { BOOTS_DAMAGE_REDUCTION, thoughts } from "../data.js";
import { makeBox } from "../helpers.js";
import {
  EQUIPMENT_DEFINITIONS,
  isEquipmentEquipped,
  SCENE_WEAPONS,
} from "../sceneCombatData.js";
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
  rowStride: 4, // interior height + shared border line
  columnStarts: [3, 13, 23, 33, 43, 53],
};

// These are the real, currently understood items. The showcase items remain in
// the grid below, but intentionally have no hover regions until their gameplay
// identities are designed.
const KNOWN_PACK_ITEMS = [
  {
    key: "copperCan",
    label: "Copper Can",
    type: "Key item / offhand",
    stance: "W — its lid provides active defense",
    art: copperCanAsset,
    col: 0,
    row: 0,
  },
  {
    key: "bentMagnet",
    label: "Bent Magnet",
    type: "Utility item",
    stance: "None — passive outside combat",
    art: bentMagnetAsset,
    col: 1,
    row: 0,
  },
  {
    key: "map",
    label: "Map",
    type: "Key item",
    stance: "None",
    art: mapAsset,
    col: 2,
    row: 0,
  },
  {
    key: "slingshot",
    label: "Slingshot",
    type: "Two-handed ranged weapon",
    stance: "Q — Long range",
    weaponStyles: ["slingshot"],
    art: slingshotAsset,
    col: 3,
    row: 0,
  },
  {
    key: "boots",
    label: "Boots",
    type: "Leg armor",
    stance: "Passive — no weapon stance",
    art: bootsAsset,
    col: 4,
    row: 0,
  },
  {
    key: "sword",
    label: "Sword",
    type: "One-handed / heavy weapon",
    stance: "W — Sword + lid; E — Heavy sword",
    weaponStyles: ["sword", "heavySword"],
    art: swordAsset,
    col: 5,
    row: 0,
  },
  {
    key: "spear",
    label: "Spear",
    type: "Two-handed reach weapon",
    stance: "E — Heavy two-handed",
    weaponStyles: ["spear"],
    art: spearAsset,
    col: 0,
    row: 1,
  },
];

const SHOWCASE_PACK_ITEMS = [
  { art: axe1, col: 1, row: 1 },
  { art: sword2, col: 2, row: 1 },
  { art: sword3, col: 3, row: 1 },
  { art: sword4, col: 4, row: 1 },
  { art: sword5, col: 5, row: 1 },
  { art: sword6, col: 0, row: 2 },
  { art: sword7, col: 1, row: 2 },
  { art: largeSword1, col: 2, row: 2 },
  { art: shield1, col: 3, row: 2 },
  { art: shield2, col: 4, row: 2 },
  { art: shield3, col: 5, row: 2 },
  { art: shield4, col: 0, row: 3 },
  { art: torch, col: 1, row: 3 },
  { art: bootsAsset2, col: 2, row: 3 },
];

// Returns an overlay placement for the asset within the grid cell at the given
// column index. Array assets are hand-positioned: they're anchored at the
// cell's top-left so the author's literal spacing controls the offset. String
// assets are auto-centered by their content bounding box.
function centerInCell(art, columnIndex, rowIndex = 0) {
  const cellStart = PACK_GRID.columnStarts[columnIndex];
  const cellTop = PACK_GRID.cellTop + rowIndex * PACK_GRID.rowStride;

  if (Array.isArray(art)) {
    return { art, x: cellStart, y: cellTop };
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
  const y = cellTop + Math.floor((PACK_GRID.cellHeight - lines.length) / 2);

  return { art, x, y };
}

function buildPackInventoryArt() {
  const items = [
    ...KNOWN_PACK_ITEMS.map((item) => ({
      ...item,
      has: game.inventory[item.key],
      equip: EQUIPMENT_DEFINITIONS[item.key] ? item.key : null,
    })),
    ...SHOWCASE_PACK_ITEMS.map((item) => ({ ...item, has: true })),
  ];

  const overlays = [];

  items.forEach((item) => {
    if (!item.has) return;

    overlays.push(centerInCell(item.art, item.col, item.row));

    // Keep the marker inside the cell so it reads as part of the equipped item.
    if (item.equip && isEquipmentEquipped(game.inventory, item.equip)) {
      overlays.push({
        art: "[E]",
        x: PACK_GRID.columnStarts[item.col],
        y: PACK_GRID.cellTop + item.row * PACK_GRID.rowStride,
      });
    }
  });

  // The brackets in the STATS & GEAR panel are permanent slot positions.
  // Their symbols appear only while the corresponding item is equipped.
  if (isEquipmentEquipped(game.inventory, "slingshot")) {
    overlays.push({ art: "Y", x: 75, y: 18 });
  }
  if (isEquipmentEquipped(game.inventory, "sword")) {
    const swordAndLid = game.inventory.copperCan ? "┼ D" : "┼";
    overlays.push({ art: swordAndLid, x: 79, y: 18 });
  }
  if (isEquipmentEquipped(game.inventory, "spear")) {
    overlays.push({ art: "+──", x: 85, y: 18 });
  }
  if (isEquipmentEquipped(game.inventory, "boots")) {
    overlays.push({ art: "b b", x: 76, y: 22 });
  }

  return overlayAsciiArt(inventoryScreenMassive, overlays);
}

function getPackItemTooltip(item) {
  const equipment = EQUIPMENT_DEFINITIONS[item.key];
  const lines = [
    `Name: ${item.label}`,
    `Type: ${item.type}`,
  ];

  if (equipment) {
    lines.push(
      `Equipped: ${isEquipmentEquipped(game.inventory, item.key) ? "Yes" : "No"}`,
    );
  } else if (item.key === "copperCan") {
    lines.push("Equipped: Baseline offhand while carried");
  } else {
    lines.push("Equipped: Not equippable");
  }

  if (item.weaponStyles) {
    item.weaponStyles.forEach((weaponKey) => {
      const weapon = SCENE_WEAPONS[weaponKey];
      lines.push(
        `${weapon.label}: damage ${weapon.damage[0]}-${weapon.damage[1]}, ` +
        `range ${weapon.minRange}-${weapon.maxRange}`,
      );
    });
  } else if (item.key === "boots") {
    lines.push(`Passive: reduces each incoming hit by ${BOOTS_DAMAGE_REDUCTION}`);
  } else if (item.key === "bentMagnet") {
    lines.push(
      `Passive: collects ${game.inventory.bentMagnetBitsPerSecond} copper/second`,
    );
  } else if (item.key === "map") {
    lines.push("Passive: records known routes and enables map travel");
  } else if (item.key === "copperCan") {
    lines.push("Passive: its lid enables timed defense in the W stance");
  }

  lines.push(`Combat stance: ${item.stance}`);
  return makeBox(item.label.toUpperCase(), lines);
}

function buildPackHoverRegions() {
  return KNOWN_PACK_ITEMS
    .filter((item) => game.inventory[item.key])
    .map((item) => {
      const left = PACK_GRID.columnStarts[item.col];
      const top = (PACK_GRID.cellTop + item.row * PACK_GRID.rowStride) * 1.2;
      const equippable = Boolean(EQUIPMENT_DEFINITIONS[item.key]);
      const action = equippable
        ? `${isEquipmentEquipped(game.inventory, item.key) ? "Unequip" : "Equip"} ${item.label}`
        : `Inspect ${item.label}`;
      const equipmentClass = equippable ? " packItemEquippable" : "";
      const buttonRole = equippable ? ' role="button"' : "";
      return `<span class="packItemHoverRegion${equipmentClass}" data-pack-hover-item="${item.key}" aria-label="${action}"${buttonRole} tabindex="0" style="left:${left}ch;top:${top}em;width:${PACK_GRID.cellWidth}ch;height:${PACK_GRID.cellHeight * 1.2}em"></span>`;
    })
    .join("");
}

function positionPackTooltip(event, tooltip) {
  const padding = 12;
  const maximumLeft = window.innerWidth - tooltip.offsetWidth - padding;
  const maximumTop = window.innerHeight - tooltip.offsetHeight - padding;
  tooltip.style.left = `${Math.max(padding, Math.min(event.clientX + padding, maximumLeft))}px`;
  tooltip.style.top = `${Math.max(padding, Math.min(event.clientY + padding, maximumTop))}px`;
}

function attachPackHoverListeners() {
  const tooltip = document.getElementById("packItemTooltip");
  const tooltipInfo = document.getElementById("packItemTooltipInfo");
  if (!tooltip || !tooltipInfo) return;

  let hideTimer = null;
  const cancelHide = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };
  const hideTooltip = () => {
    hideTimer = window.setTimeout(() => {
      tooltip.hidden = true;
      hideTimer = null;
    }, 120);
  };

  const showTooltip = (region, event = null) => {
    cancelHide();
    const item = KNOWN_PACK_ITEMS.find(
      (candidate) => candidate.key === region.dataset.packHoverItem,
    );
    if (!item) return;
    tooltipInfo.textContent = getPackItemTooltip(item);
    tooltip.hidden = false;
    if (event) {
      positionPackTooltip(event, tooltip);
    } else {
      const bounds = region.getBoundingClientRect();
      positionPackTooltip(
        { clientX: bounds.right, clientY: bounds.top },
        tooltip,
      );
    }
  };

  document.querySelectorAll("[data-pack-hover-item]").forEach((region) => {
    region.addEventListener("mouseenter", (event) => {
      showTooltip(region, event);
    });
    region.addEventListener("mousemove", (event) => {
      positionPackTooltip(event, tooltip);
    });
    region.addEventListener("mouseleave", () => {
      hideTooltip();
    });
    region.addEventListener("click", () => {
      const itemKey = region.dataset.packHoverItem;
      if (EQUIPMENT_DEFINITIONS[itemKey]) {
        toggleEquip(itemKey);
      }
    });
    region.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      region.click();
    });
    region.addEventListener("focus", () => showTooltip(region));
    region.addEventListener("blur", () => {
      hideTooltip();
    });
  });

  tooltip.addEventListener("mouseenter", cancelHide);
  tooltip.addEventListener("mouseleave", hideTooltip);
}

function buildGearHelp() {
  return escapeHtml(
    makeBox("GEAR", [
      "An [E] marker inside a cell means that item is equipped.",
      "Only equipped gear affects combat.",
      "Click an equippable item to equip or unequip it.",
      "Hover or focus an item to inspect its details.",
    ]),
  );
}

export function renderPackView() {
  setMainContentMode();
  const inventoryArt = buildPackInventoryArt();
  const hoverRegions = buildPackHoverRegions();
  const gearHelp = buildGearHelp();

  mainContent.innerHTML = `
<div class="packInventoryStage"><pre class="packInventoryArt">${escapeHtml(inventoryArt)}</pre>${hoverRegions}<div id="packItemTooltip" class="packItemTooltip" hidden><pre id="packItemTooltipInfo"></pre></div></div>


${gearHelp}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  attachPackHoverListeners();

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
