import { game } from "./gameState.js";
import { loadGame } from "./saveSystem.js";
import { renderIntroScreen, renderGameScreen, renderTitleRevealScreen } from "./render.js";
import { continueGame } from "./actions.js";

function boot() {
  loadGame();

  if (game.screen === "game") {
    continueGame();
  } else if (game.screen === "titleReveal" && !game.hasSeenTitleReveal) {
    renderTitleRevealScreen();
  } else {
    renderIntroScreen();
  }
}

boot();