export function getXpForLevel(level: number, coefficient: number = 1) {
  return Math.floor((coefficient * 0.5) * (level ** 3) + 0.8 * (level ** 2) + 2 * level)
}
