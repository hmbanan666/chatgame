import { describe, expect, it } from 'vitest'
import { CLEARING_NAMES, FIELD_NAMES, FOREST_LENGTH, FOREST_NAMES, VILLAGE_LENGTH, VILLAGE_NAMES } from './chunk'

describe('chunk constants', () => {
  it('forest length is 5000px', () => {
    expect(FOREST_LENGTH).toBe(5000)
  })

  it('village length is 2000px', () => {
    expect(VILLAGE_LENGTH).toBe(2000)
  })

  it('has village names', () => {
    expect(VILLAGE_NAMES.length).toBeGreaterThanOrEqual(10)
    for (const name of VILLAGE_NAMES) {
      expect(name.length).toBeLessThanOrEqual(10)
    }
  })

  it('has forest names for all biomes', () => {
    const biomes = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET'] as const
    for (const biome of biomes) {
      expect(FOREST_NAMES[biome].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('has clearing names for all biomes', () => {
    const biomes = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET'] as const
    for (const biome of biomes) {
      expect(CLEARING_NAMES[biome].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('has field names', () => {
    expect(FIELD_NAMES.length).toBeGreaterThanOrEqual(3)
  })
})
