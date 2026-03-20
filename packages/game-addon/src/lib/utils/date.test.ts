import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDateMinusMinutes, getDatePlusMinutes, getDatePlusSeconds } from './date'

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDatePlusMinutes', () => {
    it('adds minutes to current time', () => {
      const result = getDatePlusMinutes(30)
      expect(result).toEqual(new Date('2026-01-01T12:30:00.000Z'))
    })

    it('handles zero offset', () => {
      const result = getDatePlusMinutes(0)
      expect(result).toEqual(new Date('2026-01-01T12:00:00.000Z'))
    })

    it('handles large offsets', () => {
      const result = getDatePlusMinutes(120)
      expect(result).toEqual(new Date('2026-01-01T14:00:00.000Z'))
    })
  })

  describe('getDateMinusMinutes', () => {
    it('subtracts minutes from current time', () => {
      const result = getDateMinusMinutes(30)
      expect(result).toEqual(new Date('2026-01-01T11:30:00.000Z'))
    })

    it('handles zero offset', () => {
      const result = getDateMinusMinutes(0)
      expect(result).toEqual(new Date('2026-01-01T12:00:00.000Z'))
    })
  })

  describe('getDatePlusSeconds', () => {
    it('adds seconds to current time', () => {
      const result = getDatePlusSeconds(90)
      expect(result).toEqual(new Date('2026-01-01T12:01:30.000Z'))
    })

    it('handles zero seconds', () => {
      const result = getDatePlusSeconds(0)
      expect(result).toEqual(new Date('2026-01-01T12:00:00.000Z'))
    })
  })
})
