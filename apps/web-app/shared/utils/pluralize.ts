export function pluralizationRu(int: number, array: [string, string, string]): string {
  const n = Math.abs(int)

  let idx: 1 | 2 | 0
  // @see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
  if (n % 10 === 1 && n % 100 !== 11) {
    idx = 0 // one
  } else if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    idx = 1 // few
  } else {
    idx = 2 // many
  }

  return array[idx]
}
