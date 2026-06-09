export const mapLines = [
  "",
  "                 Old Iron Sign",
  "                        ▲",
  "                        │",
  "                 Wooded Path",
  "                        │",
  "                        ▼",
  "                    Copper Can",
  "",
  "",
  "The forest is larger than it seemed.",
  "The magnet points first toward a path deeper in.",
];

export function buildMapScreenLines({
  hasReachedTown = false,
  hasAcceptedDarkForestChallenge = false,
  hasDefeatedDarkTreeWatcher = false,
} = {}) {
  const darkForestLabel = hasDefeatedDarkTreeWatcher
    ? "Dark Forest - quiet now"
    : "Dark Forest";
  const signLabel = hasDefeatedDarkTreeWatcher
    ? "Rusty Iron Sign - defeated"
    : "Rusty Iron Sign";
  const townLabel = hasReachedTown
    ? "Village Hall"
    : "Village Hall - unknown";
  const darkForestConnector = hasAcceptedDarkForestChallenge ? "|" : "?";
  const townConnector = hasReachedTown ? "v" : "?";

  return [
    "",
    `                 ${signLabel}`,
    "                        ^",
    `                        ${darkForestConnector}`,
    `                 ${darkForestLabel}`,
    "                        |",
    `                        ${townConnector}`,
    `                 ${townLabel}`,
    "                        ^",
    "                        |",
    "                 Wooded Path",
    "                        |",
    "                        v",
    "                    Copper Can",
    "",
    "",
    hasDefeatedDarkTreeWatcher
      ? "The village road is open and the trees no longer lean in."
      : "The map marks the road, the village, and the thing beyond it.",
    "Choose a place and the route folds itself under your feet.",
  ];
}
