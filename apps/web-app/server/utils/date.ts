export function getDateMinusMinutes(minutes: number): Date {
  const milliseconds = minutes * 60 * 1000
  return new Date(Date.now() - milliseconds)
}
