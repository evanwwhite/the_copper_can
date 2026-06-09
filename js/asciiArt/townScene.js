import {
  drawHorizontalRoad,
  drawVerticalRoad,
  getAsciiLines,
  placeAsciiArt,
} from "./composition.js";
import {
  tree1,
  tree2,
} from "./nature.js";
import {
  bench,
  blacksmithShop,
  housesByRiver,
  lantern,
  riversideInn,
  shop,
  villageHall,
} from "./townAssets.js";

export const townScene = (() => {
  const housesByRiverLines = getAsciiLines(housesByRiver);
  const riversideInnLines = getAsciiLines(riversideInn);
  const blacksmithShopLines = getAsciiLines(blacksmithShop);
  const villageHallLines = getAsciiLines(villageHall);
  const shopLines = getAsciiLines(shop);
  const benchLines = getAsciiLines(bench);
  const lanternLines = getAsciiLines(lantern);
  const tree1Lines = getAsciiLines(tree1);
  const tree2Lines = getAsciiLines(tree2);
  const canvas = Array.from({ length: 40 }, () =>
    Array.from({ length: 112 }, () => " "),
  );

  placeAsciiArt(canvas, housesByRiverLines, 6, 0);

  drawVerticalRoad(canvas, 52, 19, 40);
  drawHorizontalRoad(canvas, 8, 105, 25);

  placeAsciiArt(canvas, villageHallLines, 57, 16);
  placeAsciiArt(canvas, riversideInnLines, 7, 15);
  placeAsciiArt(canvas, blacksmithShopLines, 76, 20);
  placeAsciiArt(canvas, shopLines, 34, 18);

  placeAsciiArt(canvas, benchLines, 41, 25);
  placeAsciiArt(canvas, benchLines, 60, 25);
  placeAsciiArt(canvas, lanternLines, 44, 25);
  placeAsciiArt(canvas, lanternLines, 55, 25);
  placeAsciiArt(canvas, tree1Lines, 3, 28);
  placeAsciiArt(canvas, tree2Lines, 103, 23);

  return canvas.map(row => row.join("")).join("\n");
})();
