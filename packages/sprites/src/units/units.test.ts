import { describe, expect, it } from 'vitest'
import { UNIT_CODENAMES } from './index'
import { getUnitData } from './render'

describe('getUnitData', () => {
  it('returns data for every codename in UNIT_CODENAMES', () => {
    for (const codename of UNIT_CODENAMES) {
      const data = getUnitData(codename)
      expect(data.FRAME_SIZE).toBeGreaterThan(0)
      expect(data.IDLE_FRAMES.length).toBeGreaterThan(0)
      expect(data.MOVING_FRAMES.length).toBeGreaterThan(0)
      expect(data.DEFAULT_PALETTE.length).toBeGreaterThan(0)
    }
  })

  it('falls back to twitchy for unknown codename', () => {
    const unknown = getUnitData('nonexistent')
    const twitchy = getUnitData('twitchy')
    expect(unknown).toBe(twitchy)
  })

  it('every frame has valid pixel data', () => {
    for (const codename of UNIT_CODENAMES) {
      const data = getUnitData(codename)
      const allFrames = [...data.IDLE_FRAMES, ...data.MOVING_FRAMES]

      for (const frame of allFrames) {
        for (const [x, y, slot] of frame) {
          expect(x).toBeGreaterThanOrEqual(0)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(slot).toBeGreaterThanOrEqual(0)
          expect(slot).toBeLessThan(data.DEFAULT_PALETTE.length)
        }
      }
    }
  })
})
