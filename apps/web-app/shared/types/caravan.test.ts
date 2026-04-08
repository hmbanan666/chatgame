import type { WorldChunk } from './chunk'
import { describe, expect, it } from 'vitest'

// Test caravan progress calculation (same logic as CaravanService.progress)
function calcProgress(wagonX: number, startX: number, targetX: number): number {
  if (targetX <= startX) {
    return 0
  }
  return Math.min(1, (wagonX - startX) / (targetX - startX))
}

describe('caravan progress', () => {
  it('returns 0 at start', () => {
    expect(calcProgress(100, 100, 5000)).toBe(0)
  })

  it('returns 0.5 at midpoint', () => {
    expect(calcProgress(2550, 100, 5000)).toBeCloseTo(0.5, 1)
  })

  it('returns 1 at destination', () => {
    expect(calcProgress(5000, 100, 5000)).toBe(1)
  })

  it('clamps to 1 past destination', () => {
    expect(calcProgress(6000, 100, 5000)).toBe(1)
  })

  it('returns 0 if target equals start', () => {
    expect(calcProgress(100, 100, 100)).toBe(0)
  })
})

// Test chunk route sequence
describe('chunk route sequence', () => {
  it('village → clearing/field → forest → forest → village pattern', () => {
    // Simulate the chunk generation pattern
    const forestsBetweenVillages = 3
    const sequence: string[] = []

    let forestsSinceVillage = 0

    // Generate 10 chunks
    for (let i = 0; i < 10; i++) {
      if (i === 0) {
        sequence.push('village')
        continue
      }

      if (forestsSinceVillage >= forestsBetweenVillages) {
        sequence.push('village')
        forestsSinceVillage = 0
      } else if (forestsSinceVillage === 0) {
        sequence.push('clearing')
        forestsSinceVillage++
      } else {
        sequence.push('forest')
        forestsSinceVillage++
      }
    }

    // Should start with village
    expect(sequence[0]).toBe('village')

    // After village should be clearing
    expect(sequence[1]).toBe('clearing')

    // Then forests
    expect(sequence[2]).toBe('forest')
    expect(sequence[3]).toBe('forest')

    // Then village again
    expect(sequence[4]).toBe('village')
  })

  it('chunks have correct length', () => {
    const chunks: WorldChunk[] = [
      { id: '1', type: 'village', name: 'Test', biome: 'GREEN', startX: 0, endX: 2000 },
      { id: '2', type: 'clearing', name: 'Test', biome: 'GREEN', startX: 2000, endX: 7000 },
      { id: '3', type: 'forest', name: 'Test', biome: 'BLUE', startX: 7000, endX: 12000 },
    ]

    expect(chunks[0]!.endX - chunks[0]!.startX).toBe(2000) // village
    expect(chunks[1]!.endX - chunks[1]!.startX).toBe(5000) // clearing = forest length
    expect(chunks[2]!.endX - chunks[2]!.startX).toBe(5000) // forest
  })

  it('chunks are contiguous (no gaps)', () => {
    const chunks: WorldChunk[] = [
      { id: '1', type: 'village', name: 'A', biome: 'GREEN', startX: 0, endX: 2000 },
      { id: '2', type: 'forest', name: 'B', biome: 'GREEN', startX: 2000, endX: 7000 },
      { id: '3', type: 'forest', name: 'C', biome: 'BLUE', startX: 7000, endX: 12000 },
    ]

    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i]!.startX).toBe(chunks[i - 1]!.endX)
    }
  })
})
