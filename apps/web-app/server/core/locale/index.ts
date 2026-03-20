import type { Dictionary } from '@chat-game/locale'
import { en, ru } from '@chat-game/locale'

export function dictionary(locale: string | undefined = 'en'): Dictionary {
  if (locale === 'ru') {
    return ru
  }

  return en
}
