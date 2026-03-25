import { getXpForLevel } from '#shared/utils/level'

export function getLevels(amount: number = 80, coefficient: number = 1) {
  const levels = []

  for (let level = 1; level <= amount; level++) {
    const xp = getXpForLevel(level, coefficient)
    levels.push({ level, xp })
  }

  return levels
}
