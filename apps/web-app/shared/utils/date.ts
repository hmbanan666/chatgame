export function getDatePlusMinutes(minuteOffset: number): Date {
  const millisecondOffset = minuteOffset * 60 * 1000
  return new Date(Date.now() + millisecondOffset)
}

export function getDateMinusMinutes(minutes: number): Date {
  const millisecondsOffset = minutes * 60 * 1000
  return new Date(Date.now() - millisecondsOffset)
}

export function getDatePlusSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000)
}
