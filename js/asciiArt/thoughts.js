const LEFT_COLUMN_WIDTH = 63;
const RIGHT_COLUMN_WIDTH = 26;
const LEFT_PANEL_INNER_WIDTH = 57;
const RIGHT_PANEL_INNER_WIDTH = 20;

function fitCell(text, width) {
  if (text.length > width) {
    return text.slice(0, width);
  }

  return text.padEnd(width, " ");
}

function wrapThoughtText(text, width) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach(word => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function makeThoughtLines(thoughtEntries) {
  if (thoughtEntries.length === 0) {
    return ["No thoughts yet."];
  }

  return thoughtEntries.flatMap(({ number, text }, index) => {
    const prefix = `${number}. `;
    const indent = " ".repeat(prefix.length);
    const wrappedLines = wrapThoughtText(
      text,
      LEFT_PANEL_INNER_WIDTH - prefix.length,
    );
    const thoughtLines = wrappedLines.map((line, lineIndex) => {
      return lineIndex === 0 ? `${prefix}${line}` : `${indent}${line}`;
    });

    return index === thoughtEntries.length - 1
      ? thoughtLines
      : [...thoughtLines, ""];
  });
}

function makeLeftPanelLines(thoughtEntries) {
  return [
    ` +${"-".repeat(LEFT_PANEL_INNER_WIDTH + 2)}+ `,
    ...makeThoughtLines(thoughtEntries).map(line =>
      ` | ${fitCell(line, LEFT_PANEL_INNER_WIDTH)} | `,
    ),
    ` +${"-".repeat(LEFT_PANEL_INNER_WIDTH + 2)}+ `,
  ];
}

function makeRightPanelLines(unlockedCount) {
  return [
    ` +${"-".repeat(RIGHT_PANEL_INNER_WIDTH + 2)}+ `,
    ` | ${fitCell("newest at top", RIGHT_PANEL_INNER_WIDTH)} | `,
    ` | ${fitCell("older below", RIGHT_PANEL_INNER_WIDTH)} | `,
    ` +${"-".repeat(RIGHT_PANEL_INNER_WIDTH + 2)}+ `,
    " ".repeat(RIGHT_COLUMN_WIDTH),
    ` +${"-".repeat(RIGHT_PANEL_INNER_WIDTH + 2)}+ `,
    ` | ${fitCell(`${unlockedCount} unlocked`, RIGHT_PANEL_INNER_WIDTH)} | `,
    ` +${"-".repeat(RIGHT_PANEL_INNER_WIDTH + 2)}+ `,
  ];
}

function makeThoughtsScreenLine(leftContent, rightContent) {
  return `|${fitCell(leftContent, LEFT_COLUMN_WIDTH)}|${fitCell(rightContent, RIGHT_COLUMN_WIDTH)}|`;
}

export function buildThoughtsScreenArt(thoughtEntries) {
  const leftPanelLines = makeLeftPanelLines(thoughtEntries);
  const rightPanelLines = makeRightPanelLines(thoughtEntries.length);
  const screenRows = Math.max(leftPanelLines.length, rightPanelLines.length);
  const bodyLines = Array.from({ length: screenRows }, (_, index) =>
    makeThoughtsScreenLine(
      leftPanelLines[index] || " ".repeat(LEFT_COLUMN_WIDTH),
      rightPanelLines[index] || " ".repeat(RIGHT_COLUMN_WIDTH),
    ),
  );
  const divider = `+${"=".repeat(LEFT_COLUMN_WIDTH)}+${"=".repeat(RIGHT_COLUMN_WIDTH)}+`;

  return [
    divider,
    makeThoughtsScreenLine(" >_ Thoughts <[x]", " > STACK"),
    divider,
    ...bodyLines,
    divider,
  ].join("\n");
}
