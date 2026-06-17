import {
  clearAsciiArea,
  getAsciiLines,
  placeAsciiArt,
  placeAsciiArtWithRowMask,
} from "./composition.js";
import {
  curvingLeftTrail,
  lowWideBush,
  path,
  smallBush,
  tree3,
  tree4,
} from "./nature.js";
import {
  sign,
} from "./townAssets.js";

export const forest = (() => {
  const tree3Lines = getAsciiLines(tree3);
  const tree4Lines = getAsciiLines(tree4);
  const lowWideBushLines = getAsciiLines(lowWideBush);
  const smallBushLines = getAsciiLines(smallBush);
  const pathLines = getAsciiLines(path);
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 120 }, () => " "),
  );

  placeAsciiArt(canvas, pathLines, 44, 6);

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

  return canvas.map(row => row.join("")).join("\n");
})();

export const forestTrailSignScene = (() => {
  const tree3Lines = getAsciiLines(tree3);
  const tree4Lines = getAsciiLines(tree4);
  const lowWideBushLines = getAsciiLines(lowWideBush);
  const smallBushLines = getAsciiLines(smallBush);
  const signLines = getAsciiLines(sign);
  const trailLines = getAsciiLines(curvingLeftTrail);
  const signX = 34;
  const signY = 17;
  const canvas = Array.from({ length: 24 }, () =>
    Array.from({ length: 100 }, () => " "),
  );

  placeAsciiArt(canvas, trailLines, 12, 4);

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

  return canvas.map(row => row.join("")).join("\n");
})();
