import {
  getAsciiLines,
  placeAsciiArt,
  placeAsciiArtWithRowMask,
} from "./composition.js";

// ---- COMBAT SPRITES ----
// Candy Box 2 style: 3-5 lines, instant legibility, minimal characters

export const goblinCombatArt = [
  "  (o.o)",
  "  _)-(_",
  "  / \\  ",
];

export const slimeCombatArt = [
  "  .o--o. ",
  " (  .v.  )",
  "  '-----' ",
];

export const wolfCombatArt = [
  "   _^_  ",
  "  (0.0) ",
  "  )--<  ",
];

export const skeletonCombatArt = [
  "   _o_  ",
  "  (X.X) ",
  "   /|\\ ",
  "   / \\ ",
];

export const batCombatArt = [
  " /\\  o  /\\",
  " (  '.'  )",
  "   '---'  ",
];

// ---- NATURE ELEMENTS ----

export const mushroom = String.raw`
   .-.
  ( . )
  '-.-'
   | |
  /_|_\
`;

export const flowerPatch = String.raw`
  (Y)   (Y)   (Y)
   |     |     |
  /|\   /|\   /|\
`;

export const crystalCluster = String.raw`
  *   *   *
  |  /|\  |
  | / | \ |
  |/  |  \|
  '-------'
`;

export const glowingMushroom = String.raw`
     *
   .-.
 *(o.o)*
  '-.-'
   | |
  /_|_\
`;

// ---- TOWN ELEMENTS ----

export const well = String.raw`
    _____
   /  _  \
  | (   ) |
  |_______|
    || ||
`;

export const firepit = String.raw`
   \|/
   -Y-
  _____
 (_____)
`;

export const marketStall = String.raw`
 .~~~~~~~~~.
 |  WARES  |
 |_________|
  |  | |  |
  |__|_|__|
`;

export const fountain = String.raw`
    .~.
  .-'|'-.
 (   |   )
  '-.|.-'
  .=====.
`;

// ---- ENVIRONMENT / DUNGEON ----

export const caveEntrance = String.raw`
       .---.
     .'     '.
    /  .---.  \
   | ./     \. |
   | |       | |
    \ \     / /
     '.'-.-'.'
      '-----'
`;

export const caveRock = String.raw`
   .--.
  (. . )
   '--'
`;

export const ruinedPillar = String.raw`
 [=====]
 |     |
 | . . |
 [-----]
 |     |
  '---'
`;

export const ancientRuin = String.raw`
 [===]   [===]
 |   |   |   |
 |   |   |   |
 [---]   [---]
  | |     | |
__| |_____|_|__
`;

export const stoneBridge = String.raw`
  _____________
 /             \
| . . . . . . . |
|_______________|
  |           |
  |           |
`;

export const torchSconce = String.raw`
 \|/
 (*)
  |
 [=]
`;

// ---- ITEM ASSETS ----

export const swordAsset = String.raw`
    /\
    ||
    ||
   _||_
`;

export const shieldAsset = String.raw`
  /---\
  | O |
   \-/
`;

export const potionAsset = String.raw`
  .--.
  |**|
   \/
`;

export const torchAsset = String.raw`
  (*)
   |
  /|\
`;

export const keyAsset = String.raw`
  (o)
   |
  _|_
`;

export const scrollAsset = String.raw`
  .---.
 (     )
 | ~ ~ |
 | ~ ~ |
  '---'
`;

export const chestAsset = String.raw`
 .--------.
 |  .--.  |
 |  |  |  |
 '--------'
`;

// ---- COMPOSED CAVE SCENE ----

export const caveScene = (() => {
  const caveEntranceLines = getAsciiLines(caveEntrance);
  const caveRockLines = getAsciiLines(caveRock);
  const mushroomLines = getAsciiLines(mushroom);
  const crystalLines = getAsciiLines(crystalCluster);
  const ruinedPillarLines = getAsciiLines(ruinedPillar);

  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 80 }, () => " "),
  );

  placeAsciiArt(canvas, crystalLines, 2, 1);
  placeAsciiArt(canvas, crystalLines, 65, 0);

  placeAsciiArt(canvas, caveEntranceLines, 33, 7);

  [
    [ruinedPillarLines, 6, 8],
    [ruinedPillarLines, 62, 9],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [caveRockLines, 4, 18],
    [caveRockLines, 68, 17],
    [caveRockLines, 22, 20],
    [caveRockLines, 52, 19],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [mushroomLines, 16, 17],
    [mushroomLines, 56, 16],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  return canvas.map(row => row.join("")).join("\n");
})();
