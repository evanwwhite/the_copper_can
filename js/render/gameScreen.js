import { game } from "../gameState.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";
import { renderCombatView } from "./combatView.js";
import { renderCopperCanView } from "./copperCanView.js";
import { renderMapView, renderWorldMapView } from "./worldScreens.js";
import {
  renderPackView,
  renderSaveView,
  renderSettingsView,
  renderThoughtsView,
} from "./secondaryViews.js";

export function renderGameScreen() {
  renderTopBar();

  if (
    game.world.currentView === "combat" &&
    (game.combat.active || game.combat.canExit)
  ) {
    renderCombatView();
  } else if (game.world.currentView === "map" && game.unlocks.map) {
    renderMapView();
  } else if (
    game.world.currentView === "worldMap" &&
    game.flags.unlockedWorldMap
  ) {
    renderWorldMapView();
  } else if (game.world.currentView === "pack" && game.unlocks.pack) {
    renderPackView();
  } else if (game.world.currentView === "thoughts" && game.unlocks.thoughts) {
    renderThoughtsView();
  } else if (game.world.currentView === "save" && game.unlocks.save) {
    renderSaveView();
  } else if (game.world.currentView === "settings") {
    renderSettingsView();
  } else {
    game.world.currentView = "can";
    renderCopperCanView();
  }

  attachTopBarListeners();
}
