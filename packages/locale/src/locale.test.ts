import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ru } from './ru'

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

describe('locale completeness', () => {
  it('ru has all keys from en', () => {
    const enKeys = getKeys(en as unknown as Record<string, unknown>)
    const ruKeys = getKeys(ru as unknown as Record<string, unknown>)

    const missingInRu = enKeys.filter((k) => !ruKeys.includes(k))
    expect(missingInRu, `Missing in ru: ${missingInRu.join(', ')}`).toEqual([])
  })

  it('en has all keys from ru', () => {
    const enKeys = getKeys(en as unknown as Record<string, unknown>)
    const ruKeys = getKeys(ru as unknown as Record<string, unknown>)

    const missingInEn = ruKeys.filter((k) => !enKeys.includes(k))
    expect(missingInEn, `Missing in en: ${missingInEn.join(', ')}`).toEqual([])
  })
})
