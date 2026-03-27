export function getRandInteger(min: number, max: number): number {
  const range = max - min + 1
  const randomBuffer = new Uint32Array(1)
  const randomValue = crypto.getRandomValues(randomBuffer)

  // Convert to float between 0 and 1
  const randomNumber = randomValue[0]! / (2 ** 32)
  return Math.floor(randomNumber * range) + min
}
