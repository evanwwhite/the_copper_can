import { game } from "../gameState.js";
import { copperCanTitleArt, introTitleArt } from "../asciiArt.js";
import { saveGame } from "../saveSystem.js";
import { continueFromTitleReveal, startNewGame } from "../actions.js";
import { mainContent, setMainContentMode, statusBar } from "./dom.js";

export function renderIntroScreen() {
  game.world.screen = "intro";
  saveGame();
  setMainContentMode();

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

export function renderTitleRevealScreen() {
  game.world.screen = "titleReveal";
  game.flags.seenTitleReveal = true;
  saveGame();
  setMainContentMode();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


${copperCanTitleArt}

                         The can, the magnet, the thoughts...

                         They were not separate things.

                         They were the beginning of something.


                            THE COPPER CAN


                                 <span id="continueButton" class="asciiRealButton">Continue</span>


`;

  document
    .getElementById("continueButton")
    .addEventListener("click", continueFromTitleReveal);
}
