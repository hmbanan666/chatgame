import { describe, expect, it } from 'vitest'
import { getRandInteger } from './random'

describe('getRandInteger', () => {
  it('returns value within range', () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandInteger(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
    }
  })

  it('returns integer values', () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandInteger(1, 100)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it('works with same min and max', () => {
    const result = getRandInteger(5, 5)
    expect(result).toBe(5)
  })

  it('works with zero range start', () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandInteger(0, 10)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(10)
    }
  })
})
