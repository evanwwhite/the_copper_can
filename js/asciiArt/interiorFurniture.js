// Furniture and fittings for the enterable town buildings.
// Sprites are authored in the Candy Box style: compact, legible, low-detail.
// They are placed onto room canvases with placeSprite(), so leading/trailing
// blank lines are fine (getAsciiLines trims them) and spaces stay transparent.

// ---- RIVERSIDE INN ----

export const fireplace = String.raw`
 .-------------.
 | .---------. |
 | |   ( ) . | |
 | |. ( :  ) | |
 | | ) ( ) ( | |
 | |_\_/\_/_ | |
 '-------------'
`;

export const bed = String.raw`
 |
 |.--.__________
 ||  | ~^~~~~^~ |
 |'--' ~~~^~~~^ |
 |~~~~~~~~~~~~~~|
 ||            ||
`;

export const table = String.raw`
  ________________
 /________________\
  ||            ||
  ||            ||
`;

export const mug = String.raw`
  ______
 |~~~~~~|__
 |------|  |
 |~~~~~~|__|
 |______|
`;

export const barrel = String.raw`
  ._____.
 /=======\
 |=======|
 \=======/
  '-----'
`;

// ---- VILLAGE SHOP ----

export const shelf = String.raw`
  _________________
 | (o) (o) (o) (o) |
 |_________________|
 | [#] [#] [#] [#] |
 |_________________|
 | (~) (~) (~) (~) |
 |_________________|
`;

export const potions = String.raw`
 .--------------.
 |  Y  Y  Y  Y  |
 | (~)(~)(~)(~) |
 |--------------|
 |  Y  Y  Y  Y  |
 | (~)(~)(~)(~) |
 '--------------'
`;

export const counter = String.raw`
   _______________
  /               \
 /_________________\
 |  _____________  |
 | |  [O]   [O]  | |
 | |_____________| |
 |_________________|
`;

export const balance = String.raw`
    ,___I___,
    |   |   |
   _I_  |  _I_
  (___) | (___)
        |
       _I_
      |___|
`;

export const marketStall = String.raw`
 .~~~~~~~~~.
 |  WARES  |
 |_________|
  |  | |  |
  |__|_|__|
`;

// ---- BLACKSMITH ----

export const furnace = String.raw`
       |   |
       |   |
       |   |
       |   |
       |   |
       |   |
       |   |
       |   |
 .____/_____\____.
 | .-----------. |
 | | ) ( ) ( ) | |
 | |( ( )( ) ) | |
 | |__(___)__(_| |
 |_______________|
 |##|         |##|
`;

export const anvil = String.raw`
   ________
  /________\
 (__________)
    |    |
    |____|
   /______\
`;

export const weaponRack = String.raw`
 |-----------------|
 |  |   |   |   |  |
 |  |   |   |   |  |
 |  |   |   |   |  |
 | =+= =+= =+= =+= |
 |_[|__|]__[|__[|__|
`;

export const coalPile = String.raw`
      . o .
    o . O o .
   . O o . O o
  o . O . o O .
  '-----------'
`;

export const hammer = String.raw`
  _____
 |_____|
   | |
   | |
   |_|
`;

export const tongs = String.raw`
  |     |
   \___/
   |   |
   |   |
    \ /
`;

// ---- VILLAGE HALL ----

export const throne = String.raw`
   .|. .|. .|.
   | |_| |_| |
   |  ~~^~~  |
  _|   ___   |_
 |  |_(___)_|  |
 |  |_______|  |
 |_____________|
`;

export const banner = String.raw`
  __====__
 |~~^~~^~~|
 |   /\   |
 |  /  \  |
 |  \  /  |
 |   \/   |
 |        |
  \^~~^~~/
   \    /
    \  /
     \/
`;
