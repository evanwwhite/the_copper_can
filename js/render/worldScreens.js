import { game } from "../gameState.js";
import {
  buildMapScreenModel,
  forest,
  forestTrailSignScene,
  islandWorld,
} from "../asciiArtHelper.js";
import { centerText, repeatChar } from "../helpers.js";
import { saveGame } from "../saveSystem.js";
import {
  continueOnTrail,
  enterDarkForest,
  followWoodedPath,
  startDarkTreeFight,
  switchView,
  travelToVillage,
  travelToWoodedPath,
  viewWorldMap,
  visitCopperCan,
} from "../actions.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

const MAP_NODE_INDENT = 14;

const MAP_NODE_ACTIONS = {
  visitCopperCan,
  travelToWoodedPath,
  travelToVillage,
  enterDarkForest,
  viewWorldMap,
  fightDarkTrees: startDarkTreeFight,
};

function buildMapNodeMarkup(node, innerWidth) {
  const indent = repeatChar(" ", MAP_NODE_INDENT);
  const topBorder = `┌${repeatChar("─", innerWidth)}┐`;
  const labelLine = `│${centerText(node.label, innerWidth)}│`;
  const bottomBorder = `└${repeatChar("─", innerWidth)}┘`;
  const line = text => `<span class="mapNodeLine">${escapeHtml(text)}</span>`;
  const classes = node.enabled
    ? "mapNode mapNodeEnabled"
    : "mapNode mapNodeDisabled";
  const actionAttr = node.enabled
    ? ` data-map-action="${escapeHtml(node.action)}"`
    : "";

  return (
    `<span class="${classes}"${actionAttr}>` +
    `${indent}${line(topBorder)}\n` +
    `${indent}${line(labelLine)}\n` +
    `${indent}${line(bottomBorder)}</span>`
  );
}

function buildMapSceneMarkup(model) {
  const nodeTotalWidth = model.nodeInnerWidth + 2;
  const connectorPrefix = repeatChar(
    " ",
    MAP_NODE_INDENT + Math.floor(nodeTotalWidth / 2),
  );

  const lines = [];
  model.nodes.forEach(node => {
    if (node.connectorAbove) {
      node.connectorAbove.forEach(character => {
        lines.push(`${connectorPrefix}${escapeHtml(character)}`);
      });
    }
    lines.push(buildMapNodeMarkup(node, model.nodeInnerWidth));
  });

  const description = model.descriptionLines
    .map(line => escapeHtml(line))
    .join("\n");

  return (
    `<span id="mapScene" class="mapScene">\n` +
    `${lines.join("\n")}\n\n\n` +
    `${description}` +
    `</span>`
  );
}

function attachMapSceneListeners() {
  const mapScene = document.getElementById("mapScene");
  if (!mapScene) {
    return;
  }

  mapScene.addEventListener("click", event => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-map-action]")
      : null;

    if (!target || !mapScene.contains(target)) {
      return;
    }

    const handler = MAP_NODE_ACTIONS[target.dataset.mapAction];
    if (handler) {
      handler();
    }
  });
}

export function renderMapView() {
  setMainContentMode();
  const model = buildMapScreenModel({
    hasReachedTown: game.flags.acceptedDarkForestChallenge ||
      game.flags.defeatedDarkTreeWatcher ||
      game.flags.receivedVillageMap,
    hasAcceptedDarkForestChallenge: game.flags.acceptedDarkForestChallenge,
    hasDefeatedDarkTreeWatcher: game.flags.defeatedDarkTreeWatcher,
    hasUnlockedWorldMap: game.flags.unlockedWorldMap,
  });

  mainContent.innerHTML = `
${buildMapSceneMarkup(model)}
`;

  attachMapSceneListeners();
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
