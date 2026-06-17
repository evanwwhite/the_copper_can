import { game } from "../gameState.js";
import { townScene, villagerSmall } from "../asciiArtHelper.js";
import { makeBox } from "../helpers.js";
import { saveGame } from "../saveSystem.js";
import {
  acceptDarkForestChallenge,
  enterDarkForest,
  enterTownBuilding,
  leaveTownBuilding,
  receiveVillageMap,
} from "../actions.js";
import { getAsciiLines, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const TOWN_BUILDING_HOVER_REGIONS = [
  { id: "riversideInn", label: "Riverside Inn", x: 7, y: 15, width: 23, height: 10, canEnter: true },
  { id: "villageHall", label: "Village Hall", x: 56, y: 16, width: 27, height: 9, canEnter: true },
  { id: "villageShop", label: "Village Shop", x: 34, y: 18, width: 14, height: 7, canEnter: true },
  { id: "blacksmith", label: "Blacksmith", x: 76, y: 20, width: 27, height: 12, canEnter: true },
];

const DARK_FOREST_HOVER_REGION = {
  id: "darkForest",
  label: "Dark Forest",
  x: 49,
  y: 5,
  width: 10,
  height: 2,
  canEnter: true,
};

const VILLAGE_HALL_CHALLENGE_DIALOGUE = [
  [
    "At night, something comes down",
    "from the dark trees across",
    "the river.",
  ],
  [
    "It scrapes at shutters, steals",
    "warmth from the hearths, and",
    "leaves claw marks in the mud.",
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
    "Return when the thing at the",
    "old sign can trouble us no",
    "longer.",
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
  if (!game.flags.acceptedDarkForestChallenge) {
    return TOWN_BUILDING_HOVER_REGIONS;
  }

  return [...TOWN_BUILDING_HOVER_REGIONS, DARK_FOREST_HOVER_REGION];
}

function getTownBuildingRegion(x, y) {
  return getActiveTownHoverRegions().find(region => {
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
  const centerColumn = region.x + region.width / 2;
  const bottomRow = region.y + region.height;

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

    hoverLabel.textContent = region.label;
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

    if (!region?.canEnter) {
      return;
    }

    if (region.id === "darkForest") {
      enterDarkForest();
      return;
    }

    enterTownBuilding(region.id);
  });
}

function createRoomCanvas(width = 74, height = 24) {
  const canvas = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => " "),
  );

  for (let column = 0; column < width; column += 1) {
    canvas[0][column] = column === 0 || column === width - 1 ? "+" : "-";
    canvas[height - 1][column] = column === 0 || column === width - 1 ? "+" : "-";
  }

  for (let row = 1; row < height - 1; row += 1) {
    canvas[row][0] = "|";
    canvas[row][width - 1] = "|";
  }

  return canvas;
}

function placeInteriorLines(canvas, lines, x, y) {
  lines.forEach((line, rowOffset) => {
    [...line].forEach((character, columnOffset) => {
      const rowIndex = y + rowOffset;
      const columnIndex = x + columnOffset;

      if (
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

function placeInteriorText(canvas, text, x, y) {
  placeInteriorLines(canvas, [text], x, y);
}

function addRoomTitle(canvas, title) {
  placeInteriorText(canvas, `[ ${title} ]`, 3, 1);
}

function addRoomFloor(canvas) {
  const floorRow = canvas.length - 5;

  for (let column = 1; column < canvas[0].length - 1; column += 1) {
    canvas[floorRow][column] = "_";
  }
}

function buildVillageHallInteriorLines(dialogueStep = 0) {
  const canvas = createRoomCanvas();
  const villageHallDialogue = getVillageHallDialogue();
  const dialogueLines =
    villageHallDialogue[dialogueStep] ??
    villageHallDialogue[villageHallDialogue.length - 1];
  const speechBox = makeBox("VILLAGER", dialogueLines, 33).split("\n");

  addRoomTitle(canvas, "Village Hall");
  addRoomFloor(canvas);
  placeInteriorLines(canvas, [
    "     ___                 ___",
    "    |   |               |   |",
    "    |___|               |___|",
  ], 8, 4);
  placeInteriorLines(canvas, speechBox, 28, 7);
  placeSprite(canvas, getAsciiLines(villagerSmall), 18, 15);

  return canvas.map(row => row.join("")).join("\n");
}

function buildRiversideInnInteriorLines() {
  const canvas = createRoomCanvas();

  addRoomTitle(canvas, "Riverside Inn");
  addRoomFloor(canvas);
  placeInteriorLines(canvas, [
    "     _________                 _________",
    "    | mug mug |               |  cot   |",
    "    |_________|               |________|",
  ], 9, 5);
  placeInteriorLines(canvas, [
    "              __________________",
    "             |__|__|__|__|__|__|",
    "             |   quiet counter  |",
    "             |__________________|",
  ], 20, 12);

  return canvas.map(row => row.join("")).join("\n");
}

function buildVillageShopInteriorLines() {
  const canvas = createRoomCanvas();

  addRoomTitle(canvas, "Village Shop");
  addRoomFloor(canvas);
  placeInteriorLines(canvas, [
    "       ______________________________",
    "      |  twine  | lantern | crumbs  |",
    "      |_________|_________|_________|",
    "      |  maps   | magnets | jars    |",
    "      |_________|_________|_________|",
  ], 14, 6);
  placeInteriorLines(canvas, [
    "                 __________",
    "                |  counter |",
    "                |__________|",
  ], 24, 16);

  return canvas.map(row => row.join("")).join("\n");
}

function buildBlacksmithInteriorLines() {
  const canvas = createRoomCanvas();

  addRoomTitle(canvas, "Blacksmith");
  addRoomFloor(canvas);
  placeInteriorLines(canvas, [
    "       (  )                 ______",
    "        )(                 / ____ \\",
    "       _||_               /_/____\\_\\",
    "      /____\\                |    |",
    "      |    |                |____|",
  ], 10, 5);
  placeInteriorLines(canvas, [
    "                         ______",
    "              ______    / ____ \\",
    "             /_____/|  /_/____\\_\\",
    "             |_____|/    ANVIL",
  ], 24, 14);

  return canvas.map(row => row.join("")).join("\n");
}

function getTownInteriorScene(buildingId, dialogueStep = 0) {
  if (buildingId === "villageHall") {
    return buildVillageHallInteriorLines(dialogueStep);
  }

  if (buildingId === "riversideInn") return buildRiversideInnInteriorLines();
  if (buildingId === "villageShop") return buildVillageShopInteriorLines();
  if (buildingId === "blacksmith") return buildBlacksmithInteriorLines();

  return buildVillageHallInteriorLines(dialogueStep);
}

export function renderTownScreen() {
  game.world.screen = "town";
  saveGame();
  setMainContentMode();

  renderTopBar();
  mainContent.innerHTML = `
${buildTownSceneMarkup()}
`;
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
  const interiorButtons = isVillageHall
    ? `${villageHallDialogueButton ? `    ${villageHallDialogueButton}\n\n\n` : ""}    <span id="leaveTownBuildingButton" class="asciiRealButton">Leave</span>`
    : '    <span id="leaveTownBuildingButton" class="asciiRealButton">Leave</span>';

  renderTopBar();
  mainContent.innerHTML = `
${getTownInteriorScene(game.world.currentView, villageHallDialogueStep)}


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

  document
    .getElementById("leaveTownBuildingButton")
    .addEventListener("click", leaveTownBuilding);
  attachTopBarListeners();
}
