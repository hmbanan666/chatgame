import { createId } from '@paralleldrive/cuid2'
import { getXpForLevel } from '~~/server/utils/level'

export default defineEventHandler(async () => {
  // Generate levels for character
  const characterId = 'ytyz0rtl2s84x2gmbvzl3r5h'
  const levels = 20

  const character = await db.character.findWithLevels(characterId)
  if (!character) {
    throw createError({
      status: 404,
    })
  }

  for (let level = 1; level <= levels; level++) {
    // If already exists, skip
    if (character.levels.some((l: { level: number }) => l.level === level)) {
      continue
    }

    await db.characterLevel.create({
      id: createId(),
      characterId,
      level,
      requiredXp: getXpForLevel(level, character.coefficient),
    })
  }

  return { ok: true }
})
