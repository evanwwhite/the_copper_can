# Bits Box Prototype

A tiny Candy Box 2-inspired browser game starter.

## What is included

- `index.html` — main page
- `css/design.css` — simple monospace / ASCII layout styling
- `js/game.js` — intro screen, Play button, bits counter, timed bit gain, unlock button, and save/reset logic

## How to run

Open `index.html` in a browser.

## Current tutorial flow

1. The player starts at a title screen.
2. Clicking **Play** opens a mostly blank page.
3. Copper bits accumulate automatically at 1 per second.
4. At 10 copper bits, a **Search the dust** button appears.
5. Clicking it unlocks **Pick up a copper bit**, a manual +1 button.

## Easy values to change

In `js/game.js`:

```js
const BIT_UNLOCK_AMOUNT = 10;
```

Change this to control when the first new button appears.

```js
game.copperBitsPerSecond = 1;
```

Change this to control passive copper-bit gain speed.
