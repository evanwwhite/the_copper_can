# The Copper Can Prototype

The Copper Can is a browser-based text adventure / incremental prototype built with plain HTML, CSS, and modular JavaScript. The interface is rendered as ASCII-style screens in `<pre>` blocks, with progress driven by small state changes that unlock views, items, routes, and story beats.

The live game runs from `index.html -> js/main.js -> js/*`. `backupFolder/` is archival reference material and is not loaded at runtime.

## What The Game Currently Does

The player wakes in the forest, finds copper bits, and slowly opens up a stranger little world:

1. The intro screen starts a fresh run.
2. Picking up the first copper bit unlocks the Copper Can tab, Save, and Settings.
3. At 3 copper bits, the player can throw bits back on the ground.
4. At 10 copper bits, the player can refuse the can, ignore it, and buy free will, which unlocks Thoughts.
5. Investigating the buried magnet path and buying the bent magnet unlocks the Pack and starts passive copper-bit gain.
6. The wooded path leads to town, including Village Hall, the shop, inn, and blacksmith.
7. Village Hall can send the player across the river into the dark forest.
8. Defeating the Rusty Iron Sign / tree watcher marks the village as liberated.
9. Returning to Village Hall after the fight unlocks new thank-you dialogue.
10. The villager gives the player a map as a reward.
11. The map appears in the Pack, unlocks the Map tab in the top bar, and enables map-based travel.
12. Once Pack, Thoughts, and the wooded path are unlocked, the title reveal sequence can trigger.

Progress is saved in `localStorage` under `theCopperCanPrototypeSave`. Older `bitsBoxPrototypeSave` data is still loaded and migrated forward automatically.

## How To Run

Open `index.html` through a local web server so ES modules load correctly. For example:

```sh
python3 -m http.server
```

Then visit the printed local URL in a browser.

`index.html` loads:

```html
<script type="module" src="js/main.js"></script>
```

## Project Structure

```text
bits_intro_game/
├── index.html
├── README.md
├── css/
│   └── design.css
├── js/
│   ├── actions.js
│   ├── asciiArtHelper.js
│   ├── asciiArt/
│   │   ├── combatSprites.js
│   │   ├── composition.js
│   │   ├── forestScenes.js
│   │   ├── inventory.js
│   │   ├── map.js
│   │   ├── nature.js
│   │   ├── thoughts.js
│   │   ├── titles.js
│   │   ├── townAssets.js
│   │   └── townScene.js
│   ├── data.js
│   ├── gameState.js
│   ├── helpers.js
│   ├── main.js
│   ├── sceneCombatCore.js
│   ├── sceneCombatData.js
│   ├── render/
│   │   ├── ascii.js
│   │   ├── combatView.js
│   │   ├── copperCanView.js
│   │   ├── darkForestScreen.js
│   │   ├── dom.js
│   │   ├── gameScreen.js
│   │   ├── introScreens.js
│   │   ├── secondaryViews.js
│   │   ├── topBar.js
│   │   ├── townScreens.js
│   │   └── worldScreens.js
│   ├── renderHelper.js
│   └── saveSystem.js
└── backupFolder/
    └── archived snapshots and legacy versions
```

## Directory Guide

### `index.html`

The shell page for the game. It defines:

- `#statusBar` for the top navigation / resource bar
- `#mainContent` for the active scene or menu content

### `css/`

- `design.css`: layout, ASCII button styling, centered content, hover labels, and screen presentation

### `js/`

The active application code.

- `main.js`: boots the game, loads saves, and routes to the correct starting screen
- `gameState.js`: defines grouped state defaults, including the unified walk/scene-combat state
- `sceneCombatCore.js`: headless scene tick for movement, attacks, enemy state machines, projectiles, blocking, parries, and rewards
- `sceneCombatData.js`: reusable weapon styles, enemy types, and scene-combat tuning
- `data.js`: gameplay constants, thought entries, and combat enemy data
- `actions.js`: player actions, state mutations, combat flow, route changes, reward handling, saving, and resetting
- `renderHelper.js`: barrel export for the render modules
- `render/`: focused render modules for the top bar, game view, world screens, town screens, combat, pack/thoughts/save/settings, intro/title screens, and shared DOM/ASCII helpers
- `asciiArtHelper.js`: barrel export for ASCII assets
- `asciiArt/`: focused ASCII modules for titles, inventory items, map art/data, thoughts screen layout, forest scenes, town scenes, nature sprites, combat sprites, and composition helpers
- `saveSystem.js`: grouped save serialization, hydration, and legacy save migration
- `helpers.js`: text wrapping, centering, and ASCII box helpers

### `backupFolder/`

Archive/reference material only. It is not part of the live runtime path.

## Architecture Overview

The live game loop is:

1. `main.js` boots the app.
2. `saveSystem.js` restores persisted state.
3. `renderHelper.js` exposes the appropriate render function from `js/render/`.
4. Rendered buttons call functions in `actions.js`.
5. `actions.js` mutates `game`, saves when needed, and triggers a redraw.

State is grouped in `gameState.js`:

- `world`: current screen/view and title reveal routing
- `currencies`: copper/silver/gold counts
- `player`: health
- `inventory`: carried items such as the copper can, bent magnet, and map
- `unlocks`: visible tabs and systems
- `flags`: story and one-time progression state
- `walk`: the active scene, player position/input, enemy instances, projectiles, combat resources, and defeated spawn IDs
- `combat`: legacy arena state retained so older saves can still hydrate safely

## Current Feature Map

### Copper Can

The default main view. It shows current copper, collection rate, story prompts, and unlock actions.

### Pack

Unlocked by buying the bent magnet. The pack uses `inventoryScreenMassive` and overlays item art for the copper can, bent magnet, and map.

### Thoughts

Unlocked by buying free will. The thoughts tab now uses a wide ASCII panel styled like the Pack screen. Unlocked thoughts display in reverse stack order, so the newest/highest numbered thought appears first, like `8`, then `7`, down to `1`.

### Map

The Map tab is no longer a simple early unlock. It becomes available when the villager rewards the player with the map after the Rusty Iron Sign / tree watcher is defeated.

The map screen shows the known route and provides travel buttons for:

- Copper Can
- Wooded Path
- Village
- Dark Forest, once the challenge is accepted

After the watcher is defeated, the map marks the sign as defeated and removes the repeat fight option.

### Town And Village Hall

The town screen has enterable hover regions for Village Hall, Riverside Inn, Village Shop, and Blacksmith. After the Village Hall challenge is accepted, the Dark Forest region becomes available.

Village Hall dialogue changes by progression state:

- Before accepting the challenge: asks the player to face the threat.
- After accepting but before victory: reminds the player the forest still waits.
- After defeating the watcher: thanks the player for liberating the village and offers the map.
- After receiving the map: remains thankful and points the player back to the map.

### Dark Forest And Combat

The dark forest watcher now enters the same walkable scene system used by the plains. The player moves left/right, changes weapon or stance during the encounter, attacks explicitly, and reads each enemy's `[!]` telegraph before blocking or parrying. Enemies approach, lunge forward, return, and recover in place. Once the watcher is defeated, the dark forest revisits as quiet and no longer offers the fight.

### Save

Explains autosave and allows manual saving.

### Settings

Currently used for resetting prototype progress.

### Title Reveal

A special transition screen triggered after the key early systems are active.

## Important Values To Tweak

World/progression tuning lives in `js/data.js`; scene-combat tuning lives in `js/sceneCombatData.js`. Enemy placement is authored in `js/render/walkScenes.js` with stable IDs, enemy types, horizontal coordinates, and optional render lanes.

```js
export const BENT_MAGNET_COST = 15;
export const BEEHIVE_UNLOCK_AMOUNT = 20;
export const MAP_UNLOCK_AMOUNT = 35;
export const FREE_WILL_COST = 10;
export const SAVE_KEY = "theCopperCanPrototypeSave";
export const SCENE_TICK_MS = 90;
export const SCENE_WEAPONS = { /* damage, range, recovery, shield, knockback */ };
export const SCENE_ENEMY_TYPES = { /* speed, health, defense, attack, matchups */ };
```

Note: `MAP_UNLOCK_AMOUNT` still exists as a tuning constant, but the current visible Map tab is awarded through the Village Hall reward flow.

## Verification

The current module graph can be checked with Bun:

```sh
bun build js/main.js --outdir /private/tmp/bits_intro_game_check
```

This is useful after refactors because it catches missing exports/imports across the split render and ASCII modules.

## Working Conventions

1. Treat `js/`, `css/`, `index.html`, and `README.md` as the live project surface.
2. Leave `backupFolder/` alone unless you intentionally want to update archival snapshots.
3. Keep state mutations and progression rules in `actions.js`.
4. Keep screen drawing and event binding in `js/render/`.
5. Keep shared render exports in `renderHelper.js`.
6. Keep ASCII assets in `js/asciiArt/` and re-export public assets through `js/asciiArtHelper.js`.
7. Use `makePreformattedBox()` for spacing-sensitive diagrams such as maps.
8. Use grouped state helpers in `gameState.js` and `saveSystem.js` for defaults, saves, and legacy migration.

## Current Source Of Truth

Start here when extending the prototype:

- Entry point: `js/main.js`
- State defaults: `js/gameState.js`
- Game logic: `js/actions.js`
- Render exports: `js/renderHelper.js`
- Render modules: `js/render/`
- ASCII asset exports: `js/asciiArtHelper.js`
- ASCII modules: `js/asciiArt/`
- Content and constants: `js/data.js`
- Persistence: `js/saveSystem.js`
