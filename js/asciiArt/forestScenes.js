import {
  clearAsciiArea,
  getAsciiLines,
  placeAsciiArt,
  placeAsciiArtWithRowMask,
} from "./composition.js";
import {
  curvingLeftTrail,
  path,
  tree1,
  tree2,
  tree3,
  tree4,
} from "./nature.js";
import {
  sign,
} from "./townAssets.js";

export const forest = (() => {
  const tree3Lines = getAsciiLines(tree3);
  const tree4Lines = getAsciiLines(tree4);
  const bush1Lines = [
    "  .--.  ",
    ".(    ).",
    " '-..-' ",
  ];
  const bush2Lines = [
    " .-..-. ",
    "(      )",
    " `-..-' ",
  ];
  const pathLines = getAsciiLines(path);
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 120 }, () => " "),
  );

  placeAsciiArt(canvas, pathLines, 51, 14);

  [
    [tree3Lines, 0, 0],
    [tree4Lines, 44, 0],
    [tree3Lines, 85, 0],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  [
    [tree4Lines, 20, 2],
    [tree3Lines, 64, 3],
  ].forEach(([artLines, x, y]) =>
    placeAsciiArtWithRowMask(canvas, artLines, x, y),
  );

  [
    [bush1Lines, 8, 20],
    [bush2Lines, 36, 19],
    [bush1Lines, 57, 21],
    [bush2Lines, 83, 19],
    [bush1Lines, 105, 20],
  ].forEach(([artLines, x, y]) =>
    placeAsciiArtWithRowMask(canvas, artLines, x, y),
  );

  return canvas.map(row => row.join("")).join("\n");
})();

export const forestTrailSignScene = (() => {
  const tree1Lines = getAsciiLines(tree1);
  const tree2Lines = getAsciiLines(tree2);
  const signLines = getAsciiLines(sign);
  const trailLines = getAsciiLines(curvingLeftTrail);
  const signX = 37;
  const signY = 7;
  const foregroundTree = [tree1Lines, 50, 9];
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 100 }, () => " "),
  );

  placeAsciiArt(canvas, trailLines, 8, 4);

  [
    [tree2Lines, 0, 6],
    [tree1Lines, 6, 0],
    [tree2Lines, 14, 8],
    [tree1Lines, 20, 2],
    [tree2Lines, 31, 0],
    [tree2Lines, 46, -7],
    [tree2Lines, 62, 2],
    [tree1Lines, 68, -1],
    [tree2Lines, 76, 8],
    [tree1Lines, 82, 1],
    [tree2Lines, 92, 5],
  ].forEach(([artLines, x, y]) => placeAsciiArt(canvas, artLines, x, y));

  clearAsciiArea(
    canvas,
    signX - 2,
    signY - 1,
    signLines.reduce((width, line) => Math.max(width, line.length), 0) + 4,
    signLines.length + 2,
  );
  placeAsciiArt(canvas, signLines, signX, signY);
  placeAsciiArt(canvas, ...foregroundTree);

  return canvas.map(row => row.join("")).join("\n");
})();
