import type { Dictionary } from '@chatgame/locale'
import { en, ru } from '@chatgame/locale'

export function dictionary(locale: string | undefined = 'en'): Dictionary {
  if (locale === 'ru') {
    return ru
  }

  return en
}
