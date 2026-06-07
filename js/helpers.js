export const BOX_TEXT_WIDTH = 49;

export function repeatChar(character, amount) {
  return character.repeat(amount);
}

export function centerText(text, width) {
  const value = String(text);
  const totalPadding = Math.max(width - value.length, 0);
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;

  return `${repeatChar(" ", leftPadding)}${value}${repeatChar(" ", rightPadding)}`;
}

export function formatBoxLine(text, width = BOX_TEXT_WIDTH) {
  return `│  ${String(text).padEnd(width, " ")}  │`;
}

export function wrapText(text, width = BOX_TEXT_WIDTH) {
  const paragraphs = String(text).split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (word.length > width) {
        if (currentLine !== "") {
          lines.push(currentLine);
          currentLine = "";
        }

        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }

        continue;
      }

      const testLine = currentLine === "" ? word : `${currentLine} ${word}`;

      if (testLine.length > width) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine !== "") {
      lines.push(currentLine);
    }
  }

  return lines;
}

export function makeBox(title, lines = [], width = BOX_TEXT_WIDTH) {
  const borderWidth = width + 4;
  const topBorder = `┌${repeatChar("─", borderWidth)}┐`;
  const divider = `├${repeatChar("─", borderWidth)}┤`;
  const bottomBorder = `└${repeatChar("─", borderWidth)}┘`;

  const bodyLines = lines.flatMap(line => wrapText(line, width));

  return [
    topBorder,
    formatBoxLine(centerText(title, width), width),
    divider,
    ...bodyLines.map(line => formatBoxLine(line, width)),
    bottomBorder,
  ].join("\n");
}

export function makePreformattedBox(title, lines = [], width = BOX_TEXT_WIDTH) {
  const borderWidth = width + 4;
  const topBorder = `┌${repeatChar("─", borderWidth)}┐`;
  const divider = `├${repeatChar("─", borderWidth)}┤`;
  const bottomBorder = `└${repeatChar("─", borderWidth)}┘`;

  return [
    topBorder,
    formatBoxLine(centerText(title, width), width),
    divider,
    ...lines.map(line => formatBoxLine(line, width)),
    bottomBorder,
  ].join("\n");
}
