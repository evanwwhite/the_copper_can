import { plains, plains2 } from "../asciiArtHelper.js";

// Registry of scenes the player can physically walk across. Each entry pairs a
// baked ASCII backdrop with the geometry the walk loop needs:
//   groundY - the row the TOP of the 3-line player sprite sits on.
//   minX/maxX - the walkable column bounds within the backdrop.
//   next - the sceneId to load when the player walks off the right edge
//          (respawning them on the left). null clamps the player at the edge.
// Add more scenes here and chain them with `next` to build a continuous walk.
// `next` may point back at an earlier scene to loop; WALK_SEGMENT_LIMIT caps how
// many scenes the player traverses before the walk stops advancing.
export const WALK_SCENES = {
  plains: {
    art: plains,
    groundY: 22,
    minX: 1,
    maxX: 94,
    next: "plains2",
  },
  plains2: {
    art: plains2,
    groundY: 22,
    minX: 1,
    maxX: 94,
    next: "plains", // loops back; the segment limit below stops the cycle
  },
};

// How many scenes the player walks through in one run. With the plains/plains2
// loop above, 4 = plains -> plains2 -> plains -> plains2, then it clamps at the
// final scene's right edge. Bump this to lengthen the walk.
export const WALK_SEGMENT_LIMIT = 4;

export function getWalkScene(sceneId) {
  return WALK_SCENES[sceneId] ?? WALK_SCENES.plains;
}
