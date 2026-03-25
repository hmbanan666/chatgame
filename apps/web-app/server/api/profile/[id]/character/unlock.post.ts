import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const session = await getUserSession(event)

  if (!body.characterId || !session?.user) {
    throw createError({ statusCode: 400, message: 'Invalid data' })
  }

  if (session.user.id !== profileId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const profile = await db.profile.find(profileId!)
  if (!profile) {
    throw createError({ status: 404 })
  }

  const character = await db.character.find(body.characterId)
  if (!character || !character.isReady) {
    throw createError({ status: 404, message: 'Character not found' })
  }

  if (profile.coins < character.price) {
    throw createError({ status: 400, message: 'Not enough coins' })
  }

  // Check if already owned
  const profileWithEditions = await db.profile.findWithCharacterEditions(profileId!)
  const alreadyOwned = profileWithEditions?.characterEditions?.some(
    (e: { characterId: string }) => e.characterId === body.characterId,
  )
  if (alreadyOwned) {
    throw createError({ status: 400, message: 'Already owned' })
  }

  // Deduct coins
  await db.profile.addCoins(profileId!, -character.price)

  // Create edition
  const [edition] = await db.characterEdition.create({
    id: createId(),
    profileId: profile.id,
    characterId: character.id,
  })

  await db.transaction.create({
    id: createId(),
    profileId: profile.id,
    entityId: edition!.id,
    amount: character.price,
    type: 'CHARACTER_UNLOCK',
  })

  return { ok: true }
})
