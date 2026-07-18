// DEPRECATED: renderer for the legacy arena-combat prototype. Active combat is
// rendered by walkScreen.js. Retained temporarily for save compatibility and
// reference; do not add new combat presentation here. See combat.md.

import { game } from "../gameState.js";
import {
  COMBAT_ARENA_HEIGHT,
  COMBAT_ARENA_WIDTH,
  COMBAT_TUNING,
  combatEnemies,
} from "../data.js";
import {
  boneRattleArt,
  boneRattleDeadArt,
  darkTreeWatcherArt,
  darkTreeWatcherDeadArt,
  playerCombatArt,
  playerCombatPoses,
} from "../asciiArtHelper.js";
import { makePreformattedBox } from "../helpers.js";
import {
  canWeaponFire,
  getGap,
  getRangeBand,
  isWeakCreditable,
  isWeakZone,
  zoneColumn,
} from "../combatCore.js";
import {
  exitCombat,
  exitCombatDemo,
  fleeCombat,
  getPlayerCombatStats,
  healPlayer,
  releaseBrace,
  returnToTownAfterDefeat,
  setCombatTargetZone,
  setCombatWeapon,
  startBrace,
  startCombatDemo,
} from "../actions.js";
import { getSpriteWidth, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";

const ENEMY_ART = {
  darkTreeWatcher: { alive: darkTreeWatcherArt, dead: darkTreeWatcherDeadArt },
  boneRattle: { alive: boneRattleArt, dead: boneRattleDeadArt },
};

const WEAPON_SLOTS = [
  { key: "slingshot", hotkey: "Q" },
  { key: "spear", hotkey: "W" },
  { key: "sword", hotkey: "E" },
];

// Zone buttons laid out numpad-spatial: top row is 7 8 9.
const ZONE_ROWS = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
];

function getCombatEnemyArt() {
  const arts = ENEMY_ART[game.combat.enemyId] ?? ENEMY_ART.darkTreeWatcher;

  if (!game.combat.defeated && (game.combat.canExit || game.combat.enemyHp === 0)) {
    return game.combat.rewardCopperBits > 0 ? arts.dead : arts.alive;
  }

  return arts.alive;
}

function getPlayerArt() {
  if (game.combat.bracing) return playerCombatPoses.brace;
  return playerCombatPoses[game.combat.equippedWeapon] ?? playerCombatArt;
}

function writeText(canvas, text, x, y) {
  if (y < 0 || y >= canvas.length) return;
  [...text].forEach((character, offset) => {
    const column = x + offset;
    if (column >= 0 && column < canvas[0].length) {
      canvas[y][column] = character;
    }
  });
}

function buildCombatArenaLines() {
  const canvas = Array.from({ length: COMBAT_ARENA_HEIGHT }, () =>
    Array.from({ length: COMBAT_ARENA_WIDTH }, () => " "),
  );

  const floorRow = COMBAT_ARENA_HEIGHT - 2;

  for (let column = 0; column < COMBAT_ARENA_WIDTH; column += 1) {
    canvas[floorRow][column] = "_";
  }

  const playerArt = getPlayerArt();
  const playerX = Math.round(game.combat.playerX);
  const playerY = floorRow - playerArt.length + 1;

  const enemyArt = getCombatEnemyArt();
  const enemyY = floorRow - enemyArt.length + 1;
  const enemyX = Math.round(game.combat.enemyX);

  placeSprite(canvas, playerArt, playerX, playerY);
  placeSprite(canvas, enemyArt, enemyX, enemyY);

  // Telegraph / stagger markers over the enemy: the parry is a fair read.
  if (game.combat.enemyTelegraph > 0) {
    writeText(canvas, "!".repeat(game.combat.enemyTelegraph), enemyX + 1, enemyY - 1);
  } else if (game.combat.enemyStagger > 0) {
    writeText(canvas, "* stagger *", enemyX - 2, enemyY - 1);
  }

  // Floating damage number off whoever was struck.
  const flash = game.combat.hitFlash;
  if (flash && flash.ticks > 0) {
    const overX = flash.over === "enemy" ? enemyX + 2 : playerX;
    const overY = flash.over === "enemy" ? enemyY - 2 : playerY - 1;
    writeText(canvas, flash.text, overX, overY);
  }

  return canvas.map((row) => row.join(""));
}

function gauge(current, max, width = 10) {
  const filled = max > 0 ? Math.round((current / max) * width) : 0;
  return `[${"#".repeat(filled)}${".".repeat(Math.max(0, width - filled))}]`;
}

function buildStatusLines(enemy) {
  const combat = game.combat;
  const weaponLabel = COMBAT_TUNING.weapons[combat.equippedWeapon].label;
  const band = getRangeBand(combat, enemy);

  const lineOne =
    `WEAPON ${weaponLabel.padEnd(9)} ·  vs ${enemy.name}  ` +
    `${gauge(combat.enemyHp, combat.enemyMaxHp)} ${combat.enemyHp}/${combat.enemyMaxHp}` +
    `   ·  YOU ${game.player.health}/${game.player.maxHealth}` +
    `   ·  BITS +${combat.fightBits}`;

  const lineTwo =
    `AMMO ${gauge(combat.slingshotAmmo, COMBAT_TUNING.slingshotAmmoMax, 5)} ` +
    `${combat.slingshotAmmo}/${COMBAT_TUNING.slingshotAmmoMax}` +
    `   ·  GUARD ${gauge(combat.guard, COMBAT_TUNING.guardMax)}` +
    `   ·  RANGE ${band} (gap ${getGap(combat)})` +
    (combat.bracing ? "   ·  BRACING" : "");

  return [lineOne, lineTwo];
}

function buildControlsHtml() {
  const weaponButtons = WEAPON_SLOTS.map(
    ({ key, hotkey }) => `
      <span class="combatWeaponButton asciiRealButton" data-weapon="${key}">
        [${hotkey}] ${COMBAT_TUNING.weapons[key].label}
      </span>`,
  ).join("");

  const zoneRows = ZONE_ROWS.map(
    (row) => `
      <div class="combatZoneRow">${row
        .map(
          (zone) =>
            `<span class="combatZoneButton" data-zone="${zone}">${zone}</span>`,
        )
        .join("")}</div>`,
  ).join("");

  return `
    <div class="combatControlGroup">
      <div class="combatControlLabel">WEAPON</div>
      ${weaponButtons}
    </div>
    <div class="combatControlGroup">
      <div class="combatControlLabel">AIM (1-9)</div>
      <div class="combatZoneGrid">${zoneRows}</div>
    </div>
    <div class="combatControlGroup">
      <div class="combatControlLabel">DEFENSE</div>
      <span id="combatBraceButton" class="asciiRealButton">[Shift] Hold to brace / release to parry</span>
      <span id="combatFleeButton" class="asciiRealButton">[F] Flee</span>
    </div>`;
}

function buildShell() {
  mainContent.innerHTML = `
    <div id="combatShell">
      <pre id="combatArena"></pre>
      <pre id="combatStatus"></pre>
      <div id="combatLog" class="combatLog"></div>
      <div id="combatControls">${buildControlsHtml()}</div>
      <div id="combatEnd"></div>
    </div>`;

  mainContent.querySelectorAll(".combatWeaponButton").forEach((button) => {
    button.addEventListener("click", () => {
      setCombatWeapon(button.dataset.weapon);
    });
  });

  mainContent.querySelectorAll(".combatZoneButton").forEach((button) => {
    button.addEventListener("click", () => {
      setCombatTargetZone(Number(button.dataset.zone));
    });
  });

  const braceButton = document.getElementById("combatBraceButton");
  braceButton.addEventListener("mousedown", startBrace);
  braceButton.addEventListener("mouseup", releaseBrace);
  braceButton.addEventListener("mouseleave", releaseBrace);
  braceButton.addEventListener("touchstart", (event) => {
    event.preventDefault();
    startBrace();
  });
  braceButton.addEventListener("touchend", releaseBrace);

  document
    .getElementById("combatFleeButton")
    .addEventListener("click", fleeCombat);
}

let renderedLogLength = -1;

function updateLog() {
  const logElement = document.getElementById("combatLog");
  const entries = game.combat.log;

  if (entries.length === renderedLogLength && logElement.childElementCount) {
    return;
  }

  const wasAtBottom =
    logElement.scrollHeight - logElement.scrollTop - logElement.clientHeight < 4;

  logElement.innerHTML = entries
    .map(
      (entry) =>
        `<div class="combatLogLine combatLog-${entry.kind}">${escapeHtml(entry.text)}</div>`,
    )
    .join("");

  renderedLogLength = entries.length;

  // Only yank to the newest line if the player wasn't scrolled back.
  if (wasAtBottom || logElement.childElementCount <= 1) {
    logElement.scrollTop = logElement.scrollHeight;
  }
}

function updateControls(enemy) {
  const combat = game.combat;
  const stats = getPlayerCombatStats();

  document.querySelectorAll(".combatWeaponButton").forEach((button) => {
    const key = button.dataset.weapon;
    const owned = stats.weapons.includes(key);
    const fireable = owned && canWeaponFire(combat, enemy, key);

    button.classList.toggle("combatEquipped", combat.equippedWeapon === key);
    button.classList.toggle("combatDimmed", !fireable);
    button.classList.toggle("combatUnowned", !owned);
  });

  const weakLit = isWeakCreditable(combat, enemy);

  document.querySelectorAll(".combatZoneButton").forEach((button) => {
    const zone = Number(button.dataset.zone);
    const selected =
      enemy.zoneMode === "thirds"
        ? zoneColumn(zone) === zoneColumn(combat.targetZone)
        : zone === combat.targetZone;

    button.classList.toggle("combatZoneSelected", selected);
    button.classList.toggle(
      "combatZoneWeak",
      weakLit && isWeakZone(enemy, zone),
    );
  });

  document
    .getElementById("combatBraceButton")
    .classList.toggle("combatEquipped", combat.bracing);
}

let renderedEndState = "";

function updateEndState() {
  const combat = game.combat;
  const endElement = document.getElementById("combatEnd");
  const controls = document.getElementById("combatControls");

  const state = !combat.canExit
    ? "fighting"
    : combat.defeated
      ? "defeat"
      : "victory";

  controls.classList.toggle("hidden", state !== "fighting");

  if (state === renderedEndState) return;
  renderedEndState = state;

  if (state === "fighting") {
    endElement.innerHTML = "";
    return;
  }

  let exitLabel = combat.defeated ? "Return to town" : "Exit fight";
  if (combat.demo) {
    exitLabel = combat.defeated ? "Back to the can" : "Fight again";
  }

  endElement.innerHTML = `
    ${combat.demo ? '<span id="combatHealButton" class="asciiRealButton">Heal to full</span>' : ""}
    <span id="exitCombatButton" class="asciiRealButton">${exitLabel}</span>
    ${combat.demo && combat.defeated ? '<span id="combatRetryButton" class="asciiRealButton">Heal and retry</span>' : ""}`;

  const healButton = document.getElementById("combatHealButton");
  if (healButton) healButton.addEventListener("click", healPlayer);

  const retryButton = document.getElementById("combatRetryButton");
  if (retryButton) {
    retryButton.addEventListener("click", async () => {
      const enemyId = combat.enemyId;
      await exitCombatDemo();
      game.player.health = game.player.maxHealth;
      await startCombatDemo(enemyId);
    });
  }

  const exitButton = document.getElementById("exitCombatButton");
  if (exitButton) {
    let handler = combat.defeated ? returnToTownAfterDefeat : exitCombat;
    if (combat.demo) handler = exitCombatDemo;
    exitButton.addEventListener("click", handler);
  }
}

export function renderCombatView() {
  setMainContentMode("combatView");

  const enemy = combatEnemies[game.combat.enemyId];

  if (!enemy) {
    mainContent.innerHTML = "";
    return;
  }

  // Build the shell once per combat entry, then update in place each tick so
  // the log keeps its scroll position and held buttons keep their press.
  if (!document.getElementById("combatShell")) {
    buildShell();
    renderedLogLength = -1;
    renderedEndState = "";
  }

  document.getElementById("combatArena").textContent = makePreformattedBox(
    "FIGHT",
    buildCombatArenaLines(),
    COMBAT_ARENA_WIDTH,
  );

  document.getElementById("combatStatus").textContent = makePreformattedBox(
    "STATUS",
    buildStatusLines(enemy),
    COMBAT_ARENA_WIDTH,
  );

  updateLog();
  updateControls(enemy);
  updateEndState();
}
