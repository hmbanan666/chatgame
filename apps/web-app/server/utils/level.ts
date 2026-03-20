export function getXpForLevel(level: number, coefficient: number = 1) {
  return Math.floor((coefficient * 0.5) * (level ** 3) + 0.8 * (level ** 2) + 2 * level)
}

export function getLevels(amount: number = 80, coefficient: number = 1) {
  const levels = []

  for (let level = 1; level <= amount; level++) {
    const xp = getXpForLevel(level, coefficient)
    levels.push({ level, xp })
  }

  return levels
}
