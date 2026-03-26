/**
 * Resurrect 64 palette by Kerrie Lake
 * https://lospec.com/palette-list/resurrect-64
 * All game visuals should use only these 64 colors.
 */
export const PALETTE = {
  // Dark purples / blacks
  darkPurple: 0x2E222F,
  purple1: 0x3E3546,
  purple2: 0x625565,

  // Warm neutrals
  mauve: 0x966C6C,
  tan: 0xAB947A,
  plum: 0x694F62,
  lavender: 0x7F708A,
  silver: 0x9BABB2,
  mint: 0xC7DCD0,
  white: 0xFFFFFF,

  // Reds
  darkRed: 0x6E2727,
  red1: 0xB33831,
  red2: 0xEA4F36,
  redOrange: 0xF57D4A,
  crimson: 0xAE2334,
  brightRed: 0xE83B3B,
  orange1: 0xFB6B1D,
  orange2: 0xF79617,
  yellow1: 0xF9C22B,

  // Warm darks
  darkMagenta: 0x7A3045,
  brown1: 0x9E4539,
  brown2: 0xCD683D,
  brownOrange: 0xE6904E,
  gold: 0xFBB954,

  // Earth / greens
  darkBrown: 0x4C3E24,
  olive: 0x676633,
  yellowGreen: 0xA2A947,
  lime: 0xD5E04B,
  paleYellow: 0xFBFF86,

  // Greens
  darkGreen: 0x165A4C,
  green1: 0x239063,
  green2: 0x1EBC73,
  lightGreen: 0x91DB69,
  paleGreen: 0xCDDF6C,

  // Gray-greens
  darkGray: 0x313638,
  grayGreen1: 0x374E4A,
  grayGreen2: 0x547E64,
  grayGreen3: 0x92A984,
  grayGreen4: 0xB2BA90,

  // Teals
  darkTeal: 0x0B5E65,
  teal1: 0x0B8A8F,
  teal2: 0x0EAF9B,
  teal3: 0x30E1B9,
  paleTeal: 0x8FF8E2,

  // Blues
  darkBlue: 0x323353,
  blue1: 0x484A77,
  blue2: 0x4D65B4,
  blue3: 0x4D9BE6,
  lightBlue: 0x8FD3FF,

  // Purples
  darkViolet: 0x45293F,
  violet1: 0x6B3E75,
  violet2: 0x905EA9,
  violet3: 0xA884F3,
  paleViolet: 0xEAADED,

  // Pinks
  darkPink: 0x753C54,
  pink1: 0xA24B6F,
  pink2: 0xCF657F,
  pink3: 0xED8099,
  magenta1: 0x831C5D,
  magenta2: 0xC32454,
  hotPink: 0xF04F78,
  salmon: 0xF68181,
  peach: 0xFCA790,
  cream: 0xFDCBB0,
} as const

export type PaletteColor = typeof PALETTE[keyof typeof PALETTE]
