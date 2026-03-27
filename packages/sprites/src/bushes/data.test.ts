import { describe, expect, it } from 'vitest'
import { BIOME_PALETTES, getBushPalette, SLOT_ROLES } from './data'

describe('getBushPalette', () => {
  it('returns palette matching slot count', () => {
    const palette = getBushPalette('GREEN')
    expect(palette).toHaveLength(SLOT_ROLES.length)
  })

  it('returns different colors for different biomes', () => {
    const green = getBushPalette('GREEN')
    const blue = getBushPalette('BLUE')
    expect(green).not.toEqual(blue)
  })

  it('falls back to GREEN for unknown biome', () => {
    const palette = getBushPalette('UNKNOWN')
    expect(palette).toEqual(BIOME_PALETTES.GREEN)
  })

  it('returns palette for every defined biome', () => {
    for (const biome of Object.keys(BIOME_PALETTES)) {
      const palette = getBushPalette(biome)
      expect(palette).toHaveLength(SLOT_ROLES.length)
    }
  })
})
