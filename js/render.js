import { game, statusBar, mainContent } from "./gameState.js";
import {
  BENT_MAGNET_COST,
  MAP_UNLOCK_AMOUNT,
  FREE_WILL_COST,
  thoughts,
} from "./data.js";
import { introTitleArt, bitsBoxTitleArt, mapLines } from "./asciiArt.js";
import { BOX_TEXT_WIDTH, makeBox, wrapText } from "./helpers.js";
import { saveGame } from "./saveSystem.js";

import {
  startNewGame,
  switchView,
  gatherCopperBit,
  refuseCopperCan,
  ignoreCopperCan,
  buyFreeWill,
  throwBitsOnGround,
  investigateMagnet,
  buyBentMagnet,
  unlockMap,
  visitCopperCan,
  visitDarkTrees,
  manualSave,
  resetPrototype,
} from "./actions.js";

export function renderIntroScreen() {
  game.screen = "intro";
  saveGame();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


${introTitleArt}

                         You wake beneath a wet green canopy.

                         The trees are too quiet.

                         In front of you sits a small oxidized copper can.
                         A few copper bits are scattered in the dirt nearby.

                         You do not know who left them.

                         You do not know why you want them.


                                      <span id="playButton" class="asciiRealButton">Begin</span>


`;

  document.getElementById("playButton").addEventListener("click", startNewGame);
}

export function renderGameScreen() {
  renderTopBar();

  if (game.currentView === "map" && game.hasUnlockedMap) {
    renderMapView();
  } else if (game.currentView === "pack" && game.hasUnlockedPack) {
    renderPackView();
  } else if (game.currentView === "thoughts" && game.hasUnlockedThoughts) {
    renderThoughtsView();
  } else if (game.currentView === "save" && game.hasUnlockedSave) {
    renderSaveView();
  } else if (game.currentView === "settings" && game.hasUnlockedSettings) {
    renderSettingsView();
  } else {
    game.currentView = "can";
    renderCopperCanView();
  }

  attachTopBarListeners();
}

export function renderTopBar() {
  if (game.screen !== "game") {
    statusBar.textContent = "";
    return;
  }

  const mapButton = game.hasUnlockedMap
    ? `<span id="mapTab" class="asciiButton">Map</span>`
    : `???`;

  const packButton = game.hasUnlockedPack
    ? `<span id="packTab" class="asciiButton">Pack</span>`
    : `???`;

  const thoughtsButton = game.hasUnlockedThoughts
    ? `<span id="thoughtsTab" class="asciiButton">Thoughts</span>`
    : `???`;

  let currencyText = `${game.copperBits}c`;

  if (game.hasUnlockedSilverBits) {
    currencyText += ` / ${game.silverBits}s`;
  }

  if (game.hasUnlockedGoldBits) {
    currencyText += ` / ${game.goldBits}g`;
  }

  const copperCanButton = game.hasUnlockedCopperCan
    ? `<span id="copperCanTab" class="asciiButton">Copper Can: ${currencyText}</span>`
    : `???`;

  const saveButton = game.hasUnlockedSave
    ? `<span id="saveTab" class="asciiButton">Save</span>`
    : `???`;

  const settingsButton = game.hasUnlockedSettings
    ? `<span id="settingsTab" class="asciiButton">⚙</span>`
    : `???`;

  statusBar.innerHTML = `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  ${mapButton}  │  ${packButton}  │  ${thoughtsButton}  │  ${copperCanButton}  │ ♥ ${game.health}/${game.maxHealth}  │  ${saveButton}  │ ${settingsButton} │
└────────────────────────────────────────────────────────────────────────────────────┘
`;
}

export function attachTopBarListeners() {
  const mapTab = document.getElementById("mapTab");
  if (mapTab) {
    mapTab.addEventListener("click", () => switchView("map"));
  }

  const packTab = document.getElementById("packTab");
  if (packTab) {
    packTab.addEventListener("click", () => switchView("pack"));
  }

  const thoughtsTab = document.getElementById("thoughtsTab");
  if (thoughtsTab) {
    thoughtsTab.addEventListener("click", () => switchView("thoughts"));
  }

  const copperCanTab = document.getElementById("copperCanTab");
  if (copperCanTab) {
    copperCanTab.addEventListener("click", () => switchView("can"));
  }

  const saveTab = document.getElementById("saveTab");
  if (saveTab) {
    saveTab.addEventListener("click", () => switchView("save"));
  }

  const settingsTab = document.getElementById("settingsTab");
  if (settingsTab) {
    settingsTab.addEventListener("click", () => switchView("settings"));
  }
}

export function renderCopperCanView() {
  const canLines = [`Copper bits: ${game.copperBits}`];

  if (game.hasUnlockedSilverBits) {
    canLines.push(`Silver bits: ${game.silverBits}`);
  }

  if (game.hasUnlockedGoldBits) {
    canLines.push(`Gold bits: ${game.goldBits}`);
  }

  canLines.push("");
  canLines.push(
    game.hasBentMagnet
      ? `Collecting rate: +${game.bentMagnetBitsPerSecond}/second`
      : "Collecting rate: none"
  );

  let content = `
${makeBox("Copper Can", canLines)}


    <span id="gatherBitButton" class="asciiRealButton">Pick up a copper bit</span>

`;

  if (
    !game.hasUnlockedThoughts &&
    game.copperBits >= FREE_WILL_COST &&
    !game.hasRefusedCopperCan
  ) {
    content += `
    <span id="refuseCopperCanButton" class="asciiRealButton">Do not pick up copper bit</span>

`;
  }

  if (
    !game.hasUnlockedThoughts &&
    game.hasRefusedCopperCan &&
    !game.hasIgnoredCopperCan
  ) {
    content += `
    <span id="ignoreCopperCanButton" class="asciiRealButton">Ignore the Can</span>

`;
  }

  if (
    !game.hasUnlockedThoughts &&
    game.hasRefusedCopperCan &&
    game.hasIgnoredCopperCan
  ) {
    content += `
    <span id="buyFreeWillButton" class="asciiRealButton">Pay 10 bits to think about why you did that</span>

`;
  }

  if (game.copperBits >= 3) {
    content += `
    <span id="throwBitsButton" class="asciiRealButton">Throw a few back on the ground</span>

`;
  }

  if (
    game.copperBits >= BENT_MAGNET_COST &&
    !game.hasBentMagnet &&
    !game.hasInvestigatedMagnet
  ) {
    content += `
${makeBox("SOMETHING ODD", [
  "Something is poking out of the ground.",
  "",
  "It is bent.",
  "It is rusty.",
  "It might be looking at you.",
])}

    <span id="investigateMagnetButton" class="asciiRealButton">See something poking out of the ground. Investigate?</span>

`;
  }

  if (
    game.copperBits >= BENT_MAGNET_COST &&
    !game.hasBentMagnet &&
    game.hasInvestigatedMagnet
  ) {
    content += `
${makeBox("NEW ITEM", [
  "You uncover a bent magnet.",
  "It's weak, rusty, and slightly rude.",
  "To win the magnet over you have to pay.",
  "",
  `Cost: ${BENT_MAGNET_COST} copper bits`,
])}

    <span id="buyBentMagnetButton" class="asciiRealButton">Buy a bent magnet</span>

`;
  }

  if (game.hasBentMagnet && !game.hasUnlockedMap && game.copperBits >= MAP_UNLOCK_AMOUNT) {
    content += `
${makeBox("SOMETHING MOVES", [
  "The bent magnet turns in your hand.",
  "",
  "It points past the copper can, toward a darker patch of trees.",
])}

    <span id="unlockMapButton" class="asciiRealButton">Look toward the trees</span>

`;
  }

  if (game.lastMessage !== "") {
    content += `
${makeBox("MESSAGE", [game.lastMessage])}

`;
  }

  mainContent.innerHTML = content;

  const gatherBitButton = document.getElementById("gatherBitButton");
  if (gatherBitButton) {
    gatherBitButton.addEventListener("click", gatherCopperBit);
  }

  const refuseCopperCanButton = document.getElementById("refuseCopperCanButton");
  if (refuseCopperCanButton) {
    refuseCopperCanButton.addEventListener("click", refuseCopperCan);
  }

  const ignoreCopperCanButton = document.getElementById("ignoreCopperCanButton");
  if (ignoreCopperCanButton) {
    ignoreCopperCanButton.addEventListener("click", ignoreCopperCan);
  }

  const buyFreeWillButton = document.getElementById("buyFreeWillButton");
  if (buyFreeWillButton) {
    buyFreeWillButton.addEventListener("click", buyFreeWill);
  }

  const throwBitsButton = document.getElementById("throwBitsButton");
  if (throwBitsButton) {
    throwBitsButton.addEventListener("click", throwBitsOnGround);
  }

  const investigateMagnetButton = document.getElementById("investigateMagnetButton");
  if (investigateMagnetButton) {
    investigateMagnetButton.addEventListener("click", investigateMagnet);
  }

  const buyBentMagnetButton = document.getElementById("buyBentMagnetButton");
  if (buyBentMagnetButton) {
    buyBentMagnetButton.addEventListener("click", buyBentMagnet);
  }

  const unlockMapButton = document.getElementById("unlockMapButton");
  if (unlockMapButton) {
    unlockMapButton.addEventListener("click", unlockMap);
  }
}

export function renderMapView() {
  mainContent.innerHTML = `
${makeBox("MAP", mapLines)}


    <span id="visitCopperCanButton" class="asciiRealButton">Visit the copper can</span>
    <span id="visitDarkTreesButton" class="asciiRealButton">Step toward the dark trees</span>

`;

  document.getElementById("visitCopperCanButton").addEventListener("click", visitCopperCan);
  document.getElementById("visitDarkTreesButton").addEventListener("click", visitDarkTrees);
}

export function renderPackView() {
  const magnetText = game.hasBentMagnet
    ? "Bent magnet"
    : "Nothing useful yet";

  mainContent.innerHTML = `
${makeBox("PACK", [
  "Copper can",
  magnetText,
  "",
  "The pack is where found things gather.",
  "Some of them may be useful.",
])}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

export function renderThoughtsView() {
  const unlockedThoughts = thoughts.filter(thought => thought.isUnlocked(game));

  const thoughtLines = unlockedThoughts.flatMap((thought, index) => {
    const prefix = `${index + 1}. `;
    const indent = " ".repeat(prefix.length);
    const wrappedLines = wrapText(thought.text, BOX_TEXT_WIDTH - prefix.length);

    return wrappedLines.map((line, lineIndex) => {
      return lineIndex === 0 ? prefix + line : indent + line;
    });
  });

  mainContent.innerHTML = `
${makeBox("THOUGHTS", thoughtLines)}


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

export function renderSaveView() {
  mainContent.innerHTML = `
${makeBox("SAVE", [
  "The forest remembers you automatically.",
  "",
  "Your progress is stored in localStorage.",
  "You can also press the button below to save manually.",
])}


    <span id="manualSaveButton" class="asciiRealButton">Save now</span>

`;

  document.getElementById("manualSaveButton").addEventListener("click", manualSave);
}

export function renderSettingsView() {
  mainContent.innerHTML = `
${makeBox("SETTINGS", [
  "There are not many settings yet.",
  "",
  "Resetting will erase your saved prototype progress and return to the Untitled screen.",
])}


    <span id="resetButton" class="asciiRealButton">Reset prototype</span>

`;

  document.getElementById("resetButton").addEventListener("click", resetPrototype);
}

export function renderTitleRevealScreen() {
  game.screen = "titleReveal";
  game.hasSeenTitleReveal = true;
  saveGame();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


${bitsBoxTitleArt}

                         The can, the magnet, the map...

                         They were not separate things.

                         They were the beginning of something.


                         BITS BOX


                                      <span id="continueButton" class="asciiRealButton">Continue</span>


`;

  document.getElementById("continueButton").addEventListener("click", () => {
    game.screen = "game";
    game.currentView = "can";
    saveGame();
    renderGameScreen();
  });
}