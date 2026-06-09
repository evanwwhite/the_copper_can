import { game } from "./gameState.js";
import { loadGame } from "./saveSystem.js";
import {
  renderBlankPathScreen,
  renderForestPathScreen,
  renderIntroScreen,
  renderTitleRevealScreen,
  renderTownScreen,
} from "./render.js";
import { continueGame } from "./actions.js";

function boot() {
  loadGame();

  if (game.world.screen === "game") {
    continueGame();
  } else if (game.world.screen === "titleReveal") {
    renderTitleRevealScreen();
  } else if (game.world.screen === "forestPath") {
    renderForestPathScreen();
  } else if (game.world.screen === "blankPath") {
    renderBlankPathScreen();
  } else if (game.world.screen === "town") {
    renderTownScreen();
  } else {
    renderIntroScreen();
  }
}

boot();
