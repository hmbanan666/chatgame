export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, emoji, characterPrice, characterId } = body as {
    name?: string
    emoji?: string
    characterPrice?: number
    characterId?: string | null
  }

  if (!name || !emoji) {
    throw createError({ statusCode: 400, message: 'Name and emoji are required' })
  }

  if (characterPrice !== undefined && (characterPrice < 10 || characterPrice > 1000)) {
    throw createError({ statusCode: 400, message: 'Character price must be between 10 and 1000' })
  }

  // If linking a character, verify it belongs to this streamer
  if (characterId) {
    const character = await db.character.find(characterId)
    if (!character) {
      throw createError({ statusCode: 404, message: 'Character not found' })
    }
    if (character.streamerId && character.streamerId !== profile.id) {
      throw createError({ statusCode: 403, message: 'Character belongs to another streamer' })
    }
  }

  const currency = await db.streamerCurrency.upsert(profile.id, {
    name,
    emoji,
    ...(characterPrice !== undefined && { characterPrice }),
    ...(characterId !== undefined && { characterId }),
  })

  return { ok: true, currency }
})
