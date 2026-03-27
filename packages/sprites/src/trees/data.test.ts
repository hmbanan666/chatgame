import { describe, expect, it } from 'vitest'
import { BIOME_LEAF_PALETTES, DEFAULT_PALETTE, getTreePalette, LEAF_SLOT_START } from './data'

describe('getTreePalette', () => {
  it('returns palette of same length as DEFAULT_PALETTE', () => {
    const palette = getTreePalette('GREEN', 0)
    expect(palette).toHaveLength(DEFAULT_PALETTE.length)
  })

  it('keeps trunk slots unchanged across biomes', () => {
    const green = getTreePalette('GREEN', 0)
    const blue = getTreePalette('BLUE')

    for (let i = 0; i < LEAF_SLOT_START; i++) {
      expect(green[i]).toBe(blue[i])
    }
  })

  it('changes leaf slots for different biomes', () => {
    const green = getTreePalette('GREEN', 0)
    const blue = getTreePalette('BLUE')

    const greenLeaves = green.slice(LEAF_SLOT_START)
    const blueLeaves = blue.slice(LEAF_SLOT_START)
    expect(greenLeaves).not.toEqual(blueLeaves)
  })

  it('falls back to default palette for unknown biome', () => {
    const palette = getTreePalette('UNKNOWN_BIOME')
    expect(palette).toEqual(DEFAULT_PALETTE)
  })

  it('returns palette for every defined biome', () => {
    for (const biome of Object.keys(BIOME_LEAF_PALETTES)) {
      const palette = getTreePalette(biome)
      expect(palette).toHaveLength(DEFAULT_PALETTE.length)
    }
  })
})
