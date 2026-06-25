import { game } from "../gameState.js";
import {
  forest,
  forestTrailSignScene,
  islandWorld,
  miniMap1,
} from "../asciiArtHelper.js";
import { saveGame } from "../saveSystem.js";
import {
  continueOnTrail,
  enterDarkForest,
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
    // The little can shape "││ __  ()/ __││" in the bottom-left corner.
    id: "copperCan",
    label: "The Copper Can",
    action: visitCopperCan,
    parts: [{ x: 3, y: 24, width: 15, height: 1 }],
  },
  {
    // The path ")),___--'_ ││" winding through the forest.
    id: "woodedPath",
    label: "The Wooded Path",
    action: travelToWoodedPath,
    parts: [{ x: 12, y: 21, width: 13, height: 1 }],
  },
  {
    // The castle/keep in the middle-right of the map.
    id: "village",
    label: "The Village",
    action: travelToVillage,
    parts: [
      { x: 33, y: 11, width: 9, height: 1 },
      { x: 31, y: 12, width: 28, height: 1 },
      { x: 30, y: 13, width: 20, height: 1 },
      { x: 27, y: 14, width: 20, height: 1 },
      { x: 29, y: 15, width: 19, height: 1 },
      { x: 41, y: 16, width: 11, height: 1 },
      { x: 28, y: 17, width: 26, height: 1 },
    ],
  },
  {
    // The little tree "│/~~\│" up near the top.
    id: "darkForest",
    label: "The Dark Forest",
    action: enterDarkForest,
    parts: [{ x: 35, y: 7, width: 15, height: 1 }],
  },
  {
    // The swirl "'`---'__" in the upper-left.
    id: "worldMap",
    label: "The World Beyond",
    action: viewWorldMap,
    parts: [
      { x: 11, y: 12, width: 6, height: 1 },
      { x: 6, y: 13, width: 13, height: 1 },
      { x: 1, y: 14, width: 8, height: 1 },
    ],
  },
];

function isInPart(part, x, y) {
  return (
    x >= part.x &&
    x < part.x + part.width &&
    y >= part.y &&
    y < part.y + part.height
  );
}

function getMapBuildingRegion(x, y) {
  return MAP_BUILDING_HOVER_REGIONS.find(region => {
    return region.parts.some(part => isInPart(part, x, y));
  });
}

function getRegionBounds(region) {
  const minX = Math.min(...region.parts.map(part => part.x));
  const maxX = Math.max(...region.parts.map(part => part.x + part.width));
  const maxBottom = Math.max(...region.parts.map(part => part.y + part.height));

  return { centerColumn: (minX + maxX) / 2, bottomRow: maxBottom };
}

function buildMiniMapMarkup() {
  const lines = miniMap1.split("\n");

  const sceneMarkup = lines.map((line, y) => {
    return [...line].map((character, x) => {
      const visibleCharacter = escapeHtml(character);
      const region = getMapBuildingRegion(x, y);

      if (!region) {
        return visibleCharacter;
      }

      return `<span class="mapBuildingHover" data-map-building="${escapeHtml(region.id)}">${visibleCharacter}</span>`;
    }).join("");
  }).join("\n");

  return `<span id="mapScene" class="mapScene">${sceneMarkup}</span><span id="mapHoverLabel" class="townHoverLabel"></span>`;
}

function hideMapHoverLabel(hoverLabel) {
  hoverLabel.classList.remove("visible");
  hoverLabel.textContent = "";
}

function getMapSceneMetrics(mapSceneElement) {
  const bounds = mapSceneElement.getBoundingClientRect();
  const lines = miniMap1.split("\n");
  const widestLineWidth = Math.max(...lines.map(line => [...line].length), 1);
  const style = window.getComputedStyle(mapSceneElement);
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;

  return {
    charWidth: bounds.width / widestLineWidth,
    lineHeight,
    left: bounds.left,
    top: bounds.top,
  };
}

function positionMapHoverLabel(hoverLabel, mapSceneElement, region) {
  const metrics = getMapSceneMetrics(mapSceneElement);
  const { centerColumn, bottomRow } = getRegionBounds(region);

  hoverLabel.style.left = `${metrics.left + centerColumn * metrics.charWidth}px`;
  hoverLabel.style.top = `${metrics.top + bottomRow * metrics.lineHeight + 4}px`;
}

function attachMapHoverListeners() {
  const mapSceneElement = document.getElementById("mapScene");
  const hoverLabel = document.getElementById("mapHoverLabel");

  if (!mapSceneElement || !hoverLabel) {
    return;
  }

  const regionForTarget = target => {
    return MAP_BUILDING_HOVER_REGIONS.find(item => {
      return item.id === target.dataset.mapBuilding;
    });
  };

  mapSceneElement.addEventListener("mousemove", event => {
    const target = event.target instanceof Element
      ? event.target.closest(".mapBuildingHover")
      : null;

    if (!target || !mapSceneElement.contains(target)) {
      hideMapHoverLabel(hoverLabel);
      return;
    }

    const region = regionForTarget(target);

    if (!region) {
      hideMapHoverLabel(hoverLabel);
      return;
    }

    hoverLabel.textContent = region.label;
    positionMapHoverLabel(hoverLabel, mapSceneElement, region);
    hoverLabel.classList.add("visible");
  });

  mapSceneElement.addEventListener("mouseleave", () => {
    hideMapHoverLabel(hoverLabel);
  });

  mapSceneElement.addEventListener("click", event => {
    const target = event.target instanceof Element
      ? event.target.closest(".mapBuildingHover")
      : null;

    if (!target || !mapSceneElement.contains(target)) {
      return;
    }

    const region = regionForTarget(target);

    if (region) {
      region.action();
    }
  });
}

export function renderMapView() {
  setMainContentMode();

  mainContent.innerHTML = `
${buildMiniMapMarkup()}
`;

  attachMapHoverListeners();
}

export function renderWorldMapView() {
  setMainContentMode();

  mainContent.innerHTML = `
<span class="worldMapScene">${escapeHtml(islandWorld)}</span>


    <span id="leaveWorldMapButton" class="asciiRealButton">Back to the map</span>
`;

  const leaveWorldMapButton = document.getElementById("leaveWorldMapButton");
  if (leaveWorldMapButton) {
    leaveWorldMapButton.addEventListener("click", () => switchView("map"));
  }
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
