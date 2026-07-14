import { game } from "../gameState.js";
import {
  BEEHIVE_UNLOCK_AMOUNT,
  BENT_MAGNET_COST,
  FREE_WILL_COST,
  MAP_UNLOCK_AMOUNT,
} from "../data.js";
import { copperCan } from "../asciiArt/titles.js";
import { makeBox } from "../helpers.js";
import {
  buyBentMagnet,
  buyFreeWill,
  disturbBeehive,
  gatherCopperBit,
  healPlayer,
  ignoreCopperCan,
  investigateMagnet,
  refuseCopperCan,
  startCombatDemo,
  throwBitsOnGround,
  unlockMap,
} from "../actions.js";
import { escapeHtml, mainContent, setMainContentMode } from "./dom.js";

export function renderCopperCanView() {
  setMainContentMode("copperCanView");
  const canLines = [`Copper bits: ${game.currencies.copper}`];

  if (game.unlocks.silverBits) {
    canLines.push(`Silver bits: ${game.currencies.silver}`);
  }

  if (game.unlocks.goldBits) {
    canLines.push(`Gold bits: ${game.currencies.gold}`);
  }

  canLines.push("");
  canLines.push(
    game.inventory.bentMagnet
      ? `Collecting rate: +${game.inventory.bentMagnetBitsPerSecond}/second`
      : "Collecting rate: none",
  );

  let content = `
${makeBox("Copper Can", canLines)}


    <span id="gatherBitButton" class="asciiRealButton">Pick up a copper bit</span>

${makeBox("COMBAT BETA", [
  "A practice arena for the new active combat.",
  "The full kit is lent to you: slingshot, spear,",
  "sword, and shield.",
  "",
  "Q Slingshot  range 0-98  dmg 1-2   uses rivets",
  "W Spear      range 0-20  dmg 4-5",
  "E Sword      range 0-6   dmg 10-12 knocks back",
  "",
  "Q/W/E  swap weapon      1-9  aim (numpad layout)",
  "Shift  hold to brace, release in the '!' wind-up",
  "       to parry and open the weak spot",
  "F      flee",
  "",
  `Health: ${game.player.health}/${game.player.maxHealth}`,
])}

    <span id="combatDemoFoxButton" class="asciiRealButton">Spar: the Fox (easy)</span>

    <span id="combatDemoSkeletonButton" class="asciiRealButton">Spar: the Skeleton (armored)</span>

    <span id="canHealButton" class="asciiRealButton">Heal to full</span>

`;

  if (game.currencies.copper >= 3) {
    content += `
    <span id="throwBitsButton" class="asciiRealButton">Throw a few back on the ground</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.currencies.copper >= FREE_WILL_COST &&
    !game.flags.refusedCopperCan
  ) {
    content += `
    <span id="refuseCopperCanButton" class="asciiRealButton">Do not pick up copper bit</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.flags.refusedCopperCan &&
    !game.flags.ignoredCopperCan
  ) {
    content += `
    <span id="ignoreCopperCanButton" class="asciiRealButton">Ignore the Can</span>

`;
  }

  if (
    !game.unlocks.thoughts &&
    game.flags.refusedCopperCan &&
    game.flags.ignoredCopperCan
  ) {
    content += `
    <span id="buyFreeWillButton" class="asciiRealButton">Pay 10 bits to think about why you did that</span>

`;
  }

  if (
    game.unlocks.thoughts &&
    game.currencies.copper >= BENT_MAGNET_COST &&
    !game.inventory.bentMagnet &&
    !game.flags.investigatedMagnet
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
    game.unlocks.thoughts &&
    game.currencies.copper >= BENT_MAGNET_COST &&
    !game.inventory.bentMagnet &&
    game.flags.investigatedMagnet
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

  if (
    game.inventory.bentMagnet &&
    !game.flags.disturbedBeehive &&
    game.currencies.copper >= BEEHIVE_UNLOCK_AMOUNT
  ) {
    content += `
${makeBox("DISTANT BUZZING", [
  "Something nearby has decided the forest needs more bees.",
  "",
  "The bent magnet twitches as if this is somehow your problem now.",
])}

    <span id="disturbBeehiveButton" class="asciiRealButton">Disturb the local beehive</span>

`;
  }

  // Before the first venture, gate the prompt on progress + copper. Afterward
  // keep the button available every visit until the player receives the map,
  // so a weaponless run can always get back to the woods and finish the story.
  const canFirstVenture =
    game.inventory.bentMagnet &&
    game.flags.disturbedBeehive &&
    game.currencies.copper >= MAP_UNLOCK_AMOUNT;

  if (
    !game.inventory.map &&
    (game.flags.reachedWoodedPath || canFirstVenture)
  ) {
    if (!game.flags.reachedWoodedPath) {
      content += `
${makeBox("SOMETHING MOVES", [
  "The bent magnet turns in your hand.",
  "",
  "It points past the copper can, toward a path deeper in the woods.",
])}
`;
    }

    content += `
    <span id="unlockMapButton" class="asciiRealButton">Venture into the woods</span>

`;
  }

  if (game.lastMessage !== "") {
    content += `
${makeBox("MESSAGE", [game.lastMessage])}

`;
  }

  mainContent.innerHTML =
    `${content}<span class="copperCanPageArt">${escapeHtml(copperCan)}</span>`;

  const gatherBitButton = document.getElementById("gatherBitButton");
  if (gatherBitButton) {
    gatherBitButton.addEventListener("click", gatherCopperBit);
  }

  const combatDemoFoxButton = document.getElementById("combatDemoFoxButton");
  if (combatDemoFoxButton) {
    combatDemoFoxButton.addEventListener("click", () =>
      startCombatDemo("darkTreeWatcher"),
    );
  }

  const combatDemoSkeletonButton = document.getElementById(
    "combatDemoSkeletonButton",
  );
  if (combatDemoSkeletonButton) {
    combatDemoSkeletonButton.addEventListener("click", () =>
      startCombatDemo("boneRattle"),
    );
  }

  const canHealButton = document.getElementById("canHealButton");
  if (canHealButton) {
    canHealButton.addEventListener("click", healPlayer);
  }

  const refuseCopperCanButton = document.getElementById(
    "refuseCopperCanButton",
  );
  if (refuseCopperCanButton) {
    refuseCopperCanButton.addEventListener("click", refuseCopperCan);
  }

  const ignoreCopperCanButton = document.getElementById(
    "ignoreCopperCanButton",
  );
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

  const investigateMagnetButton = document.getElementById(
    "investigateMagnetButton",
  );
  if (investigateMagnetButton) {
    investigateMagnetButton.addEventListener("click", investigateMagnet);
  }

  const buyBentMagnetButton = document.getElementById("buyBentMagnetButton");
  if (buyBentMagnetButton) {
    buyBentMagnetButton.addEventListener("click", buyBentMagnet);
  }

  const disturbBeehiveButton = document.getElementById("disturbBeehiveButton");
  if (disturbBeehiveButton) {
    disturbBeehiveButton.addEventListener("click", disturbBeehive);
  }

  const unlockMapButton = document.getElementById("unlockMapButton");
  if (unlockMapButton) {
    unlockMapButton.addEventListener("click", unlockMap);
  }
}
