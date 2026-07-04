// Authoring/verification tool for the baked "one big scene" string literals.
//
// Usage (from repo root):
//   bun scripts/bakeScenes.mjs golden <dir>   write current renders of every scene/state to <dir>
//   bun scripts/bakeScenes.mjs emit           print baked literals for the scene modules
//   bun scripts/bakeScenes.mjs verify <dir>   re-render from the baked literals + runtime
//                                             overlays and diff against a golden <dir>
//
// The compose* functions below mirror the original coordinate-composition code
// that used to live in js/render/darkForestScreen.js and js/render/townScreens.js.
// They are kept here as the authoring source: tweak coordinates, run `emit`, and
// paste the regenerated literals into js/asciiArt/.

import fs from "fs";
import path from "path";
import { getAsciiLines, placeSprite } from "../js/render/ascii.js";
import {
  clearAsciiArea,
  drawHorizontalRoad,
  drawVerticalRoad,
  placeAsciiArt,
  placeAsciiArtWithRowMask,
} from "../js/asciiArt/composition.js";
import {
  curvingLeftTrail,
  lowWideBush as natureLowWideBush,
  path as naturePath,
  smallBush,
  tree3,
  tree4,
} from "../js/asciiArt/nature.js";
import {
  bench,
  blacksmithShop,
  housesByRiver,
  lantern,
  riversideInn,
  shop,
  sign,
  villageHall,
} from "../js/asciiArt/townAssets.js";
import {
  darkTreeWatcherArt,
  elderPine,
  layeredPineLarge,
  villagerSmall,
  anvil,
  balance,
  banner,
  barrel,
  bed,
  coalPile,
  fireplace,
  furnace,
  hammer,
  mug,
  potions,
  shelf,
  table,
  throne,
  tongs,
  weaponRack,
} from "../js/asciiArtHelper.js";
import {
  lowWideBush,
  puffyBushMedium,
  splitBushPair,
} from "../js/asciiArt/nature.js";
import { makeBox } from "../js/helpers.js";

// ---------------------------------------------------------------------------
// Town / forest path composition (original coordinate sources for the baked
// townScene, forest, and forestTrailSignScene literals)
// ---------------------------------------------------------------------------

function composeTownScene() {
  const canvas = Array.from({ length: 40 }, () =>
    Array.from({ length: 112 }, () => " "),
  );

  placeAsciiArt(canvas, getAsciiLines(housesByRiver), 6, 0);

  drawVerticalRoad(canvas, 52, 19, 40);
  drawHorizontalRoad(canvas, 8, 105, 25);

  placeAsciiArt(canvas, getAsciiLines(villageHall), 57, 16);
  placeAsciiArt(canvas, getAsciiLines(riversideInn), 7, 15);
  placeAsciiArt(canvas, getAsciiLines(blacksmithShop), 76, 20);
  placeAsciiArt(canvas, getAsciiLines(shop), 34, 18);

  placeAsciiArt(canvas, getAsciiLines(bench), 41, 25);
  placeAsciiArt(canvas, getAsciiLines(bench), 60, 25);
  placeAsciiArt(canvas, getAsciiLines(lantern), 44, 25);
  placeAsciiArt(canvas, getAsciiLines(lantern), 55, 25);
  placeAsciiArt(canvas, getAsciiLines(tree3), 3, 28);
  placeAsciiArt(canvas, getAsciiLines(tree3), 55, 33);
  placeAsciiArt(canvas, getAsciiLines(tree4), 24, 33);
  placeAsciiArt(canvas, getAsciiLines(tree4), 84, 32);

  return canvas.map(row => row.join(""));
}

function composeForest() {
  const tree3Lines = getAsciiLines(tree3);
  const tree4Lines = getAsciiLines(tree4);
  const lowWideBushLines = getAsciiLines(natureLowWideBush);
  const smallBushLines = getAsciiLines(smallBush);
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 120 }, () => " "),
  );

  placeAsciiArt(canvas, getAsciiLines(naturePath), 44, 6);

  [
    [tree3Lines, 6, 2],
    [tree3Lines, 53, 0],
    [tree3Lines, 90, 1],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [smallBushLines, 24, 16],
    [lowWideBushLines, 57, 17],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [tree4Lines, 26, 0],
    [tree4Lines, 71, 0],
  ].forEach(([artLines, x, y]) =>
    placeAsciiArtWithRowMask(canvas, artLines, x, y),
  );

  [
    [smallBushLines, 4, 20],
  ].forEach(([artLines, x, y]) =>
    placeAsciiArtWithRowMask(canvas, artLines, x, y),
  );

  return canvas.map(row => row.join(""));
}

function composeForestTrailSign() {
  const tree3Lines = getAsciiLines(tree3);
  const tree4Lines = getAsciiLines(tree4);
  const lowWideBushLines = getAsciiLines(natureLowWideBush);
  const smallBushLines = getAsciiLines(smallBush);
  const signLines = getAsciiLines(sign);
  const signX = 34;
  const signY = 17;
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 100 }, () => " "),
  );

  placeAsciiArt(canvas, getAsciiLines(curvingLeftTrail), 12, 4);

  [
    [lowWideBushLines, 47, 15],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [tree3Lines, 0, 2],
    [tree4Lines, 65, -3],
    [tree3Lines, 34, -5],
    [smallBushLines, 2, 17],
    [smallBushLines, 16, 12],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [tree4Lines, 18, -6],
    [tree3Lines, 50, 6],
  ].forEach(([artLines, x, y]) =>
    placeAsciiArtWithRowMask(canvas, artLines, x, y),
  );

  clearAsciiArea(
    canvas,
    signX - 2,
    signY - 1,
    signLines.reduce((width, line) => Math.max(width, line.length), 0) + 4,
    signLines.length + 2,
  );
  placeAsciiArt(canvas, signLines, signX, signY);

  return canvas.map(row => row.join(""));
}

// ---------------------------------------------------------------------------
// Dark forest composition (mirrors js/render/darkForestScreen.js)
// ---------------------------------------------------------------------------

const DARK_FOREST_SCENE_WIDTH = 112;
const DARK_FOREST_SCENE_HEIGHT = 29;
const DARK_FOREST_WATCHER_POSITION = { x: 41, y: 12 };

function createDarkForestCanvas() {
  return Array.from({ length: DARK_FOREST_SCENE_HEIGHT }, () =>
    Array.from({ length: DARK_FOREST_SCENE_WIDTH }, () => " "),
  );
}

function placeRiverLine(canvas, x, y, width) {
  placeSprite(canvas, ["~".repeat(width)], x, y);
}

function getLineBounds(line) {
  const firstVisibleColumn = line.search(/\S/);
  if (firstVisibleColumn === -1) return null;
  let lastVisibleColumn = line.length - 1;
  while (
    lastVisibleColumn > firstVisibleColumn &&
    line[lastVisibleColumn] === " "
  ) {
    lastVisibleColumn -= 1;
  }
  return { firstVisibleColumn, lastVisibleColumn };
}

function placeSpriteWithRowMask(canvas, spriteLines, x, y) {
  spriteLines.forEach((line, rowOffset) => {
    const lineBounds = getLineBounds(line);
    if (!lineBounds) return;
    const rowIndex = y + rowOffset;
    if (rowIndex < 0 || rowIndex >= canvas.length) return;
    for (
      let columnOffset = lineBounds.firstVisibleColumn;
      columnOffset <= lineBounds.lastVisibleColumn;
      columnOffset += 1
    ) {
      const columnIndex = x + columnOffset;
      if (columnIndex < 0 || columnIndex >= canvas[0].length) continue;
      canvas[rowIndex][columnIndex] = line[columnOffset] ?? " ";
    }
  });
}

function placeDepthSortedSprites(canvas, sprites) {
  [...sprites]
    .sort((firstSprite, secondSprite) => firstSprite.y - secondSprite.y)
    .forEach(({ lines, x, y }) => {
      placeSpriteWithRowMask(canvas, lines, x, y);
    });
}

function composeWatcherBase() {
  const canvas = createDarkForestCanvas();
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const elderPineLines = getAsciiLines(elderPine);
  const splitBushPairLines = getAsciiLines(splitBushPair);

  placeDepthSortedSprites(canvas, [
    { lines: splitBushPairLines, x: 16, y: 15 },
  ]);

  placeDepthSortedSprites(canvas, [
    { lines: layeredPineLines, x: 3, y: 2 },
    { lines: layeredPineLines, x: 11, y: 0 },
    { lines: elderPineLines, x: 18, y: 1 },
    { lines: layeredPineLines, x: 33, y: 0 },
    { lines: elderPineLines, x: 61, y: 4 },
    { lines: elderPineLines, x: 46, y: 0 },
    { lines: layeredPineLines, x: 75, y: 0 },
    { lines: elderPineLines, x: 98, y: 5 },
    { lines: elderPineLines, x: 7, y: 9 },
    { lines: layeredPineLines, x: 27, y: 9 },
    { lines: elderPineLines, x: 55, y: 9 },
    { lines: elderPineLines, x: 84, y: 3 },
    { lines: layeredPineLines, x: 72, y: 8 },
    { lines: layeredPineLines, x: 92, y: 10 },
  ]);

  placeSprite(canvas, [
    "       DARK FOREST",
    "  the trees lean toward the river",
  ], 38, 2);
  placeRiverLine(canvas, 5, 29, 100);

  return canvas.map(row => row.join(""));
}

function composePineHollow() {
  const canvas = createDarkForestCanvas();
  const lowWideBushLines = getAsciiLines(lowWideBush);
  const elderPineLines = getAsciiLines(elderPine);
  const layeredPineLines = getAsciiLines(layeredPineLarge);

  placeDepthSortedSprites(canvas, [
    { lines: lowWideBushLines, x: 21, y: 21 },
    { lines: lowWideBushLines, x: 54, y: 15 },
    { lines: layeredPineLines, x: 31, y: 0 },
    { lines: elderPineLines, x: 47, y: 5 },
    { lines: layeredPineLines, x: 19, y: 1 },
    { lines: elderPineLines, x: 3, y: 3 },
    { lines: layeredPineLines, x: 73, y: 0 },
    { lines: elderPineLines, x: 83, y: 2 },
    { lines: layeredPineLines, x: 66, y: 1 },
    { lines: elderPineLines, x: 9, y: 14 },
    { lines: layeredPineLines, x: 38, y: -4 },
    { lines: elderPineLines, x: 58, y: -2 },
    { lines: layeredPineLines, x: 49, y: -5 },
    { lines: layeredPineLines, x: 92, y: 12 },
  ]);

  placeSprite(canvas, [
    "        BLACK PINE HOLLOW",
    "  the path narrows and forgets itself",
  ], 35, 2);
  placeRiverLine(canvas, 6, 28, 100);

  return canvas.map(row => row.join(""));
}

function composeOldRoot() {
  const canvas = createDarkForestCanvas();
  const elderPineLines = getAsciiLines(elderPine);
  const layeredPineLines = getAsciiLines(layeredPineLarge);
  const puffyBushLines = getAsciiLines(puffyBushMedium);

  placeDepthSortedSprites(canvas, [
    { lines: layeredPineLines, x: 0, y: 2 },
    { lines: layeredPineLines, x: 9, y: 0 },
    { lines: elderPineLines, x: 20, y: 4 },
    { lines: elderPineLines, x: 14, y: 2 },
    { lines: layeredPineLines, x: 34, y: 1 },
    { lines: elderPineLines, x: 54, y: 5 },
    { lines: layeredPineLines, x: 73, y: 2 },
    { lines: elderPineLines, x: 94, y: 3 },
    { lines: puffyBushLines, x: 7, y: 20 },
    { lines: puffyBushLines, x: 73, y: 18 },
  ]);

  placeSprite(canvas, [
    "          OLD ROOT STAND",
    "  the trees knit their feet together",
  ], 36, 2);
  placeRiverLine(canvas, 5, 28, 100);

  return canvas.map(row => row.join(""));
}

function withWatcher(baseLines) {
  const canvas = baseLines.map(line => [...line]);
  placeSpriteWithRowMask(
    canvas,
    darkTreeWatcherArt,
    DARK_FOREST_WATCHER_POSITION.x,
    DARK_FOREST_WATCHER_POSITION.y,
  );
  return canvas.map(row => row.join(""));
}

// ---------------------------------------------------------------------------
// Interior composition (mirrors js/render/townScreens.js)
// ---------------------------------------------------------------------------

function createRoomCanvas(width = 75, height = 24) {
  const canvas = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => " "),
  );
  for (let column = 0; column < width; column += 1) {
    canvas[0][column] = column === 0 || column === width - 1 ? "+" : "-";
    canvas[height - 1][column] =
      column === 0 || column === width - 1 ? "+" : "-";
  }
  for (let row = 1; row < height - 1; row += 1) {
    canvas[row][0] = "|";
    canvas[row][width - 1] = "|";
  }
  return canvas;
}

function placeInteriorLines(canvas, lines, x, y) {
  lines.forEach((line, rowOffset) => {
    [...line].forEach((character, columnOffset) => {
      const rowIndex = y + rowOffset;
      const columnIndex = x + columnOffset;
      if (
        rowIndex < 0 ||
        rowIndex >= canvas.length ||
        columnIndex < 0 ||
        columnIndex >= canvas[0].length
      ) {
        return;
      }
      canvas[rowIndex][columnIndex] = character;
    });
  });
}

function placeFurniture(canvas, art, x, y) {
  placeSprite(canvas, getAsciiLines(art), x, y);
}

function addRoomTitle(canvas, title) {
  placeInteriorLines(canvas, [`[ ${title} ]`], 3, 1);
}

function addRoomFloor(canvas) {
  const floorRow = canvas.length - 5;
  for (let column = 1; column < canvas[0].length - 1; column += 1) {
    canvas[floorRow][column] = "_";
  }
}

const VILLAGE_HALL_PILLAR = [
  "     ______     ",
  "  ,-'  ||  '-,  ",
  " /     ||     \\",
  "|=----=##=----=|",
  "|      ||      |",
  "|      ||      |",
  "|=----=##=----=|",
  "|      ||      |",
  "|      ||      |",
  "|=----=##=----=|",
  "|______||______|",
];

function composeVillageHallBase() {
  const canvas = createRoomCanvas();
  addRoomTitle(canvas, "Village Hall");
  addRoomFloor(canvas);
  placeFurniture(canvas, banner, 19, 4);
  placeFurniture(canvas, banner, 44, 4);
  placeInteriorLines(canvas, VILLAGE_HALL_PILLAR, 2, 2);
  placeInteriorLines(canvas, VILLAGE_HALL_PILLAR, 57, 2);
  placeFurniture(canvas, throne, 29, 11);
  placeSprite(canvas, getAsciiLines(villagerSmall), 18, 15);
  return canvas.map(row => row.join(""));
}

function withSpeechBox(baseLines, dialogueLines) {
  const canvas = baseLines.map(line => [...line]);
  const speechBox = makeBox("VILLAGER", dialogueLines, 33).split("\n");
  const speechBoxTop = canvas.length - 1 - speechBox.length;
  placeInteriorLines(canvas, speechBox, 28, speechBoxTop);
  return canvas.map(row => row.join(""));
}

function composeRiversideInn() {
  const canvas = createRoomCanvas();
  addRoomTitle(canvas, "Riverside Inn");
  addRoomFloor(canvas);
  placeFurniture(canvas, fireplace, 56, 12);
  placeFurniture(canvas, barrel, 19, 13);
  placeFurniture(canvas, table, 31, 16);
  placeFurniture(canvas, mug, 36, 9);
  placeFurniture(canvas, bed, 1, 11);
  placeFurniture(canvas, bed, 1, 13);
  return canvas.map(row => row.join(""));
}

function composeVillageShop() {
  const canvas = createRoomCanvas();
  addRoomTitle(canvas, "Village Shop");
  addRoomFloor(canvas);
  placeFurniture(canvas, shelf, 1, 9);
  placeFurniture(canvas, balance, 19, 7);
  placeFurniture(canvas, potions, 55, 9);
  return canvas.map(row => row.join(""));
}

function composeBlacksmith() {
  const canvas = createRoomCanvas();
  addRoomTitle(canvas, "Blacksmith");
  addRoomFloor(canvas);
  placeFurniture(canvas, tongs, 32, 4);
  placeFurniture(canvas, hammer, 44, 4);
  placeFurniture(canvas, furnace, 1, 1);
  placeFurniture(canvas, coalPile, 17, 11);
  placeFurniture(canvas, anvil, 36, 12);
  placeFurniture(canvas, weaponRack, 52, 9);
  return canvas.map(row => row.join(""));
}

// ---------------------------------------------------------------------------
// Village Hall dialogue states (mirrors js/render/townScreens.js)
// ---------------------------------------------------------------------------

const HALL_DIALOGUES = {
  challenge: [
    [
      "At night, a terrifying creature comes",
      "down from the dark trees across",
      "the river.",
    ],
    [
      "It scratches at shutters, steals",
      "from the hearths, and leaves",
      "claw marks in the mud.",
    ],
    [
      "Cross the river and face it.",
      "Avenge this town before the",
      "next moon rises.",
    ],
  ],
  waiting: [
    ["The dark forest waits across", "the river."],
    ["Return when the creature can", "trouble us no longer."],
  ],
  reward: [
    [
      "You came back.",
      "The shutters stayed still last",
      "night for the first time in years.",
    ],
    [
      "You liberated this village.",
      "Please take our oldest road map",
      "as thanks.",
    ],
  ],
  thanks: [
    ["The village breathes easier", "because of you."],
    [
      "Keep that map close.",
      "It knows the bends in the road",
      "better than memory does.",
    ],
  ],
};

// ---------------------------------------------------------------------------
// Scene/state table
// ---------------------------------------------------------------------------

async function loadStaticSceneExports() {
  const { townScene } = await import("../js/asciiArt/townScene.js");
  const { forest, forestTrailSignScene } = await import(
    "../js/asciiArt/forestScenes.js"
  );
  return { townScene, forest, forestTrailSignScene };
}

function composeAllStates() {
  const watcherBase = composeWatcherBase();
  const hallBase = composeVillageHallBase();
  const states = {
    "darkForest-oldRoot": composeOldRoot().join("\n"),
    "darkForest-pineHollow": composePineHollow().join("\n"),
    "darkForest-watcher-absent": watcherBase.join("\n"),
    "darkForest-watcher-present": withWatcher(watcherBase).join("\n"),
    "interior-riversideInn": composeRiversideInn().join("\n"),
    "interior-villageShop": composeVillageShop().join("\n"),
    "interior-blacksmith": composeBlacksmith().join("\n"),
  };
  for (const [name, dialogue] of Object.entries(HALL_DIALOGUES)) {
    dialogue.forEach((step, index) => {
      states[`interior-villageHall-${name}-${index}`] =
        withSpeechBox(hallBase, step).join("\n");
    });
  }
  return states;
}

async function newRenderAllStates() {
  // Renders every scene/state the way the refactored runtime does: baked
  // literal + the same dynamic overlays the render files apply.
  const {
    darkForestOldRoot,
    darkForestPineHollow,
    darkForestWatcherBase,
  } = await import("../js/asciiArt/darkForestScenes.js");
  const {
    villageHallBase,
    riversideInnInterior,
    villageShopInterior,
    blacksmithInterior,
  } = await import("../js/asciiArt/interiors.js");

  const states = {
    "darkForest-oldRoot": darkForestOldRoot,
    "darkForest-pineHollow": darkForestPineHollow,
    "darkForest-watcher-absent": darkForestWatcherBase,
    "darkForest-watcher-present":
      withWatcher(darkForestWatcherBase.split("\n")).join("\n"),
    "interior-riversideInn": riversideInnInterior,
    "interior-villageShop": villageShopInterior,
    "interior-blacksmith": blacksmithInterior,
  };
  for (const [name, dialogue] of Object.entries(HALL_DIALOGUES)) {
    dialogue.forEach((step, index) => {
      states[`interior-villageHall-${name}-${index}`] =
        withSpeechBox(villageHallBase.split("\n"), step).join("\n");
    });
  }
  return states;
}

// ---------------------------------------------------------------------------
// Literal emission
// ---------------------------------------------------------------------------

function toLiteral(name, lines) {
  const text = lines.join("\n");
  // String.raw keeps backslashes literal so the emitted art stays WYSIWYG.
  // Fall back to escaped strings for the rare content String.raw can't hold.
  if (text.includes("`") || text.includes("${") || text.endsWith("\\")) {
    const body = lines.map(line => `  ${JSON.stringify(line)},`).join("\n");
    return `export const ${name} = [\n${body}\n].join("\\n");`;
  }
  return `export const ${name} = String.raw\`\n${text}\`.slice(1);`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const [, , command, dir] = process.argv;

if (command === "golden") {
  if (!dir) throw new Error("usage: bakeScenes.mjs golden <dir>");
  fs.mkdirSync(dir, { recursive: true });
  const states = {
    townScene: composeTownScene().join("\n"),
    forest: composeForest().join("\n"),
    forestTrailSignScene: composeForestTrailSign().join("\n"),
    ...composeAllStates(),
  };
  for (const [name, text] of Object.entries(states)) {
    fs.writeFileSync(path.join(dir, `${name}.txt`), text);
  }
  console.log(`wrote ${Object.keys(states).length} golden files to ${dir}`);
} else if (command === "emit") {
  const emitted = [
    toLiteral("townScene", composeTownScene()),
    toLiteral("forest", composeForest()),
    toLiteral("forestTrailSignScene", composeForestTrailSign()),
    toLiteral("darkForestOldRoot", composeOldRoot()),
    toLiteral("darkForestPineHollow", composePineHollow()),
    toLiteral("darkForestWatcherBase", composeWatcherBase()),
    toLiteral("villageHallBase", composeVillageHallBase()),
    toLiteral("riversideInnInterior", composeRiversideInn()),
    toLiteral("villageShopInterior", composeVillageShop()),
    toLiteral("blacksmithInterior", composeBlacksmith()),
  ];
  console.log(emitted.join("\n\n"));
} else if (command === "verify") {
  if (!dir) throw new Error("usage: bakeScenes.mjs verify <dir>");
  const staticScenes = await loadStaticSceneExports();
  const states = {
    townScene: staticScenes.townScene,
    forest: staticScenes.forest,
    forestTrailSignScene: staticScenes.forestTrailSignScene,
    ...(await newRenderAllStates()),
  };
  let failures = 0;
  for (const [name, text] of Object.entries(states)) {
    const goldenPath = path.join(dir, `${name}.txt`);
    if (!fs.existsSync(goldenPath)) {
      console.error(`MISSING GOLDEN: ${name}`);
      failures += 1;
      continue;
    }
    const golden = fs.readFileSync(goldenPath, "utf8");
    if (golden !== text) {
      console.error(`DIFF: ${name}`);
      failures += 1;
    }
  }
  if (failures > 0) {
    console.error(`${failures} scene state(s) differ from golden`);
    process.exit(1);
  }
  console.log(`all ${Object.keys(states).length} scene states byte-identical`);
} else {
  console.error("usage: bakeScenes.mjs golden <dir> | emit | verify <dir>");
  process.exit(1);
}
