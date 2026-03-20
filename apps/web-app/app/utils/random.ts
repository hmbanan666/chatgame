export function getRandomInRange(min: number, max: number): number {
  const ceilMin = Math.ceil(min)
  return Math.floor(Math.random() * (max - ceilMin + 1)) + ceilMin
}

export function getMinusOrPlus(): number {
  // -1 or 1
  return Math.round(Math.random()) * 2 - 1
}
