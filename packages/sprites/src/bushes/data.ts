// Indexed pixel data for bushes — procedurally defined
// Format: [x, y, slotIndex] — same as trees and units
// Slots: 0=dark, 1=mid, 2=bright, 3=light, 4=pale, 5=accent1, 6=accent2

import { PALETTE } from '../palette'

export const SLOT_ROLES = [
  'dark',
  'mid',
  'bright',
  'light',
  'pale',
  'accent1',
  'accent2',
] as const

export const BIOME_PALETTES: Record<string, number[]> = {
  GREEN: [PALETTE.darkGreen, PALETTE.green1, PALETTE.green2, PALETTE.lightGreen, PALETTE.paleGreen, PALETTE.brightRed, PALETTE.yellow1],
  BLUE: [PALETTE.darkBlue, PALETTE.blue1, PALETTE.blue2, PALETTE.blue3, PALETTE.lightBlue, PALETTE.lightBlue, PALETTE.white],
  STONE: [PALETTE.darkGray, PALETTE.grayGreen1, PALETTE.grayGreen2, PALETTE.grayGreen3, PALETTE.grayGreen4, PALETTE.mauve, PALETTE.tan],
  TEAL: [PALETTE.darkTeal, PALETTE.teal1, PALETTE.teal2, PALETTE.teal3, PALETTE.paleTeal, PALETTE.teal3, PALETTE.paleTeal],
  TOXIC: [PALETTE.darkBrown, PALETTE.olive, PALETTE.yellowGreen, PALETTE.lime, PALETTE.paleYellow, PALETTE.lime, PALETTE.paleYellow],
  VIOLET: [PALETTE.darkViolet, PALETTE.violet1, PALETTE.violet2, PALETTE.violet3, PALETTE.paleViolet, PALETTE.pink2, PALETTE.paleViolet],
}

export function getBushPalette(biome: string): number[] {
  return BIOME_PALETTES[biome] ?? BIOME_PALETTES.GREEN!
}

// Slots: 0=dark, 1=mid, 2=bright, 3=light, 4=pale, 5=accent1, 6=accent2

// Bush 1: Mushroom patch
export const BUSH_1: [number, number, number][] = [
  [1, 0, 2], [2, 0, 2], [3, 0, 2],
  [0, 1, 3], [1, 1, 3], [2, 1, 3], [3, 1, 3], [4, 1, 3],
  [2, 2, 4], [2, 3, 4],
  [5, 1, 2], [6, 1, 2],
  [4, 2, 3], [5, 2, 3], [6, 2, 3], [7, 2, 3],
  [6, 3, 4],
  [0, 3, 1], [1, 3, 1], [2, 3, 1],
  [3, 3, 0], [4, 3, 0],
  [7, 3, 1],
]

// Bush 2: Wide flat bush
export const BUSH_2: [number, number, number][] = [
  [3, 0, 0], [4, 0, 0], [5, 0, 0], [6, 0, 0],
  [1, 1, 1], [2, 1, 2], [3, 1, 2], [4, 1, 2], [5, 1, 1], [6, 1, 1], [7, 1, 1], [8, 1, 1],
  [0, 2, 2], [1, 2, 2], [2, 2, 3], [3, 2, 2], [4, 2, 3], [5, 2, 3], [6, 2, 3], [7, 2, 2], [8, 2, 2], [9, 2, 2],
  [0, 3, 1], [1, 3, 1], [2, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 1], [6, 3, 2], [7, 3, 2], [8, 3, 1], [9, 3, 1],
  [1, 4, 0], [2, 4, 0], [3, 4, 0], [4, 4, 0], [5, 4, 0], [6, 4, 0], [7, 4, 0], [8, 4, 0],
]

// Bush 3: Bush with berries/accents
export const BUSH_3: [number, number, number][] = [
  [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0],
  [1, 1, 1], [2, 1, 3], [3, 1, 3], [4, 1, 1], [5, 1, 5], [6, 1, 1],
  [0, 2, 2], [1, 2, 2], [2, 2, 5], [3, 2, 3], [4, 2, 3], [5, 2, 2], [6, 2, 2], [7, 2, 2],
  [0, 3, 1], [1, 3, 1], [2, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 1], [6, 3, 6], [7, 3, 1],
  [1, 4, 0], [2, 4, 0], [3, 4, 0], [4, 4, 0], [5, 4, 0], [6, 4, 0],
]

// Bush 4: Tall grass tuft
export const BUSH_4: [number, number, number][] = [
  [1, 0, 2], [3, 0, 3], [5, 0, 2],
  [0, 1, 1], [2, 1, 3], [4, 1, 2], [6, 1, 1],
  [0, 2, 1], [1, 2, 3], [2, 2, 1], [3, 2, 4], [4, 2, 1], [5, 2, 3], [6, 2, 1],
  [1, 3, 0], [2, 3, 0], [3, 3, 0], [4, 3, 0], [5, 3, 0],
]

// Bush 5: Flower patch
export const BUSH_5: [number, number, number][] = [
  [1, 0, 6], [4, 0, 5],
  [0, 1, 1], [1, 1, 1], [2, 1, 6], [3, 1, 1], [4, 1, 1], [5, 1, 5],
  [0, 2, 2], [1, 2, 3], [2, 2, 2], [3, 2, 3], [4, 2, 2], [5, 2, 2],
  [1, 3, 0], [2, 3, 0], [3, 3, 0], [4, 3, 0],
]

export const BUSHES = [BUSH_1, BUSH_2, BUSH_3, BUSH_4, BUSH_5]

export const ANCHORS: [number, number][] = [
  [3, 4],
  [5, 4],
  [4, 4],
  [3, 3],
  [3, 3],
]
