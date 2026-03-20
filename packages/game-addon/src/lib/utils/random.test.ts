import { describe, expect, it } from 'vitest'
import { getMinusOrPlus, getRandomInRange } from './random'

describe('random utils', () => {
  describe('getRandomInRange', () => {
    it('returns value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomInRange(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
      }
    })

    it('returns integer values', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInRange(1, 100)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('works with same min and max', () => {
      const result = getRandomInRange(5, 5)
      expect(result).toBe(5)
    })

    it('works with negative range', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInRange(-10, -1)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-1)
      }
    })
  })

  describe('getMinusOrPlus', () => {
    it('returns only -1 or 1', () => {
      for (let i = 0; i < 100; i++) {
        const result = getMinusOrPlus()
        expect([-1, 1]).toContain(result)
      }
    })
  })
})
