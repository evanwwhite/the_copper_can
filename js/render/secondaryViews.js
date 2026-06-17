import { game } from "../gameState.js";
import {
  bentMagnetAsset,
  buildThoughtsScreenArt,
  copperCanAsset,
  inventoryScreenMassive,
  mapAsset,
} from "../asciiArtHelper.js";
import { thoughts } from "../data.js";
import { makeBox } from "../helpers.js";
import { manualSave, resetPrototype, switchView } from "../actions.js";
import { overlayAsciiArt } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";

function buildPackInventoryArt() {
  const overlays = [];

  if (game.inventory.copperCan) {
    overlays.push({ art: copperCanAsset, x: 4, y: 4 });
  }

  if (game.inventory.bentMagnet) {
    overlays.push({ art: bentMagnetAsset, x: 14, y: 4 });
  }

  if (game.inventory.map) {
    overlays.push({ art: mapAsset, x: 24, y: 4 });
  }

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
