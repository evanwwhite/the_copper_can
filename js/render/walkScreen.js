import { game } from "../gameState.js";
import { playerWalkFrames } from "../asciiArtHelper.js";
import { saveGame } from "../saveSystem.js";
import { installWalkKeyHandlers, moveWalk, viewWorldMap } from "../actions.js";
import { placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";
import { getWalkScene } from "./walkScenes.js";

// Compose the current walk scene (backdrop + player sprite) into HTML. The
// player art overwrites the backdrop via placeSprite; only non-space glyphs
// are drawn so the scene shows through the gaps in the sprite.
function createWalkSceneMarkup() {
  const scene = getWalkScene(game.walk.sceneId);
  const lines = scene.art.split("\n");
  // Pad every row to the widest line so the sprite can be placed at any column
  // without clipping against a short row (placeSprite bounds on canvas[0]).
  const width = Math.max(...lines.map(line => line.length));
  const canvas = lines.map(line => [...line.padEnd(width, " ")]);

  const facing = game.walk.facing < 0 ? "left" : "right";
  const frames = playerWalkFrames[facing];
  const frame = frames[game.walk.stepFrame % frames.length];

  placeSprite(canvas, frame, game.walk.playerX, scene.groundY);

  return canvas
    .map(row => row.map(character => escapeHtml(character)).join(""))
    .join("\n");
}

export function renderWalkScreen() {
  game.world.screen = "walk";
  game.walk.active = true;
  saveGame();
  setMainContentMode();

  renderTopBar();

  mainContent.innerHTML = `
${createWalkSceneMarkup()}


    <span class="asciiRealButton" data-walk-direction="-1">&lt; Walk Left</span>
    <span class="asciiRealButton" data-walk-direction="1">Walk Right &gt;</span>

    Hold the left or right arrow key to walk.


    <span id="leaveWalkButton" class="asciiRealButton">Return to World Map</span>
`;

  document.querySelectorAll("[data-walk-direction]").forEach(button => {
    button.addEventListener("click", () => {
      moveWalk(Number(button.dataset.walkDirection));
    });
  });

  document
    .getElementById("leaveWalkButton")
    .addEventListener("click", leaveWalkScene);

  installWalkKeyHandlers();
  attachTopBarListeners();
}

function leaveWalkScene() {
  game.walk.active = false;
  game.walk.heldDir = 0;
  saveGame();
  viewWorldMap();
}
