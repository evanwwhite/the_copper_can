import { game } from "../gameState.js";
import { townScene } from "../asciiArtHelper.js";
import {
  blacksmithInterior,
  riversideInnInterior,
  villageHallBase,
  villageShopInterior,
} from "../asciiArt/scenes/interiorScenes.js";
import { makeBox, makeMessageBox } from "../helpers.js";
import {
  BOOTS_COST,
  INN_REST_COST,
  SLINGSHOT_COST,
  SPEAR_COST,
  SWORD_COST,
} from "../data.js";
import { saveGame } from "../saveSystem.js";
import {
  acceptDarkForestChallenge,
  buyBoots,
  buySlingshot,
  buySpear,
  buySword,
  enterDarkForest,
  enterTownBuilding,
  leaveTownBuilding,
  receiveVillageMap,
  restAtInn,
} from "../actions.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const TOWN_BUILDING_HOVER_REGIONS = [
  { id: "riversideInn", label: "Riverside Inn", x: 6, y: 23, width: 16, height: 6, canEnter: true },
  { id: "villageHall", label: "Village Hall", x: 54, y: 21, width: 20, height: 5, canEnter: true },
  { id: "villageShop", label: "Village Shop", x: 29, y: 22, width: 10, height: 5, canEnter: true },
  { id: "blacksmith", label: "Blacksmith", x: 77, y: 28, width: 21, height: 5, canEnter: true },
];

const LOCKABLE_BUILDING_IDS = ["riversideInn", "villageShop", "blacksmith"];

const TOWN_LOCKED_MESSAGE =
  "The doors are barred. While the fox prowls the far bank, the village " +
  "has locked every shop and shuttered the inn. Drive the fox off and they " +
  "will open again.";

// The interior scenes are 80 characters wide. A 74-character text area plus
// the frame and padding aligns the dialogue panel with the scene above it.
const INTERIOR_PANEL_WIDTH = 74;

function isBuildingLocked(id) {
  return (
    LOCKABLE_BUILDING_IDS.includes(id) && !game.flags.defeatedDarkTreeWatcher
  );
}

const DARK_FOREST_HOVER_REGION = {
  id: "darkForest",
  label: "Dark Forest",
  canEnter: true,
  parts: [
    { x: 44, y: 4, width: 9, height: 4 },
    { x: 44, y: 8, width: 8, height: 1 },
    { x: 44, y: 9, width: 8, height: 1 },
    { x: 44, y: 10, width: 8, height: 1 },
    { x: 44, y: 11, width: 8, height: 1 },
  ],
};

const VILLAGE_HALL_CHALLENGE_DIALOGUE = [
  [
    "At night, a terrifying creature comes",
    "down from the dark trees across",
    "the river.",
  ],
  [
    "It scratches at shutters, steals",
    "from the hearths, and leaves",
    "claw marks in the mud.",
  ],
  [
    "Cross the river and face it.",
    "Avenge this town before the",
    "next moon rises.",
  ],
];

const VILLAGE_HALL_WAITING_DIALOGUE = [
  [
    "The dark forest waits across",
    "the river.",
  ],
  [
    "Return when the creature can",
    "trouble us no longer.",
  ],
];

const VILLAGE_HALL_REWARD_DIALOGUE = [
  [
    "You came back.",
    "The shutters stayed still last",
    "night for the first time in years.",
  ],
  [
    "You liberated this village.",
    "Please take our oldest road map",
    "as thanks.",
  ],
];

const VILLAGE_HALL_THANKS_DIALOGUE = [
  [
    "The village breathes easier",
    "because of you.",
  ],
  [
    "Keep that map close.",
    "It knows the bends in the road",
    "better than memory does.",
  ],
];

function getVillageHallDialogue() {
  if (game.flags.receivedVillageMap) {
    return VILLAGE_HALL_THANKS_DIALOGUE;
  }

  if (game.flags.defeatedDarkTreeWatcher) {
    return VILLAGE_HALL_REWARD_DIALOGUE;
  }

  if (game.flags.acceptedDarkForestChallenge) {
    return VILLAGE_HALL_WAITING_DIALOGUE;
  }

  return VILLAGE_HALL_CHALLENGE_DIALOGUE;
}

function getActiveTownHoverRegions() {
  const buildings = TOWN_BUILDING_HOVER_REGIONS.map(region => {
    const locked = isBuildingLocked(region.id);

    return {
      ...region,
      locked,
      canEnter: region.canEnter && !locked,
    };
  });

  if (!game.flags.acceptedDarkForestChallenge) {
    return buildings;
  }

  return [...buildings, DARK_FOREST_HOVER_REGION];
}

function getTownBuildingRegion(x, y) {
  return getActiveTownHoverRegions().find(region => {
    if (region.parts) {
      return region.parts.some(part => {
        return (
          x >= part.x &&
          x < part.x + part.width &&
          y >= part.y &&
          y < part.y + part.height
        );
      });
    }

    return (
      x >= region.x &&
      x < region.x + region.width &&
      y >= region.y &&
      y < region.y + region.height
    );
  });
}

function buildTownSceneMarkup() {
  const lines = townScene.split("\n");

  const sceneMarkup = lines.map((line, y) => {
    return [...line].map((character, x) => {
      const region = getTownBuildingRegion(x, y);
      const visibleCharacter = escapeHtml(character);

      if (!region) {
        return visibleCharacter;
      }

      const label = escapeHtml(region.label);
      const buildingId = escapeHtml(region.id);
      const classes = region.canEnter
        ? "townBuildingHover townBuildingEnterable"
        : "townBuildingHover";

      return `<span class="${classes}" data-town-building="${buildingId}" data-town-label="${label}">${visibleCharacter}</span>`;
    }).join("");
  }).join("\n");

  return `<span id="townScene" class="townScene">${sceneMarkup}</span><span id="townHoverLabel" class="townHoverLabel"></span>`;
}

function hideTownHoverLabel(hoverLabel) {
  hoverLabel.classList.remove("visible");
  hoverLabel.textContent = "";
}

function getTownSceneMetrics(townSceneElement) {
  const bounds = townSceneElement.getBoundingClientRect();
  const lines = townScene.split("\n");
  const widestLineWidth = Math.max(...lines.map(line => [...line].length), 1);
  const style = window.getComputedStyle(townSceneElement);
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;

  return {
    charWidth: bounds.width / widestLineWidth,
    lineHeight,
    left: bounds.left,
    top: bounds.top,
  };
}

function positionTownHoverLabel(hoverLabel, townSceneElement, region) {
  const metrics = getTownSceneMetrics(townSceneElement);
  const parts = region.parts ?? [region];
  const leftColumn = Math.min(...parts.map(part => part.x));
  const rightColumn = Math.max(...parts.map(part => part.x + part.width));
  const bottomRow = Math.max(...parts.map(part => part.y + part.height));
  const centerColumn = (leftColumn + rightColumn) / 2;

  hoverLabel.style.left = `${metrics.left + centerColumn * metrics.charWidth}px`;
  hoverLabel.style.top = `${metrics.top + bottomRow * metrics.lineHeight + 4}px`;
}

function attachTownHoverListeners() {
  const townSceneElement = document.getElementById("townScene");
  const hoverLabel = document.getElementById("townHoverLabel");

  if (!townSceneElement || !hoverLabel) {
    return;
  }

  townSceneElement.addEventListener("mousemove", event => {
    const target = event.target instanceof Element
      ? event.target.closest(".townBuildingHover")
      : null;

    if (!target || !townSceneElement.contains(target)) {
      hideTownHoverLabel(hoverLabel);
      return;
    }

    const region = getActiveTownHoverRegions().find(item => {
      return item.id === target.dataset.townBuilding;
    });

    if (!region) {
      hideTownHoverLabel(hoverLabel);
      return;
    }

    hoverLabel.textContent = region.locked
      ? `${region.label} (locked)`
      : region.label;
    positionTownHoverLabel(hoverLabel, townSceneElement, region);
    hoverLabel.classList.add("visible");
  });

  townSceneElement.addEventListener("mouseleave", () => {
    hideTownHoverLabel(hoverLabel);
  });

  townSceneElement.addEventListener("click", event => {
    const target = event.target instanceof Element
      ? event.target.closest(".townBuildingHover")
      : null;

    if (!target || !townSceneElement.contains(target)) {
      return;
    }

    const region = getActiveTownHoverRegions().find(item => {
      return item.id === target.dataset.townBuilding;
    });

    if (!region) {
      return;
    }

    if (region.locked) {
      game.lastMessage = TOWN_LOCKED_MESSAGE;
      saveGame();
      renderTownScreen();
      return;
    }

    if (!region.canEnter) {
      return;
    }

    if (region.id === "darkForest") {
      enterDarkForest();
      return;
    }

    enterTownBuilding(region.id);
  });
}

function buildRiversideInnInteriorLines() {
  return riversideInnInterior;
}

function buildVillageShopInteriorLines() {
  return villageShopInterior;
}

function buildBlacksmithInteriorLines() {
  return blacksmithInterior;
}

function getTownInteriorScene(buildingId) {
  if (buildingId === "villageHall") return villageHallBase;

  if (buildingId === "riversideInn") return buildRiversideInnInteriorLines();
  if (buildingId === "villageShop") return buildVillageShopInteriorLines();
  if (buildingId === "blacksmith") return buildBlacksmithInteriorLines();

  return villageHallBase;
}

function makeBuyButton(id, label, cost, owned) {
  if (owned) {
    return `    <span class="asciiRealButton">${label} — Owned</span>`;
  }

  return `    <span id="${id}" class="asciiRealButton">${label} (${cost}c)</span>`;
}

function buildBuildingActionButtons(buildingId) {
  if (buildingId === "villageShop") {
    return [
      makeBuyButton(
        "buySlingshotButton",
        "Buy Slingshot",
        SLINGSHOT_COST,
        game.inventory.slingshot,
      ),
      makeBuyButton(
        "buyBootsButton",
        "Buy Boots",
        BOOTS_COST,
        game.inventory.boots,
      ),
    ].join("\n\n");
  }

  if (buildingId === "blacksmith") {
    return [
      makeBuyButton(
        "buySwordButton",
        "Buy Sword",
        SWORD_COST,
        game.inventory.sword,
      ),
      makeBuyButton(
        "buySpearButton",
        "Buy Spear",
        SPEAR_COST,
        game.inventory.spear,
      ),
    ].join("\n\n");
  }

  if (buildingId === "riversideInn") {
    return `    <span id="restAtInnButton" class="asciiRealButton">Rest &amp; Recover (${INN_REST_COST}c)</span>`;
  }

  return "";
}

export function renderTownScreen() {
  game.world.screen = "town";
  saveGame();
  setMainContentMode();

  const townMessage =
    game.lastMessage !== ""
      ? `\n\n${makeMessageBox(game.lastMessage)}\n`
      : "";

  renderTopBar();
  mainContent.innerHTML = `
${buildTownSceneMarkup()}
${townMessage}`;
  attachTownHoverListeners();
  attachTopBarListeners();
}

export function renderTownInteriorScreen(villageHallDialogueStep = 0) {
  game.world.screen = "townInterior";
  saveGame();
  setMainContentMode();

  const isVillageHall = game.world.currentView === "villageHall";
  const villageHallDialogue = getVillageHallDialogue();
  const isFinalVillageHallStep =
    villageHallDialogueStep >= villageHallDialogue.length - 1;
  const villageHallDialogueButton = !isFinalVillageHallStep
    ? '<span id="nextVillageHallDialogueButton" class="asciiRealButton">Continue</span>'
    : game.flags.defeatedDarkTreeWatcher && !game.flags.receivedVillageMap
      ? '<span id="receiveVillageMapButton" class="asciiRealButton">Accept the Map</span>'
      : !game.flags.acceptedDarkForestChallenge
        ? '<span id="acceptDarkForestChallengeButton" class="asciiRealButton">Take up the Challenge</span>'
        : "";
  const leaveButton =
    '    <span id="leaveTownBuildingButton" class="asciiRealButton">Leave</span>';
  const buildingActionButtons = isVillageHall
    ? villageHallDialogueButton
      ? `    ${villageHallDialogueButton}`
      : ""
    : buildBuildingActionButtons(game.world.currentView);
  const interiorButtons = buildingActionButtons
    ? `${buildingActionButtons}\n\n\n${leaveButton}`
    : leaveButton;

  const interiorMessage =
    !isVillageHall && game.lastMessage !== ""
      ? `\n${makeMessageBox(game.lastMessage, INTERIOR_PANEL_WIDTH)}\n\n`
      : "";
  const dialogueLines = isVillageHall
    ? villageHallDialogue[villageHallDialogueStep] ??
      villageHallDialogue[villageHallDialogue.length - 1]
    : [];
  const dialoguePanel = isVillageHall
    ? `\n${makeBox("VILLAGER", dialogueLines, INTERIOR_PANEL_WIDTH)}\n`
    : "";

  renderTopBar();
  mainContent.innerHTML = `
${getTownInteriorScene(game.world.currentView)}

${dialoguePanel}
${interiorMessage}
${interiorButtons}
`;

  const nextVillageHallDialogueButton = document.getElementById(
    "nextVillageHallDialogueButton",
  );
  if (nextVillageHallDialogueButton) {
    nextVillageHallDialogueButton.addEventListener("click", () => {
      renderTownInteriorScreen(villageHallDialogueStep + 1);
    });
  }

  const acceptDarkForestChallengeButton = document.getElementById(
    "acceptDarkForestChallengeButton",
  );
  if (acceptDarkForestChallengeButton) {
    acceptDarkForestChallengeButton.addEventListener(
      "click",
      acceptDarkForestChallenge,
    );
  }

  const receiveVillageMapButton = document.getElementById(
    "receiveVillageMapButton",
  );
  if (receiveVillageMapButton) {
    receiveVillageMapButton.addEventListener("click", receiveVillageMap);
  }

  const buildingActionListeners = {
    buySlingshotButton: buySlingshot,
    buyBootsButton: buyBoots,
    buySwordButton: buySword,
    buySpearButton: buySpear,
    restAtInnButton: restAtInn,
  };

  Object.entries(buildingActionListeners).forEach(([id, handler]) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", handler);
    }
  });

  document
    .getElementById("leaveTownBuildingButton")
    .addEventListener("click", leaveTownBuilding);
  attachTopBarListeners();
}
