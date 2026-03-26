// Bushes
export {
  ANCHORS as BUSH_ANCHORS,
  BIOME_PALETTES as BUSH_BIOME_PALETTES,
  BUSHES,
  createBush,
  getBushPalette,
} from './bushes'
export { PALETTE } from './palette'

export type { PaletteColor } from './palette'
// Trees
export {
  BIOME_LEAF_PALETTES,
  createProceduralTree,
  getTreePalette,
  LEAF_SLOT_START,
  TREE_1,
  TREE_2,
  TREE_3, TREE_4, TREE_5, ANCHORS as TREE_ANCHORS, DEFAULT_PALETTE as TREE_DEFAULT_PALETTE,
  FRAME_SIZE as TREE_FRAME_SIZE,
  SLOT_ROLES as TREE_SLOT_ROLES,
  TREES,
} from './trees'

export type { BiomeType } from './trees'
// Units
export {
  banana,
  burger,
  catchy,
  claw,
  createUnitFrames, gentleman, getUnitData, marshmallow, pioneer,
  pup, renderFrame, santa, shape, sharky,
  telegramo, twitchy, UNIT_CODENAMES, woody, wooly,
} from './units'

export type { UnitCodename } from './units'

// Wagon
export {
  createWagonBase1,
  createWagonBase2,
  createWagonChest,
  createWagonEngine,
  createWagonWheel,
  WAGON_DEFAULT_PALETTE,
} from './wagon'
