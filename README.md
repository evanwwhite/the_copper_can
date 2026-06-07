# The Copper Can Prototype

The Copper Can is a browser-based text adventure / incremental prototype built with plain HTML, CSS, and modular JavaScript. The presentation is intentionally minimal: the UI is rendered into `<pre>` blocks, ASCII art sets the tone, and player progression is driven by small state changes that unlock new views, choices, and story beats.

The current codebase is no longer a single-file prototype. The live game now runs from the modular files in `js/`, while `file_dump/` contains archive and reference copies from earlier or exported versions of the project.

## What the game currently does

The player begins on an intro screen, enters the forest, and starts collecting copper bits. From there the prototype unfolds in stages:

1. The intro screen leads into the main game view.
2. Picking up the first copper bit unlocks the visible Copper Can tab plus Save and Settings.
3. At 3 copper bits, the player can throw bits back on the ground.
4. At 10 copper bits, the player can refuse the can, ignore it, and eventually pay for "free will," which unlocks Thoughts.
5. At 20 copper bits, the buried bent magnet path becomes available.
6. Buying the bent magnet unlocks the Pack and starts passive copper-bit gain.
7. At 35 copper bits with the magnet, the Map unlocks.
8. Once Thoughts, Pack, and Map are all unlocked, the title reveal sequence can trigger.

Progress is saved in `localStorage` under the key `theCopperCanPrototypeSave`. Older `bitsBoxPrototypeSave` data is still loaded and migrated forward automatically.

## How it runs

Open `index.html` in a browser.

`index.html` loads `css/design.css` for styling and starts the app through:

```html
<script type="module" src="js/main.js"></script>
```

At boot, `js/main.js` loads saved state and decides which screen to render:

- Intro screen
- Title reveal screen
- Main game screen

## Project structure

```text
bits_intro_game/
├── index.html
├── README.md
├── css/
│   └── design.css
├── js/
│   ├── actions.js
│   ├── asciiArt.js
│   ├── data.js
│   ├── gameState.js
│   ├── helpers.js
│   ├── main.js
│   ├── render.js
│   └── saveSystem.js
└── backupFolder/
    ├── actions.js.txt
    ├── asciiArt.js.txt
    ├── data.js.txt
    ├── game.js
    ├── gameState.js.txt
    ├── game_v2.txt
    ├── helpers.js.txt
    ├── main.js.txt
    ├── render.js.txt
    └── saveSystem.js.txt
```

## Directory guide

### `index.html`

The shell page for the game. It defines the two main output areas:

- `#statusBar` for the top navigation / resource bar
- `#mainContent` for the active scene or menu content

### `css/`

- `design.css`: layout and visual rules for the ASCII-style interface, buttons, centered layout, and fixed version label

### `js/` (live source of truth)

This is the active application code.

- `main.js`: bootstraps the game, loads saves, and routes to the correct starting screen
- `gameState.js`: holds the shared mutable `game` object and DOM element references
- `data.js`: constants, item definitions, thoughts content, location data, and the save key
- `actions.js`: player actions and game-state mutations such as gathering bits, buying upgrades, unlocking views, saving, and resetting
- `render.js`: all screen rendering and event binding for intro, top bar, can, map, pack, thoughts, save, settings, and title reveal views
- `saveSystem.js`: serialization to and from `localStorage`
- `helpers.js`: text-wrapping and ASCII box-building utilities
- `asciiArt.js`: title art and map text assets

### `file_dump/` (archive / reference material)

This folder is not used by `index.html` at runtime.

It currently contains:

- `.txt` snapshots of the modular files in `js/`
- `game.js`, a legacy monolithic version of the prototype
- `game_v2.txt`, another large snapshot/reference copy

Treat `js/` as the code you should edit and `file_dump/` as historical or export material unless you intentionally want to compare versions.

## Architecture overview

The live game follows a simple loop:

1. `main.js` boots the app.
2. `saveSystem.js` restores persisted state.
3. `render.js` draws the current screen into the DOM.
4. Button clicks call functions in `actions.js`.
5. `actions.js` mutates `game` in `gameState.js`, saves when needed, and asks `render.js` to redraw.

That split is the main organizational improvement over the older single-file prototype in `file_dump/game.js`.

## Screen and feature map

### Intro

- Rendered by `renderIntroScreen()`
- Starts a fresh run through `startNewGame()`

### Main game / Copper Can

- Default gameplay view
- Shows currency, collection rate, story prompts, and unlock actions

### Pack

- Unlocks after buying the bent magnet
- Shows current carried items

### Thoughts

- Unlocks after buying free will
- Renders unlocked thought entries from `data.js`

### Map

- Unlocks after following the bent magnet progression
- Currently links between the Copper Can and Dark Trees

### Save

- Explains autosave and allows manual save

### Settings

- Currently used for resetting prototype progress

### Title reveal

- Special transition screen triggered after key systems are unlocked

## Important values to tweak

Most prototype tuning lives in `js/data.js`.

```js
export const BENT_MAGNET_COST = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SAVE_KEY = "theCopperCanPrototypeSave";
```

Useful gameplay behavior also depends on state defaults in `js/gameState.js` and reset/start values in `js/actions.js`.

## Working conventions for a more cohesive directory

If you want this repo to stay easy to grow, these conventions will help:

1. Treat `js/` as the only runtime source of truth.
2. Keep render logic in `render.js` and state mutations in `actions.js`.
3. Put new balancing constants and content definitions in `data.js`.
4. Put reusable formatting helpers in `helpers.js` instead of duplicating string-building logic.
5. Keep ASCII art and map text in `asciiArt.js` rather than embedding long art blocks across render functions.
6. Use `file_dump/` only for exports, snapshots, or legacy references, not active development.
7. If `file_dump/` is still needed, consider renaming it later to something clearer like `archive/` or `snapshots/`.

## Suggested next cleanup

The repo is already moving in a good direction, but the biggest source of confusion is the archive material living next to the active app. The simplest path to a more cohesive directory is:

1. Continue editing only files in `js/`, `css/`, and `index.html`.
2. Keep `README.md` aligned with the modular architecture, not the old single-file version.
3. Decide whether `file_dump/` is meant to be an archive, export folder, or backup folder, then rename or document it consistently.
4. Remove or relocate outdated references to `js/game.js`, since that file is no longer part of the live app.

## Current source of truth summary

If you are trying to understand or extend the game quickly, start here:

- Entry point: `js/main.js`
- State: `js/gameState.js`
- Game logic: `js/actions.js`
- Rendering: `js/render.js`
- Content and constants: `js/data.js`
- Persistence: `js/saveSystem.js`

That path will give you the clearest picture of how the prototype works today.
