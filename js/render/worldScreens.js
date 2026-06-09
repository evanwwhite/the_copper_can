import { game } from "../gameState.js";
import {
  buildMapScreenLines,
  forest,
  forestTrailSignScene,
} from "../asciiArt.js";
import { makePreformattedBox } from "../helpers.js";
import { saveGame } from "../saveSystem.js";
import {
  continueOnTrail,
  enterDarkForest,
  followWoodedPath,
  startDarkTreeFight,
  travelToVillage,
  travelToWoodedPath,
  visitCopperCan,
} from "../actions.js";
import { mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";

export function renderMapView() {
  setMainContentMode();
  const mapLines = buildMapScreenLines({
    hasReachedTown: game.flags.acceptedDarkForestChallenge ||
      game.flags.defeatedDarkTreeWatcher ||
      game.flags.receivedVillageMap,
    hasAcceptedDarkForestChallenge: game.flags.acceptedDarkForestChallenge,
    hasDefeatedDarkTreeWatcher: game.flags.defeatedDarkTreeWatcher,
  });
  const darkForestButton = game.flags.acceptedDarkForestChallenge
    ? '<span id="enterDarkForestButton" class="asciiRealButton">Enter the dark forest</span>'
    : "";
  const rustySignButton = game.flags.defeatedDarkTreeWatcher
    ? ""
    : '<span id="fightDarkTreesButton" class="asciiRealButton">Face the rusty iron sign</span>';

  mainContent.innerHTML = `
${makePreformattedBox("MAP", mapLines)}


    <span id="visitCopperCanButton" class="asciiRealButton">Visit the copper can</span>


    <span id="visitWoodedPathButton" class="asciiRealButton">Walk to the wooded path</span>


    <span id="visitVillageButton" class="asciiRealButton">Return to the village</span>


    ${darkForestButton}


    ${rustySignButton}

`;

  document
    .getElementById("visitCopperCanButton")
    .addEventListener("click", visitCopperCan);
  document
    .getElementById("visitWoodedPathButton")
    .addEventListener("click", travelToWoodedPath);
  document
    .getElementById("visitVillageButton")
    .addEventListener("click", travelToVillage);

  const enterDarkForestButton = document.getElementById(
    "enterDarkForestButton",
  );
  if (enterDarkForestButton) {
    enterDarkForestButton.addEventListener("click", enterDarkForest);
  }

  const fightDarkTreesButton = document.getElementById("fightDarkTreesButton");
  if (fightDarkTreesButton) {
    fightDarkTreesButton.addEventListener("click", startDarkTreeFight);
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
