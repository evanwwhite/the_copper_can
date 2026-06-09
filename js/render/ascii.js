export function overlayAsciiArt(baseArt, overlays) {
  const lines = baseArt.trim().split("\n").map(line => [...line]);

  overlays.forEach(({ art, x, y }) => {
    art.trim().split("\n").forEach((artLine, artY) => {
      [...artLine].forEach((character, artX) => {
        if (character === " ") return;

        const targetY = y + artY;
        const targetX = x + artX;

        if (!lines[targetY] || targetX < 0 || targetX >= lines[targetY].length) {
          return;
        }

        lines[targetY][targetX] = character;
      });
    });
  });

  return lines.map(line => line.join("")).join("\n");
}

export function getAsciiLines(art) {
  return art.split("\n").filter(line => line.trim() !== "");
}

export function placeSprite(canvas, spriteLines, x, y) {
  spriteLines.forEach((line, rowOffset) => {
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

export function getSpriteWidth(spriteLines) {
  return spriteLines.reduce((maximumWidth, line) => {
    return Math.max(maximumWidth, line.length);
  }, 0);
}
