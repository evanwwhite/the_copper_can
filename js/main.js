import { game } from "./gameState.js";
import { loadGame } from "./saveSystem.js";
import {
  renderBlankPathScreen,
  renderDarkForestScreen,
  renderForestPathScreen,
  renderIntroScreen,
  renderTitleRevealScreen,
  renderTownInteriorScreen,
  renderTownScreen,
} from "./renderHelper.js";
import { continueGame, startTimer } from "./actions.js";

function boot() {
  loadGame();
  startTimer();

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
  } else if (game.world.screen === "townInterior") {
    renderTownInteriorScreen();
  } else if (game.world.screen === "darkForest") {
    renderDarkForestScreen();
  } else {
    renderIntroScreen();
  }
}

boot();
