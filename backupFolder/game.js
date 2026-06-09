/*
  Bits Box prototype
  ------------------------------------------------------------
  New structure:
  1. The first screen says "Untitled."
  2. The player starts with only the scene and a copper bit action.
  3. The top bar slowly unlocks.
  4. Copper Can appears after getting 1 copper bit.
  5. Thoughts appears after clicking "Become self aware."
  6. Pack appears after buying the bent magnet.
  7. Map appears after following the magnet toward the trees.
  8. Save and Settings appear after the player has at least 1 copper bit.
*/

const BENT_MAGNET_COST = 20;
const MAP_UNLOCK_AMOUNT = 35;
const SAVE_KEY = "bitsBoxPrototypeSave";

const game = {
  screen: "intro",
  currentView: "can",

  copperBits: 0,
  silverBits: 0,
  goldBits: 0,
  hasUnlockedSilverBits: false,
  hasUnlockedGoldBits: false,

  health: 10,
  maxHealth: 10,

  hasCopperCan: false,
  hasBentMagnet: false,
  hasInvestigatedMagnet: false,
  bentMagnetBitsPerSecond: 1,

  hasUnlockedCopperCan: false,
  hasUnlockedPack: false,
  hasUnlockedThoughts: false,
  hasUnlockedMap: false,
  hasUnlockedSave: false,
  hasUnlockedSettings: false,

  hasSeenTitleReveal: false,

  lastMessage: "",
  timerId: null,
};

const statusBar = document.getElementById("statusBar");
const mainContent = document.getElementById("mainContent");

function saveGame() {
  const saveData = {
    screen: game.screen,
    currentView: game.currentView,

    copperBits: game.copperBits,
    silverBits: game.silverBits,
    goldBits: game.goldBits,
    hasUnlockedSilverBits: game.hasUnlockedSilverBits,
    hasUnlockedGoldBits: game.hasUnlockedGoldBits,

    health: game.health,
    maxHealth: game.maxHealth,

    hasCopperCan: game.hasCopperCan,
    hasBentMagnet: game.hasBentMagnet,
    hasInvestigatedMagnet: game.hasInvestigatedMagnet,
    bentMagnetBitsPerSecond: game.bentMagnetBitsPerSecond,

    hasUnlockedCopperCan: game.hasUnlockedCopperCan,
    hasUnlockedPack: game.hasUnlockedPack,
    hasUnlockedThoughts: game.hasUnlockedThoughts,
    hasUnlockedMap: game.hasUnlockedMap,
    hasUnlockedSave: game.hasUnlockedSave,
    hasUnlockedSettings: game.hasUnlockedSettings,

    hasSeenTitleReveal: game.hasSeenTitleReveal,
    lastMessage: game.lastMessage,
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const rawSave = localStorage.getItem(SAVE_KEY);

  if (!rawSave) return;

  try {
    const saveData = JSON.parse(rawSave);

    game.screen = saveData.screen ?? "intro";
    game.currentView = saveData.currentView ?? "can";

    game.copperBits = saveData.copperBits ?? 0;
    game.silverBits = saveData.silverBits ?? 0;
    game.goldBits = saveData.goldBits ?? 0;
    game.hasUnlockedSilverBits = saveData.hasUnlockedSilverBits ?? false;
    game.hasUnlockedGoldBits = saveData.hasUnlockedGoldBits ?? false;

    game.health = saveData.health ?? 10;
    game.maxHealth = saveData.maxHealth ?? 10;

    game.hasCopperCan = saveData.hasCopperCan ?? false;
    game.hasBentMagnet = saveData.hasBentMagnet ?? false;
    game.hasInvestigatedMagnet = saveData.hasInvestigatedMagnet ?? false;
    game.bentMagnetBitsPerSecond = saveData.bentMagnetBitsPerSecond ?? 1;

    game.hasUnlockedCopperCan = saveData.hasUnlockedCopperCan ?? false;
    game.hasUnlockedPack = saveData.hasUnlockedPack ?? false;
    game.hasUnlockedThoughts = saveData.hasUnlockedThoughts ?? false;
    game.hasUnlockedMap = saveData.hasUnlockedMap ?? false;
    game.hasUnlockedSave = saveData.hasUnlockedSave ?? false;
    game.hasUnlockedSettings = saveData.hasUnlockedSettings ?? false;

    game.hasSeenTitleReveal = saveData.hasSeenTitleReveal ?? false;
    game.lastMessage = saveData.lastMessage ?? "";
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

function startTimer() {
  if (game.timerId !== null) return;

  game.timerId = window.setInterval(() => {
    if (game.screen !== "game") return;

    if (game.hasBentMagnet) {
      game.copperBits += game.bentMagnetBitsPerSecond;
      unlockBasicsAfterFirstBit();
      checkForTitleReveal();
      saveGame();
      renderGameScreen();
    }
  }, 1000);
}

function renderIntroScreen() {
  game.screen = "intro";
  saveGame();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


                       _   _       _   _ _   _          _ 
                      | | | |_ __ | |_(_) |_| | ___  __| |
                      | | | | '_ \| __| | __| |/ _ \/ _' |
                      | |_| | | | | |_| | |_| |  __/ (_| |
                       \___/|_| |_|\__|_|\__|_|\___|\__,_|


                       
                       You wake beneath a wet green canopy.

                       The trees are too quiet.

                       In front of you sits a small oxidized copper can.
                       A few copper bits are scattered in the dirt nearby.

                       You do not know who left them.

                       You do not know why you want them.


                        
                              <span id="playButton" class="asciiRealButton">Begin</span>


`;

  document.getElementById("playButton").addEventListener("click", startNewGame);
}

function startNewGame() {
  game.screen = "game";
  game.currentView = "can";

  game.copperBits = 0;
  game.silverBits = 0;
  game.goldBits = 0;
  game.hasUnlockedSilverBits = false;
  game.hasUnlockedGoldBits = false;

  game.health = 10;
  game.maxHealth = 10;

  game.hasCopperCan = false;
  game.hasBentMagnet = false;
  game.hasInvestigatedMagnet = false;
  game.bentMagnetBitsPerSecond = 1;

  game.hasUnlockedCopperCan = false;
  game.hasUnlockedPack = false;
  game.hasUnlockedThoughts = false;
  game.hasUnlockedMap = false;
  game.hasUnlockedSave = false;
  game.hasUnlockedSettings = false;

  game.hasSeenTitleReveal = false;
  game.lastMessage = "";

  saveGame();
  startTimer();
  renderGameScreen();
}

function continueGame() {
  game.screen = "game";
  saveGame();
  startTimer();
  renderGameScreen();
}

function renderGameScreen() {
  renderTopBar();

  if (game.currentView === "map" && game.hasUnlockedMap) {
    renderMapView();
  } else if (game.currentView === "pack" && game.hasUnlockedPack) {
    renderPackView();
  } else if (game.currentView === "thoughts" && game.hasUnlockedThoughts) {
    renderThoughtsView();
  } else if (game.currentView === "save" && game.hasUnlockedSave) {
    renderSaveView();
  } else if (game.currentView === "settings" && game.hasUnlockedSettings) {
    renderSettingsView();
  } else {
    game.currentView = "can";
    renderCopperCanView();
  }

  attachTopBarListeners();
}

function renderTopBar() {
  if (game.screen !== "game") {
    statusBar.textContent = "";
    return;
  }

  let mapButton = game.hasUnlockedMap
    ? `<span id="mapTab" class="asciiButton">Map</span>`
    : `???`;

  let packButton = game.hasUnlockedPack
    ? `<span id="packTab" class="asciiButton">Pack</span>`
    : `???`;

  let thoughtsButton = game.hasUnlockedThoughts
    ? `<span id="thoughtsTab" class="asciiButton">Thoughts</span>`
    : `???`;

  let currencyText = `${game.copperBits}c`;

  if (game.hasUnlockedSilverBits) {
    currencyText += ` / ${game.silverBits}s`;
  }

  if (game.hasUnlockedGoldBits) {
    currencyText += ` / ${game.goldBits}g`;
  }

  let copperCanButton = game.hasUnlockedCopperCan
    ? `<span id="copperCanTab" class="asciiButton">Copper Can: ${currencyText}</span>`
    : `???`;

  let saveButton = game.hasUnlockedSave
    ? `<span id="saveTab" class="asciiButton">Save</span>`
    : `???`;

  let settingsButton = game.hasUnlockedSettings
    ? `<span id="settingsTab" class="asciiButton">⚙</span>`
    : `???`;

  statusBar.innerHTML = `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  ${mapButton}  │  ${packButton}  │  ${thoughtsButton}  │  ${copperCanButton}  │ ♥ ${game.health}/${game.maxHealth}  │  ${saveButton}  │ ${settingsButton} │
└────────────────────────────────────────────────────────────────────────────────────┘
`;
}

function attachTopBarListeners() {
  const mapTab = document.getElementById("mapTab");
  if (mapTab) {
    mapTab.addEventListener("click", () => switchView("map"));
  }

  const packTab = document.getElementById("packTab");
  if (packTab) {
    packTab.addEventListener("click", () => switchView("pack"));
  }

  const thoughtsTab = document.getElementById("thoughtsTab");
  if (thoughtsTab) {
    thoughtsTab.addEventListener("click", () => switchView("thoughts"));
  }

  const copperCanTab = document.getElementById("copperCanTab");
  if (copperCanTab) {
    copperCanTab.addEventListener("click", () => switchView("can"));
  }

  const saveTab = document.getElementById("saveTab");
  if (saveTab) {
    saveTab.addEventListener("click", () => switchView("save"));
  }

  const settingsTab = document.getElementById("settingsTab");
  if (settingsTab) {
    settingsTab.addEventListener("click", () => switchView("settings"));
  }
}

function switchView(viewName) {
  game.currentView = viewName;
  saveGame();
  renderGameScreen();
}

function renderCopperCanView() {
  let canLines = [];

  canLines.push(formatBoxLine(`Copper bits: ${game.copperBits}`, 42));

  if (game.hasUnlockedSilverBits) {
    canLines.push(formatBoxLine(`Silver bits: ${game.silverBits}`, 42));
  }

  if (game.hasUnlockedGoldBits) {
    canLines.push(formatBoxLine(`Gold bits: ${game.goldBits}`, 42));
  }

  canLines.push(formatBoxLine("", 42));
  canLines.push(
    formatBoxLine(
      game.hasBentMagnet
        ? `Collecting rate: +${game.bentMagnetBitsPerSecond}/second`
        : "Collecting rate: none",
      42
    )
  );

  let content = `
┌──────────────────────────────────────────────┐
│                Copper Can                    │
├──────────────────────────────────────────────┤
│                                              │
${canLines.join("\n")}
│                                              │
└──────────────────────────────────────────────┘


    <span id="gatherBitButton" class="asciiRealButton">Pick up a copper bit</span>

`;

  if (!game.hasUnlockedThoughts) {
    content += `
    <span id="selfAwareButton" class="asciiRealButton">Become self aware</span>

`;
  }

  if (game.copperBits >= 3) {
    content += `
    <span id="throwBitsButton" class="asciiRealButton">Throw a few back on the ground</span>

`;
  }

  if (
    game.copperBits >= BENT_MAGNET_COST &&
    !game.hasBentMagnet &&
    !game.hasInvestigatedMagnet
  ) {
    content += `
┌──────────────────────────────────────────────┐
│                SOMETHING ODD                 │
├──────────────────────────────────────────────┤
│  Something is poking out of the ground.      │
│                                              │
│  It is bent.                                 │
│  It is rusty.                                │
│  It might be looking at you.                 │
└──────────────────────────────────────────────┘

    <span id="investigateMagnetButton" class="asciiRealButton">See something poking out of the ground. Investigate?</span>

`;
  }

  if (
    game.copperBits >= BENT_MAGNET_COST &&
    !game.hasBentMagnet &&
    game.hasInvestigatedMagnet
  ) {
    content += `
┌──────────────────────────────────────────────┐
│                  NEW ITEM                    │
├──────────────────────────────────────────────┤
│  You uncover a bent magnet.                  │
│  It's weak, rusty, and slightly rude.        │
│  To win the magnet over you have to pay.     │
│                                              │
│  Cost: 20 copper bits                        │
└──────────────────────────────────────────────┘

    <span id="buyBentMagnetButton" class="asciiRealButton">Buy a bent magnet</span>

`;
  }

  if (game.hasBentMagnet && !game.hasUnlockedMap && game.copperBits >= MAP_UNLOCK_AMOUNT) {
    content += `
┌──────────────────────────────────────────────┐
│                SOMETHING MOVES               │
├──────────────────────────────────────────────┤
│  The bent magnet turns in your hand.         │
│                                              │
│  It points past the copper can, toward a     │
│  darker patch of trees.                      │
└──────────────────────────────────────────────┘

    <span id="unlockMapButton" class="asciiRealButton">Look toward the trees</span>

`;
  }

  if (game.lastMessage !== "") {
    content += `
┌──────────────────────────────────────────────┐
│                  MESSAGE                     │
├──────────────────────────────────────────────┤
│  ${game.lastMessage.padEnd(42, " ")}  │
└──────────────────────────────────────────────┘

`;
  }

  mainContent.innerHTML = content;

  const gatherBitButton = document.getElementById("gatherBitButton");
  if (gatherBitButton) {
    gatherBitButton.addEventListener("click", gatherCopperBit);
  }

  const selfAwareButton = document.getElementById("selfAwareButton");
  if (selfAwareButton) {
    selfAwareButton.addEventListener("click", becomeSelfAware);
  }

  const throwBitsButton = document.getElementById("throwBitsButton");
  if (throwBitsButton) {
    throwBitsButton.addEventListener("click", throwBitsOnGround);
  }

  const investigateMagnetButton = document.getElementById("investigateMagnetButton");
  if (investigateMagnetButton) {
    investigateMagnetButton.addEventListener("click", investigateMagnet);
  }

  const buyBentMagnetButton = document.getElementById("buyBentMagnetButton");
  if (buyBentMagnetButton) {
    buyBentMagnetButton.addEventListener("click", buyBentMagnet);
  }

  const unlockMapButton = document.getElementById("unlockMapButton");
  if (unlockMapButton) {
    unlockMapButton.addEventListener("click", unlockMap);
  }
}

function renderMapView() {
  mainContent.innerHTML = `
┌──────────────────────────────────────────────┐
│                     MAP                      │
├──────────────────────────────────────────────┤
│                                              │
│                  Dark Trees                  │
│                      ▲                       │
│                      │                       │
│                  [ Path ]                    │
│                      │                       │
│                      ▼                       │
│                [Copper Can]                  │
│                                              │
├──────────────────────────────────────────────┤
│  The forest is larger than it seemed.        │
│  The magnet still pulls toward the trees.    │
└──────────────────────────────────────────────┘


    <span id="visitCopperCanButton" class="asciiRealButton">Visit the copper can</span>
    <span id="visitDarkTreesButton" class="asciiRealButton">Step toward the dark trees</span>

`;

  document.getElementById("visitCopperCanButton").addEventListener("click", () => {
    game.lastMessage = "You return to the copper can.";
    switchView("can");
  });

  document.getElementById("visitDarkTreesButton").addEventListener("click", () => {
    game.lastMessage = "The dark trees do not move, but they notice you.";
    saveGame();
    renderMapView();
  });
}

function renderPackView() {
  let magnetText = game.hasBentMagnet
    ? "Bent magnet"
    : "Nothing useful yet";

  mainContent.innerHTML = `
┌──────────────────────────────────────────────┐
│                    PACK                      │
├──────────────────────────────────────────────┤
│  Copper can                                  │
│  ${magnetText.padEnd(42, " ")}  │
│                                              │
├──────────────────────────────────────────────┤
│  The pack is where found things gather.      │
│  Some of them may be useful.                 │
└──────────────────────────────────────────────┘


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

function formatBoxLine(text, width) {
  return `│  ${String(text).padEnd(width, " ")}  │`;
}

function wrapText(text, width) {
  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > width) {
      lines.push(currentLine.trimEnd());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.trim() !== "") {
    lines.push(currentLine.trimEnd());
  }

  return lines;
}

function renderThoughtsView() {
  let thoughts = [];

  thoughts.push("You are awake.");
  thoughts.push("There is a copper can in the forest.");

  if (game.hasUnlockedCopperCan) {
    thoughts.push("Copper bits matter. Probably.");
  }

  if (game.copperBits >= 3) {
    thoughts.push("Throwing bits away is possible. That feels important.");
  }

  if (game.hasInvestigatedMagnet) {
    thoughts.push("Something was buried near the can.");
  }

  if (game.hasBentMagnet) {
    thoughts.push("The bent magnet pulls bits toward you.");
  }

  if (game.hasUnlockedMap) {
    thoughts.push("The forest has places. Places mean choices.");
  }

  let thoughtLines = thoughts
    .flatMap((thought, index) => {
      const prefix = `${index + 1}. `;
      const indent = " ".repeat(prefix.length);

      const wrappedLines = wrapText(thought, 54 - prefix.length);

      return wrappedLines.map((line, lineIndex) => {
        if (lineIndex === 0) {
          return formatBoxLine(prefix + line, 54);
        }

        return formatBoxLine(indent + line, 54);
      });
    })
    .join("\n");

  mainContent.innerHTML = `
┌──────────────────────────────────────────────────────────┐
│                         THOUGHTS                         │
├──────────────────────────────────────────────────────────┤
${thoughtLines}
└──────────────────────────────────────────────────────────┘


    <span id="returnToCanButton" class="asciiRealButton">Return to the copper can</span>

`;

  document.getElementById("returnToCanButton").addEventListener("click", () => {
    switchView("can");
  });
}

function renderSaveView() {
  mainContent.innerHTML = `
┌──────────────────────────────────────────────┐
│                    SAVE                      │
├──────────────────────────────────────────────┤
│  The forest remembers you automatically.     │
│                                              │
│  Your progress is stored in localStorage.    │
│  You can also press the button below to save │
│  manually.                                   │
└──────────────────────────────────────────────┘


    <span id="manualSaveButton" class="asciiRealButton">Save now</span>

`;

  document.getElementById("manualSaveButton").addEventListener("click", () => {
    game.lastMessage = "Saved.";
    saveGame();
    renderSaveView();
  });
}

function renderSettingsView() {
  mainContent.innerHTML = `
┌──────────────────────────────────────────────┐
│                  SETTINGS                    │
├──────────────────────────────────────────────┤
│  There are not many settings yet.            │
│                                              │
│  Resetting will erase your saved prototype   │
│  progress and return to the Untitled screen. │
└──────────────────────────────────────────────┘


    <span id="resetButton" class="asciiRealButton">Reset prototype</span>

`;

  document.getElementById("resetButton").addEventListener("click", resetPrototype);
}

function gatherCopperBit() {
  game.copperBits += 1;
  game.hasCopperCan = true;

  unlockBasicsAfterFirstBit();

  game.lastMessage = "You pick up a copper bit.";

  checkForTitleReveal();
  saveGame();
  renderGameScreen();
}

function unlockBasicsAfterFirstBit() {
  if (game.copperBits >= 1) {
    game.hasUnlockedCopperCan = true;
    game.hasUnlockedSave = true;
    game.hasUnlockedSettings = true;
  }
}

function becomeSelfAware() {
  game.hasUnlockedThoughts = true;
  game.currentView = "thoughts";
  game.lastMessage = "A thought arrives.";
  saveGame();
  renderGameScreen();
}

function throwBitsOnGround() {
  if (game.copperBits < 3) return;

  game.copperBits -= 3;
  game.lastMessage = "You throw three copper bits onto the ground.";

  saveGame();
  renderGameScreen();
}

function investigateMagnet() {
  game.hasInvestigatedMagnet = true;
  game.lastMessage = "You uncover something magnetic and unpleasant.";

  saveGame();
  renderGameScreen();
}

function buyBentMagnet() {
  if (game.copperBits < BENT_MAGNET_COST) return;
  if (game.hasBentMagnet) return;

  game.copperBits -= BENT_MAGNET_COST;
  game.hasBentMagnet = true;
  game.hasUnlockedPack = true;
  game.currentView = "pack";
  game.lastMessage = "The bent magnet has joined your pack.";

  checkForTitleReveal();
  saveGame();
  renderGameScreen();
}

function unlockMap() {
  game.hasUnlockedMap = true;
  game.currentView = "map";
  game.lastMessage = "You found the shape of the forest.";

  checkForTitleReveal();
  saveGame();

  if (!game.hasSeenTitleReveal) {
    renderTitleRevealScreen();
  } else {
    renderGameScreen();
  }
}

function checkForTitleReveal() {
  if (
    game.hasUnlockedPack &&
    game.hasUnlockedMap &&
    game.hasUnlockedThoughts &&
    !game.hasSeenTitleReveal
  ) {
    game.screen = "titleReveal";
  }
}

function renderTitleRevealScreen() {
  game.screen = "titleReveal";
  game.hasSeenTitleReveal = true;
  saveGame();

  statusBar.textContent = "";

  mainContent.innerHTML = String.raw`


                         ____  _ _         ____            
                        | __ )(_) |_ ___  | __ )  _____  __
                        |  _ \| | __/ __| |  _ \ / _ \ \/ /
                        | |_) | | |_\__ \ | |_) | (_) >  < 
                        |____/|_|\__|___/ |____/ \___/_/\_\


                         The can, the magnet, the map...

                         They were not separate things.

                         They were the beginning of something.


                         BITS BOX


                                      <span id="continueButton" class="asciiRealButton">Continue</span>


`;

  document.getElementById("continueButton").addEventListener("click", () => {
    game.screen = "game";
    game.currentView = "can";
    saveGame();
    renderGameScreen();
  });
}

function resetPrototype() {
  localStorage.removeItem(SAVE_KEY);

  game.screen = "intro";
  game.currentView = "can";

  game.copperBits = 0;
  game.silverBits = 0;
  game.goldBits = 0;
  game.hasUnlockedSilverBits = false;
  game.hasUnlockedGoldBits = false;

  game.health = 10;
  game.maxHealth = 10;

  game.hasCopperCan = false;
  game.hasBentMagnet = false;
  game.hasInvestigatedMagnet = false;
  game.bentMagnetBitsPerSecond = 1;

  game.hasUnlockedCopperCan = false;
  game.hasUnlockedPack = false;
  game.hasUnlockedThoughts = false;
  game.hasUnlockedMap = false;
  game.hasUnlockedSave = false;
  game.hasUnlockedSettings = false;

  game.hasSeenTitleReveal = false;
  game.lastMessage = "";

  renderIntroScreen();
}

function boot() {
  loadGame();

  if (game.screen === "game") {
    continueGame();
  } else if (game.screen === "titleReveal" && !game.hasSeenTitleReveal) {
    renderTitleRevealScreen();
  } else {
    renderIntroScreen();
  }
}

boot();