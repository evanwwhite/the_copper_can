import {
  getAsciiLines,
  placeAsciiArt,
  placeAsciiArtWithRowMask,
} from "./composition.js";

// ---- COMBAT SPRITES ----
// Candy Box 2 style: 3-5 lines, instant legibility, minimal characters
 
export const marketStall = String.raw`
 .~~~~~~~~~.
 |_/\___/\_|
 |_________|
  |o |,| o|
  |__|_|__|###
`;
 
export const bed = String.raw`
 |
 |.--.__________
 ||  | ~~~~~~~~ |
 |'--' ~~~~~~~~ |
 |~~~~~~~~~~~~~~|
 ||            ||
`;
 
export const table = String.raw`
  ________________
 /________________\
  ||            ||
  ||            ||
`;
 
export const cauldronOverFire = String.raw`
     .---.
    |     |
   ."-----".
___\  ~~~  /___
|   \_____/   |
|   ) ( ) (   |
|  ( ( ( ) )  |
| __\__|__/__ |
`;
 
export const barrel = String.raw`
  ._____.
 /=======\
 |=======|
 \=======/
  '-----'
`;
 
export const barrelPile = String.raw`
       ._____.
      /=======\
      |=======|
      \=======/
  .____'-----'____.
 /=======\ /=======\
 |=======| |=======|
 \=======/ \=======/
  '-----'   '-----'
`;
 
export const mug = String.raw`
  ______
 |~~~~~~|__
 |------|  |
 |~~~~~~|__|
 |______|
`;
 
export const bookshelf = String.raw`
  _______________
 | |||| |||| ||| |
 |_______________|
 | || |||| ||||| |
 |_______________|
 | |||| || ||||| |
 |_______________|
`;
 
export const wardrobe = String.raw`
  _____________
 | .--. | .--. |
 | |--| | |--| |
 | | ,| | |, | |
 | '--' | '--' |
 |______|______|
 ||           ||
`;
 
export const anvil = String.raw`
   ________
  /________\
 (__________)
    |    |
    |____|
   /______\
`;
 
export const furnace = String.raw`
 ._______________.
 | .-----------. |
 | | ) ( ) ( ) | |
 | |( (o)(o) ) | |
 | |__\___/____| |
 |_______________|
 |##|         |##|
`;
 
export const fireplace = String.raw`
 .-------------.
 | .---------. |
 | |   ( ) . | |
 | |. ( :  ) | |
 | | ) ( ) ( | |
 | |_\_/\_/_ | |
 '-------------'
`;
 
export const weaponRack = String.raw`
 |-----------------| 
 |  |   |   |   |  |
 |  |   |   |   |  |
 |  |   |   |   |  |
 | =+= =+= =+= =+= |
 |_[|__|]__[|__[|__|
`;
 
export const hammer = String.raw`
  _____
 |_____|
   | |
   | |
   |_|
`;
 
export const tongs = String.raw`
  |     |
   \___/
   |   |
   |   |
    \ / 
`;
 
export const coalPile = String.raw`
      . o .
    o . O o .
   . O o . O o
  o . O . o O .
  '-----------'
`;
 
export const shelf = String.raw`
  _________________
 | (o) (o) (o) (o) |
 |_________________|
 | [#] [#] [#] [#] |
 |_________________|
 | (~) (~) (~) (~) |
 |_________________|
`;
 
export const balance = String.raw`
    ,___I___,
    |   |   |
   _I_  |  _I_
  (___) | (___)
        |
       _I_
      |___|
`;
 
export const potions = String.raw`
 .--------------.
 |  Y  Y  Y  Y  |
 | (~)(~)(~)(~) |
 |--------------|
 |  Y  Y  Y  Y  |
 | (~)(~)(~)(~) |
 '--------------'
`;
 
export const drawer = String.raw`
  _____________
 | ___________ |
 ||_____o_____||
 | ___________ |
 ||_____o_____||
 |_____________|
`;
 
export const throne = String.raw`
   .|. .|. .|.
   | |_| |_| |
   |         |
  _|   ___   |_
 |  |_(___)_|  |
 |  |_______|  |
 |_____________|
`;
 
export const banner = String.raw`
  __====__
 |~~~~~~~~|
 |   /\   |
 |  /  \  |
 |  \  /  |
 |   \/   |
  \~~~~~~/
   \    /
    \  /
     \/
`;
 
export const column = String.raw`
 ___________
 |_________|
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
   |     |
  _|_____|_
 |_________|
`;
 
export const drawer = String.raw`
   _______________
  /               \
 /_________________\
 |  _____________  |
 | |  [O]   [O]  | |
 | |_____________| |
 |_________________|
`;

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
