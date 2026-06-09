export function getAsciiLines(art) {
  return art.split("\n").filter(line => line.trim() !== "");
}

export function placeAsciiArt(canvas, artLines, x, y) {
  artLines.forEach((line, rowOffset) => {
    [...line].forEach((character, columnOffset) => {
      const rowIndex = y + rowOffset;
      const columnIndex = x + columnOffset;

      if (
        character === " " ||
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

function getAsciiLineBounds(line) {
  const characters = [...line];
  const firstCharacterIndex = characters.findIndex(character => character !== " ");

  if (firstCharacterIndex === -1) {
    return null;
  }

  let lastCharacterIndex = characters.length - 1;

  while (characters[lastCharacterIndex] === " ") {
    lastCharacterIndex -= 1;
  }

  return [firstCharacterIndex, lastCharacterIndex];
}

export function placeAsciiArtWithRowMask(canvas, artLines, x, y) {
  artLines.forEach((line, rowOffset) => {
    const bounds = getAsciiLineBounds(line);
    const rowIndex = y + rowOffset;

    if (!bounds || rowIndex < 0 || rowIndex >= canvas.length) {
      return;
    }

    const [firstColumnOffset, lastColumnOffset] = bounds;

    for (
      let columnOffset = firstColumnOffset;
      columnOffset <= lastColumnOffset;
      columnOffset += 1
    ) {
      const columnIndex = x + columnOffset;

      if (columnIndex < 0 || columnIndex >= canvas[0].length) {
        continue;
      }

      canvas[rowIndex][columnIndex] = " ";
    }
  });

  placeAsciiArt(canvas, artLines, x, y);
}

export function clearAsciiArea(canvas, x, y, width, height) {
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      const rowIndex = y + rowOffset;
      const columnIndex = x + columnOffset;

      if (
        rowIndex < 0 ||
        rowIndex >= canvas.length ||
        columnIndex < 0 ||
        columnIndex >= canvas[0].length
      ) {
        continue;
      }

      canvas[rowIndex][columnIndex] = " ";
    }
  }
}

export function drawHorizontalRoad(canvas, xStart, xEnd, y) {
  for (let columnIndex = xStart; columnIndex <= xEnd; columnIndex += 1) {
    if (
      y < 0 ||
      y + 1 >= canvas.length ||
      columnIndex < 0 ||
      columnIndex >= canvas[0].length
    ) {
      continue;
    }

    canvas[y][columnIndex] = columnIndex % 2 === 0 ? "=" : "-";
    canvas[y + 1][columnIndex] = columnIndex % 2 === 0 ? "." : "-";
  }
}

export function drawVerticalRoad(canvas, x, yStart, yEnd) {
  for (let rowIndex = yStart; rowIndex <= yEnd; rowIndex += 1) {
    if (
      rowIndex < 0 ||
      rowIndex >= canvas.length ||
      x < 0 ||
      x + 3 >= canvas[0].length
    ) {
      continue;
    }

    canvas[rowIndex][x] = "|";
    canvas[rowIndex][x + 1] = " ";
    canvas[rowIndex][x + 2] = " ";
    canvas[rowIndex][x + 3] = "|";
  }
}
