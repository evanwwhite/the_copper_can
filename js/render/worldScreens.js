import { game } from "../gameState.js";
import {
  forest,
  forestTrailSignScene,
  cave,
  islandOcean,
  islandWorld,
  miniMap1,
  plains,
  houseByBeach,
  windmill,
  pirateShip,
  castleBridge,
  castle,
  desert,
  lake,
  woodenBridge,
  rubble,
  tallTree,
  beach,
  logCabin,
} from "../asciiArtHelper.js";
import { saveGame } from "../saveSystem.js";
import {
  continueOnTrail,
  enterDarkForest,
  enterWalkScene,
  followWoodedPath,
  switchView,
  travelToVillage,
  travelToWoodedPath,
  viewWorldMap,
  visitCopperCan,
} from "../actions.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

// Clickable buildings drawn into the miniMap1 art. Coordinates are columns/
// rows into miniMap1.split("\n"). Each region is one or more rectangular
// `parts`, so a building whose art zig-zags across rows can be traced exactly
// without highlighting the surrounding art.
const MAP_BUILDING_HOVER_REGIONS = [
  {
    // The Copper Can marker in the lower-left of the map.
    id: "copperCan",
    label: "The Copper Can",
    action: visitCopperCan,
    parts: [{ x: 6, y: 22, width: 10, height: 5 }],
  },
  {
    // The winding path marker near the center of the map.
    id: "woodedPath",
    label: "The Wooded Path",
    action: travelToWoodedPath,
    parts: [{ x: 17, y: 19, width: 15, height: 5 }],
  },
  {
    // The compact village marker in the center of the map.
    id: "village",
    label: "The Village",
    action: travelToVillage,
    parts: [{ x: 32, y: 12, width: 16, height: 6 }],
  },
  {
    // The little tree "│/~~\│" up near the top.
    id: "darkForest",
    label: "The Dark Forest",
    action: enterDarkForest,
    parts: [{ x: 35, y: 7, width: 15, height: 1 }],
  },
  {
    // The small marker along the map's right edge.
    id: "worldMap",
    label: "The World Beyond",
    action: viewWorldMap,
    parts: [
      { x: 49, y: 13, width: 10, height: 1 },
      { x: 48, y: 14, width: 11, height: 1 },
      { x: 49, y: 15, width: 10, height: 1 },
    ],
  },
];

// Hover regions drawn into the islandWorld art. The village sits along the
// island's left shore; hovering it surfaces the "Village Minimap" label and
// clicking it drops the player into the detailed minimap (miniMap1). The box
// covers the village cluster in islandWorld.split("\n"): rows 27-37, cols 13-38.
const ISLAND_HOVER_REGIONS = [
  {
    // The small cave entrance in the island's northern interior.
    id: "cave",
    label: "The Cave",
    action: () => switchView("cave"),
    parts: [{ x: 32, y: 15, width: 9, height: 3 }],
  },
  {
    // The tall pine in the island's northern interior.
    id: "tallTree",
    label: "The Tall Tree",
    action: () => switchView("tallTree"),
    parts: [
      { x: 43, y: 6, width: 4, height: 1 },
      { x: 43, y: 7, width: 4, height: 1 },
      { x: 43, y: 8, width: 4, height: 1 },
      { x: 43, y: 9, width: 4, height: 1 },
      { x: 43, y: 10, width: 4, height: 1 },
      { x: 43, y: 11, width: 3, height: 1 },
    ],
  },
  {
    // The shoreline marker on the island's western edge.
    id: "beach",
    label: "The Beach",
    action: () => switchView("beach"),
    parts: [
      { x: 4, y: 17, width: 3, height: 1 },
      { x: 5, y: 18, width: 2, height: 1 },
      { x: 6, y: 19, width: 2, height: 1 },
      { x: 6, y: 20, width: 2, height: 1 },
      { x: 6, y: 21, width: 2, height: 1 },
    ],
  },
  {
    id: "villageMinimap",
    label: "Village Minimap",
    action: () => switchView("map"),
    parts: [{ x: 13, y: 27, width: 26, height: 11 }],
  },
  {
    id: "plains",
    label: "The Plains",
    action: () => enterWalkScene("plains"),
    parts: [{ x: 51, y: 26, width: 39, height: 6 }],
  },
  {
    // The small lake near the island's center.
    id: "lake",
    label: "The Lake",
    action: () => switchView("lake"),
    parts: [
      { x: 56, y: 17, width: 8, height: 1 },
      { x: 60, y: 18, width: 9, height: 1 },
    ],
  },
  {
    // The desert settlement in the island's east-central interior.
    id: "desert",
    label: "The Desert",
    action: () => switchView("desert"),
    parts: [
      { x: 66, y: 19, width: 20, height: 1 },
      { x: 52, y: 20, width: 36, height: 1 },
      { x: 51, y: 21, width: 28, height: 1 },
      { x: 54, y: 22, width: 37, height: 1 },
      { x: 54, y: 23, width: 35, height: 1 },
    ],
  },
  {
    id: "houseByBeach",
    label: "House by the Beach",
    action: () => switchView("houseByBeach"),
    parts: [{ x: 88, y: 37, width: 6, height: 2 }],
  },
  {
    id: "windmill",
    label: "The Windmill",
    action: () => switchView("windmill"),
    parts: [{ x: 19, y: 11, width: 7, height: 4 }],
  },
  {
    // The short wooden bridge in the island's northern interior.
    id: "woodenBridge",
    label: "The Wooden Bridge",
    action: () => switchView("woodenBridge"),
    parts: [{ x: 48, y: 11, width: 6, height: 1 }],
  },
  {
    // The ruined settlement on the island's eastern side.
    id: "rubble",
    label: "The Rubble",
    action: () => switchView("rubble"),
    parts: [
      { x: 64, y: 11, width: 27, height: 1 },
      { x: 64, y: 12, width: 27, height: 1 },
      { x: 64, y: 13, width: 28, height: 1 },
      { x: 64, y: 14, width: 25, height: 1 },
      { x: 64, y: 15, width: 27, height: 1 },
    ],
  },
  {
    id: "pirateShip",
    label: "The Pirate Ship",
    action: () => switchView("pirateShip"),
    parts: [{ x: 0, y: 1, width: 11, height: 5 }],
  },
  {
    id: "castleBridge",
    label: "The Castle Bridge",
    action: () => switchView("castleBridge"),
    parts: [{ x: 57, y: 33, width: 3, height: 6 }],
  },
  {
    id: "castle",
    label: "The Castle",
    action: () => switchView("castle"),
    parts: [{ x: 61, y: 36, width: 11, height: 5 }],
  },
];

// Clickable details within individual world scenes. The log cabin door is
// slightly wider than its visible outline so it is easy to enter.
const WORLD_SCENE_HOVER_REGIONS = {
  houseByBeach: [
    {
      id: "logCabinDoor",
      label: "Enter Log Cabin",
      action: () => switchView("logCabin"),
      parts: [
        { x: 50, y: 26, width: 11, height: 1 },
        { x: 50, y: 27, width: 10, height: 1 },
        { x: 50, y: 28, width: 10, height: 1 },
        { x: 50, y: 29, width: 10, height: 1 },
      ],
    },
  ],
};

// Composite `foreground` onto `background`, anchored at (offsetX, offsetY).
// Foreground spaces are treated as transparent so the background art (the
// ocean) shows through the gaps in the island silhouette.
function overlayArt(background, foreground, offsetX, offsetY) {
  const result = background.split("\n").map(line => [...line]);

  foreground.split("\n").forEach((fgLine, fgRow) => {
    const row = fgRow + offsetY;
    if (row < 0 || row >= result.length) {
      return;
    }

    [...fgLine].forEach((character, fgCol) => {
      if (character === " ") {
        return;
      }
      const col = fgCol + offsetX;
      if (col >= 0 && col < result[row].length) {
        result[row][col] = character;
      }
    });
  });

  return result.map(chars => chars.join("")).join("\n");
}

// Shift every hover region horizontally so its coordinates line up with art
// that has been overlaid at a column offset.
function offsetRegions(regions, offsetX) {
  return regions.map(region => ({
    ...region,
    parts: region.parts.map(part => ({ ...part, x: part.x + offsetX })),
  }));
}

function isInPart(part, x, y) {
  return (
    x >= part.x &&
    x < part.x + part.width &&
    y >= part.y &&
    y < part.y + part.height
  );
}

function getRegionAt(regions, x, y) {
  return regions.find(region => {
    return region.parts.some(part => isInPart(part, x, y));
  });
}

function getRegionBounds(region) {
  const minX = Math.min(...region.parts.map(part => part.x));
  const maxX = Math.max(...region.parts.map(part => part.x + part.width));
  const maxBottom = Math.max(...region.parts.map(part => part.y + part.height));

  return { centerColumn: (minX + maxX) / 2, bottomRow: maxBottom };
}

// Wrap each character that falls inside a hover region in a span so the art can
// stay a single block of monospaced text while individual buildings/areas stay
// hoverable and clickable.
function buildHoverScene(art, regions, sceneId, sceneClass) {
  const lines = art.split("\n");

  const sceneMarkup = lines.map((line, y) => {
    return [...line].map((character, x) => {
      const visibleCharacter = escapeHtml(character);
      const region = getRegionAt(regions, x, y);

      if (!region) {
        return visibleCharacter;
      }

      return `<span class="mapBuildingHover" data-hover-region="${escapeHtml(region.id)}">${visibleCharacter}</span>`;
    }).join("");
  }).join("\n");

  return `<span id="${sceneId}" class="${sceneClass}">${sceneMarkup}</span><span id="${sceneId}Label" class="townHoverLabel"></span>`;
}

function hideMapHoverLabel(hoverLabel) {
  hoverLabel.classList.remove("visible");
  hoverLabel.textContent = "";
}

function getSceneMetrics(sceneElement, art) {
  const bounds = sceneElement.getBoundingClientRect();
  const lines = art.split("\n");
  const widestLineWidth = Math.max(...lines.map(line => [...line].length), 1);
  const style = window.getComputedStyle(sceneElement);
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;

  return {
    charWidth: bounds.width / widestLineWidth,
    lineHeight,
    left: bounds.left,
    top: bounds.top,
  };
}

function positionHoverLabel(hoverLabel, sceneElement, region, art) {
  const metrics = getSceneMetrics(sceneElement, art);
  const { centerColumn, bottomRow } = getRegionBounds(region);

  hoverLabel.style.left = `${metrics.left + centerColumn * metrics.charWidth}px`;
  hoverLabel.style.top = `${metrics.top + bottomRow * metrics.lineHeight + 4}px`;
}

// Map a pointer event to the character cell (column/row) it sits over. Working
// in cell space instead of DOM targets means the whole region box counts as
// hoverable - including the blank cells inside it - so the label stays up as
// long as the cursor is anywhere within the box rather than only over a drawn
// glyph.
function cellFromEvent(event, sceneElement, art) {
  const metrics = getSceneMetrics(sceneElement, art);
  const column = Math.floor((event.clientX - metrics.left) / metrics.charWidth);
  const row = Math.floor((event.clientY - metrics.top) / metrics.lineHeight);
  return { column, row };
}

function attachSceneHoverListeners(sceneId, regions, art) {
  const sceneElement = document.getElementById(sceneId);
  const hoverLabel = document.getElementById(`${sceneId}Label`);

  if (!sceneElement || !hoverLabel) {
    return;
  }

  sceneElement.addEventListener("mousemove", event => {
    const { column, row } = cellFromEvent(event, sceneElement, art);
    const region = getRegionAt(regions, column, row);

    if (!region) {
      hideMapHoverLabel(hoverLabel);
      return;
    }

    hoverLabel.textContent = region.label;
    positionHoverLabel(hoverLabel, sceneElement, region, art);
    hoverLabel.classList.add("visible");
  });

  sceneElement.addEventListener("mouseleave", () => {
    hideMapHoverLabel(hoverLabel);
  });

  sceneElement.addEventListener("click", event => {
    const { column, row } = cellFromEvent(event, sceneElement, art);
    const region = getRegionAt(regions, column, row);

    if (region) {
      region.action();
    }
  });
}

export function renderMapView() {
  setMainContentMode();

  mainContent.innerHTML = `
${buildHoverScene(miniMap1, MAP_BUILDING_HOVER_REGIONS, "mapScene", "mapScene")}
`;

  attachSceneHoverListeners("mapScene", MAP_BUILDING_HOVER_REGIONS, miniMap1);
}

export function renderWorldMapView() {
  setMainContentMode();

  // Center the island silhouette inside the wider ocean field, then draw the
  // ocean behind it so the world map sits in the middle of open water.
  const oceanWidth = Math.max(...islandOcean.split("\n").map(line => [...line].length));
  const islandWidth = Math.max(...islandWorld.split("\n").map(line => [...line].length));
  const offsetX = Math.max(0, Math.floor((oceanWidth - islandWidth) / 2));

  const scene = overlayArt(islandOcean, islandWorld, offsetX, 0);
  const regions = offsetRegions(ISLAND_HOVER_REGIONS, offsetX);

  mainContent.innerHTML = `
${buildHoverScene(scene, regions, "islandScene", "worldMapScene")}
`;

  attachSceneHoverListeners("islandScene", regions, scene);
}

// Scenes reachable by clicking a landmark on the world map. Each renders its
// art plus a button back to the world map. The keys double as the currentView
// value that switchView() sets, so a landmark's action is switchView(<key>).
export const WORLD_SCENE_ART = {
  cave,
  plains,
  houseByBeach,
  windmill,
  pirateShip,
  castleBridge,
  castle,
  desert,
  lake,
  woodenBridge,
  rubble,
  tallTree,
  beach,
  logCabin,
};

export function renderWorldSceneView(viewName) {
  setMainContentMode();

  const sceneArt = WORLD_SCENE_ART[viewName];
  const regions = WORLD_SCENE_HOVER_REGIONS[viewName];
  const returnView = viewName === "logCabin" ? "houseByBeach" : "worldMap";
  const returnLabel = viewName === "logCabin"
    ? "Return to House by the Beach"
    : "Return to World Map";

  mainContent.innerHTML = `${regions
  ? buildHoverScene(sceneArt, regions, "worldScene", "worldMapScene")
  : sceneArt}


    <span id="sceneReturnButton" class="asciiRealButton">${returnLabel}</span>
`;

  if (regions) {
    attachSceneHoverListeners("worldScene", regions, sceneArt);
  }

  document
    .getElementById("sceneReturnButton")
    .addEventListener("click", () => switchView(returnView));
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
