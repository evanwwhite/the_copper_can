export const MAP_NODE_INNER_WIDTH = 30;

export function buildMapScreenModel({
  hasReachedTown = false,
  hasAcceptedDarkForestChallenge = false,
  hasDefeatedDarkTreeWatcher = false,
  hasUnlockedWorldMap = false,
} = {}) {
  const darkForestLabel = hasDefeatedDarkTreeWatcher
    ? "Dark Forest - quiet now"
    : "Dark Forest";
  const foxLabel = hasDefeatedDarkTreeWatcher
    ? "The Fox - defeated"
    : "The Fox";
  const townLabel = hasReachedTown ? "Village Hall" : "Village Hall - unknown";
  const darkForestConnector = hasAcceptedDarkForestChallenge ? "|" : "?";
  const townConnector = hasReachedTown ? "v" : "?";

  // Top to bottom. Each connectorAbove draws the link to the node above it.
  const nodes = [
    {
      id: "fox",
      label: foxLabel,
      action: "fightDarkTrees",
      enabled: !hasDefeatedDarkTreeWatcher,
    },
    {
      id: "darkForest",
      label: darkForestLabel,
      action: "enterDarkForest",
      enabled: hasAcceptedDarkForestChallenge,
      connectorAbove: ["^", darkForestConnector],
    },
    {
      id: "villageHall",
      label: townLabel,
      action: "travelToVillage",
      enabled: true,
      connectorAbove: ["|", townConnector],
    },
    {
      id: "woodedPath",
      label: "Wooded Path",
      action: "travelToWoodedPath",
      enabled: true,
      connectorAbove: ["^", "|"],
    },
    {
      id: "copperCan",
      label: "Copper Can",
      action: "visitCopperCan",
      enabled: true,
      connectorAbove: ["|", "v"],
    },
  ];

  if (hasUnlockedWorldMap) {
    nodes.unshift({
      id: "worldMap",
      label: "The World Beyond  >",
      action: "viewWorldMap",
      enabled: true,
    });
    nodes[1].connectorAbove = ["^", "|"];
  }

  const descriptionLines = [
    hasDefeatedDarkTreeWatcher
      ? "The village road is open and the trees no longer lean in."
      : "The map marks the road, the village, and the thing beyond it.",
    "Choose a place and the route folds itself under your feet.",
  ];

  return { nodes, descriptionLines, nodeInnerWidth: MAP_NODE_INNER_WIDTH };
}

// ---- WORLD MAP ----
// Large island, blank interior — a single cohesive landmass meant to be
// overlaid with the world later. Smooth coastline generated from a low-
// frequency radius profile (rounded top/bottom, one soft bay, two offshore
// islets) over a tidy staggered ~ wave field. Art is original.

export const islandWave = [
"   ___   ___   ___ ",
" /' /' /' /' /' /' ",
"-'  `--'  `--'  `- ",
];

export const islandWorld = [
  "                                                                                                    ",
  "                                             ,...,'`_          ,________.                           ",
  "            ,'''--..                 ,....--'       '`..    ,,''        '--.                        ",
  " ~~~~~~    `o_    '\\       ,,o--..-''                 `...-'              '-.      ____.            ",
  "              /     `.___,.-'                                                '-----''   '` _        ",
  "     ____,,__/'                                                                            `\\      ",
  "  ,/''                                                                                      `.      ",
  "  |.                                                                                         |      ",
  "   `.                                                                                       /'      ",
  "    `-.                                                                                   ,/'       ",
  "      ``-._____.                                                                          '-.       ",
  "               '`\\.                                                                          `.    ",
  " ~~~~~~          'o                                                                          \\    ",
  "                    |                                                                         'L    ",
  "                    |                                                                          '\\  ",
  "     |'|            |                                                                           |.  ",
  "     `.`\\__       _/'                                                                            | ",
  "      '\\. ''\"-'''''                                                                              |",
  "       '\\                                                       ,---,_.                    _     | ",
  "        /                                                      /  ~~   \\                  |''\\_ |'",
  "       /'                                                     (    ~~~ )                   |.  '`'    ",
  "      ,'                                                       \\~~    /                   `\\      ",
  "      |                                                         `.-'--'                      `.     ",
  "      '\\. __                                                                                   `.  ",
  "        '''''-__                                                                               .|   ",
  "              '`.                                     __,.....                                ,'    ",
  "               _.                                   .-''     '-.                            ,'      ",
  "             ,/'                                    |           \\                           |      ",
  "             |                                      \\           '.                          '\\    ",
  "              |                             ,,---...`.           \\.                          `.    ",
  "              \\                             /       ''            \\.                          |   ",
  "               `\\_                          |                     '\\          __,-----._      |   ",
  "                 '''`---..o------..         \\                      '`.     _Y''        '\\     |   ",
  "                                  `._____   '`.._       ,-''''-..    '-----'            '\\....'    ",
  "                                        '\",_    '`\\    /        '                                 ",
  "                                           '`..__,'    /         |                                  ",
  "                                                       |         '-..._     .                       ",
  "                                                       \\_              '\\  ( )                    ",
  "                                                  ,-.   '-....-''`-.    '|  '                       ",
  "                                                 (   )             '\\.__/'                         ",
  "                                                  `-'                                               ",
  "  +----------------+                                                                                ",
  "  |Copper Can World|                                                                                ",
  "  +----------------+                                                                                ",
  "                                                                                                    ",
  "                                                                                                    ",
  "",
].join("\n");

/*THE BACKUP JUST IN CASE:
                                            ,...,'`_          ,________.                            
           ,'''--..                 ,....--'       '`..    ,,''        '--.                         
           `o_    '\       ,,o--..-''                 `...-'              '-.      ____.            
             /     `.___,.-'                                                '-----''   '` _         
    ________/'                                                                            `\        
 ,/''                                                                                      `.       
 |.                                                                                         |       
  `.                                                                                       /'       
   `-.                                                                                   ,/'        
     ``-._____.                                                                          '-.        
              '`\.                                                                          `.      
                 'o                                                                          \      
                   |                                                                         'L     
                   |                                                                          '\    
    |'|            |                                                                           |.   
    `.`\__       _/'                                                                            |   
     '\. ''"-'''''                                                                              |   
      '\                                                       ,---,_.                    _     |   
       /                                                      /       \                  |''\_ |'   
      /'                                                     (         )                 |.  '`'    
     ,'                                                       \       /                   `\        
     |                                                         `.-'--'                      `.      
     '\. __                                                                                   `.    
       '''''-__                                                                               .|    
             '`.                                     __,.....                                ,'     
              _.                                   .-''     '-.                            ,'       
            ,/'                                    |           \                           |        
            |                                      \           '.                          '\       
             |                             ,,---...`.           \.                          `.      
             \                             /       ''            \.                          |      
              `\_                          |                     '\          __,-----._      |      
                '''`---..o------..         \                      '`.     _Y''        '\     |      
                                 `._____   '`.._       ,-''''-..    '-----'            '\....'      
                                       '",_    '`\    ./        '                                   
                                          '`..__,'    /         |                                   
                                                      |         '-..._     .                        
                                                      \_              '\  ( )                       
                                                 ,-.   '-....-''`-.    '|  '                        
                                                (   )             '\.__/'                           
                                                 `-'                                                
 +----------------+                                                                                 
 |Copper Can World|                                                                                 
 +----------------+                                                                                 
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                     */