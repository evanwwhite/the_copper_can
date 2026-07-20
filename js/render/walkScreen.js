import { game } from "../gameState.js";
import {
  darkTreeWatcherArt,
  darkTreeWatcherDeadArt,
  playerCombatArt,
  playerCombatPoses,
  playerWalkFrames,
} from "../asciiArtHelper.js";
import { sceneEnemySprites } from "../asciiArt/sceneCombatSprites.js";
import {
  getSceneCombatStances,
  SCENE_COMBAT_TUNING,
  SCENE_ENEMY_TYPES,
  SCENE_WEAPONS,
} from "../sceneCombatData.js";
import {
  exitWalkScene,
  getPlayerSceneCombatStats,
  installWalkKeyHandlers,
  moveWalk,
  releaseSceneBrace,
  restartSceneEncounter,
  setSceneStance,
  startSceneBrace,
} from "../actions.js";
import {
  formatBoxLine,
  makeBoxFrame,
  wrapText,
} from "../helpers.js";
import { getSpriteWidth, placeSprite } from "./ascii.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";
import { attachTopBarListeners, renderTopBar } from "./topBar.js";
import { getWalkScene } from "./walkScenes.js";

const ENEMY_ART = {
  ...sceneEnemySprites,
  fox: darkTreeWatcherArt,
  foxDead: darkTreeWatcherDeadArt,
};

// Walk scenes are 100 characters wide. The text area plus its padding and
// border is also 100 characters, keeping narration aligned below the artwork.
const COMBAT_PANEL_WIDTH = 94;

function writeText(canvas, text, x, y) {
  if (y < 0 || y >= canvas.length) return;
  [...text].forEach((character, offset) => {
    const column = x + offset;
    if (column >= 0 && column < canvas[0].length) {
      canvas[y][column] = character;
    }
  });
}

function getPlayerArt() {
  if (game.walk.bracing) return playerCombatPoses.brace;
  const encounterIsArmed = game.walk.enemies.some((enemy) => enemy.hp > 0);
  if (encounterIsArmed || game.walk.inCombat || game.walk.attackFrame > 0) {
    return playerCombatPoses[game.walk.equippedWeapon] ?? playerCombatArt;
  }

  const facing = game.walk.facing < 0 ? "left" : "right";
  const frames = playerWalkFrames[facing];
  if (game.walk.heldDir === 0) return frames[0];
  return frames[game.walk.stepFrame % frames.length];
}

function getEnemyArt(enemy) {
  const definition = SCENE_ENEMY_TYPES[enemy.type];
  const spriteKey = enemy.hp > 0 ? definition.sprite : definition.deadSprite;
  return ENEMY_ART[spriteKey] ?? ENEMY_ART.rustMite;
}

function getEnemyY(scene, enemy, art) {
  const playerHeight = 3;
  return scene.groundY + playerHeight - art.length + enemy.yOffset;
}

function createWalkSceneLines() {
  const scene = getWalkScene(game.walk.sceneId);
  const lines = scene.art.split("\n");
  const width = Math.max(...lines.map((line) => line.length));
  const canvas = lines.map((line) => [...line.padEnd(width, " ")]);

  game.walk.enemies
    .filter((enemy) => enemy.hp <= 0)
    .forEach((enemy) => {
      const art = getEnemyArt(enemy);
      placeSprite(
        canvas,
        art,
        Math.round(enemy.x),
        getEnemyY(scene, enemy, art),
      );
    });

  const playerArt = getPlayerArt();
  placeSprite(
    canvas,
    playerArt,
    Math.round(game.walk.playerX),
    scene.groundY,
  );

  game.walk.enemies
    .filter((enemy) => enemy.hp > 0)
    .forEach((enemy) => {
      const art = getEnemyArt(enemy);
      const enemyX = Math.round(enemy.x);
      const enemyY = getEnemyY(scene, enemy, art);
      placeSprite(canvas, art, enemyX, enemyY);

      if (enemy.state === "telegraph") {
        const markerX = enemyX + Math.floor(getSpriteWidth(art) / 2) - 1;
        writeText(canvas, "[!]", markerX, enemyY - 1);
      } else if (enemy.state === "stagger") {
        writeText(canvas, "*stagger*", enemyX, enemyY - 1);
      }
    });

  game.walk.projectiles.forEach((projectile) => {
    const y = scene.groundY + 1 + projectile.yOffset;
    writeText(canvas, projectile.direction > 0 ? "·>" : "<·", Math.round(projectile.x), y);
  });

  game.walk.effects.forEach((effect) => {
    const y = scene.groundY + effect.yOffset;
    writeText(canvas, effect.text, Math.round(effect.x), y);
  });

  return canvas.map((row) => row.join(""));
}

function gauge(current, maximum, width = 10) {
  const filled = maximum > 0
    ? Math.round((current / maximum) * width)
    : 0;
  return `[${"#".repeat(filled)}${".".repeat(Math.max(0, width - filled))}]`;
}

function buildStatusText() {
  const weapon = SCENE_WEAPONS[game.walk.equippedWeapon];
  const stats = getPlayerSceneCombatStats();
  const living = game.walk.enemies.filter((enemy) => enemy.hp > 0);
  const closest = living.sort((left, right) => {
    return Math.abs(left.x - game.walk.playerX) - Math.abs(right.x - game.walk.playerX);
  })[0];
  const enemyStatus = closest
    ? `${SCENE_ENEMY_TYPES[closest.type].name} ${gauge(closest.hp, closest.maxHp)} ${closest.hp}/${closest.maxHp}`
    : "road clear";
  const state = game.walk.phase.toUpperCase();

  return [
    `YOU ${game.player.health}/${game.player.maxHealth}  ·  ${weapon.label}  ·  ${enemyStatus}`,
    `AMMO ${game.walk.slingshotAmmo}/${SCENE_COMBAT_TUNING.ammoMax}  ·  GUARD ${gauge(game.walk.guard, SCENE_COMBAT_TUNING.guardMax)}  ·  ARMOR -${stats.damageReduction}  ·  BITS +${game.walk.bitsEarned}  ·  ${state}`,
  ].join("\n");
}

function buildControlsHtml() {
  const stances = getSceneCombatStances(game.inventory, game.walk.demo);
  const stanceButtons = stances
    .map((stance) => {
      const available = stance.weaponKeys.length > 0;
      const styles = available
        ? stance.weaponKeys.map((key) => SCENE_WEAPONS[key].label).join(" / ")
        : "not equipped";
      const unavailableClass = available ? "" : " combatUnowned";
      return `<span class="sceneWeaponButton asciiRealButton${unavailableClass}" data-scene-stance="${stance.key}">[${stance.key.toUpperCase()}] ${stance.label}: ${styles}</span>`;
    })
    .join("\n");
  const hasPreparedWeapon = stances.some((stance) => stance.weaponKeys.length > 0);
  const fistsFallback = hasPreparedWeapon ? "" :
    `<span class="sceneWeaponButton combatEquipped">[--] ${SCENE_WEAPONS.fists.label}</span>`;

  return `
    <div class="sceneControlGroup">
      <div class="combatControlLabel">MOVE</div>
      <span class="asciiRealButton" data-walk-direction="-1">← Left</span>
      <span class="asciiRealButton" data-walk-direction="1">Right →</span>
    </div>
    <div class="sceneControlGroup">
      <div class="combatControlLabel">WEAPON / STANCE</div>
      ${stanceButtons}
      ${fistsFallback}
    </div>
    <div class="sceneControlGroup">
      <div class="combatControlLabel">ACTION</div>
      <span id="sceneBraceButton" class="asciiRealButton">[Shift] Hold shield / release to parry</span>
    </div>`;
}

function buildShell() {
  const combatFrame = makeBoxFrame("COMBAT", COMBAT_PANEL_WIDTH);

  mainContent.innerHTML = `<div id="sceneCombatShell" data-scene-id="${escapeHtml(game.walk.sceneId)}">
      <pre id="sceneArena"></pre>
      <div class="textPanel combatTextPanel">
        <pre class="textPanelFrame">${combatFrame.header}</pre>
        <div id="sceneCombatLog" class="combatLog textPanelBody" role="log" aria-live="polite" aria-label="Combat messages"></div>
        <pre class="textPanelFrame">${combatFrame.footer}</pre>
      </div>
      <pre id="sceneStatus"></pre>
      <div id="sceneControls">${buildControlsHtml()}</div>
      <div id="sceneEndControls">
        <span id="restartSceneButton" class="asciiRealButton hidden">Heal and fight again</span>
        <span id="leaveWalkButton" class="asciiRealButton">Return</span>
      </div>
      <p class="sceneControlHint">Arrows move · Q/W/E ready a stance · attacks are automatic in range · hold Shift to block, release during [!] to parry.</p>
    </div>`;

  document.querySelectorAll("[data-walk-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      moveWalk(Number(button.dataset.walkDirection));
    });
  });
  document.querySelectorAll("[data-scene-stance]").forEach((button) => {
    button.addEventListener("click", () => {
      setSceneStance(button.dataset.sceneStance);
    });
  });

  const braceButton = document.getElementById("sceneBraceButton");
  braceButton.addEventListener("mousedown", startSceneBrace);
  braceButton.addEventListener("mouseup", releaseSceneBrace);
  braceButton.addEventListener("mouseleave", releaseSceneBrace);
  braceButton.addEventListener("touchstart", (event) => {
    event.preventDefault();
    startSceneBrace();
  });
  braceButton.addEventListener("touchend", releaseSceneBrace);

  document.getElementById("leaveWalkButton").addEventListener("click", exitWalkScene);
  document.getElementById("restartSceneButton").addEventListener("click", restartSceneEncounter);
}

function updateLog() {
  const log = document.getElementById("sceneCombatLog");
  const entries = game.walk.log.length > 0
    ? game.walk.log
    : [{ text: "The road is quiet.", kind: "info" }];

  log.innerHTML = entries
    .flatMap((entry) => {
      return wrapText(entry.text, COMBAT_PANEL_WIDTH).map((line) => {
        const formattedLine = formatBoxLine(line, COMBAT_PANEL_WIDTH);
        const prefix = formattedLine.slice(0, 3);
        const suffix = formattedLine.slice(3 + line.length);

        return `<div class="combatLogLine">${prefix}<span class="combatLog-${entry.kind}">${escapeHtml(line)}</span>${suffix}</div>`;
      });
    })
    .join("");
  log.scrollTop = log.scrollHeight;
}

function updateControls() {
  const stances = getSceneCombatStances(game.inventory, game.walk.demo);
  document.querySelectorAll("[data-scene-stance]").forEach((button) => {
    const stance = stances.find(
      (candidate) => candidate.key === button.dataset.sceneStance,
    );
    button.classList.toggle(
      "combatEquipped",
      Boolean(stance?.weaponKeys.includes(game.walk.equippedWeapon)),
    );
  });

  const currentWeapon = SCENE_WEAPONS[game.walk.equippedWeapon];
  const brace = document.getElementById("sceneBraceButton");
  brace.classList.toggle("combatEquipped", game.walk.bracing);
  brace.classList.toggle("combatUnowned", !currentWeapon.canUseShield);

  const defeated = game.walk.phase === "defeat";
  document.getElementById("sceneControls").classList.toggle("hidden", defeated);
  document.getElementById("restartSceneButton").classList.toggle(
    "hidden",
    !game.walk.demo || (!defeated && !game.walk.encounterComplete),
  );

  const leaveButton = document.getElementById("leaveWalkButton");
  leaveButton.textContent = defeated
    ? game.walk.demo ? "Back to the can" : "Wake in town"
    : game.walk.demo ? "Back to the can" : "Leave scene";
}

export function renderWalkScreen() {
  game.world.screen = "walk";
  game.walk.active = true;
  setMainContentMode("sceneCombatView");
  renderTopBar();

  const shell = document.getElementById("sceneCombatShell");
  if (!shell || shell.dataset.sceneId !== game.walk.sceneId) {
    buildShell();
  }

  document.getElementById("sceneArena").textContent = createWalkSceneLines().join("\n");
  document.getElementById("sceneStatus").textContent = buildStatusText();
  updateLog();
  updateControls();

  installWalkKeyHandlers();
  attachTopBarListeners();
}
