import type { EventHandlerRequest } from 'h3'
import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler<EventHandlerRequest, Promise<{ ok: boolean }>>(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const session = await getUserSession(event)

  if (!body.characterId || !session?.user) {
    throw createError({
      statusCode: 400,
      message: 'You must provide data',
    })
  }

  if (session.user.id !== profileId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }

  const profile = await db.profile.find(profileId!)
  if (!profile) {
    throw createError({
      status: 404,
    })
  }

  const character = await db.character.find(body.characterId)
  if (!character || !character.isReady) {
    throw createError({
      status: 404,
    })
  }

  // Check, if already have
  const profileWithEditions = await db.profile.findWithCharacterEditions(profileId!)
  const editionAlready = profileWithEditions?.characterEditions?.find(
    (e: { characterId: string }) => e.characterId === body.characterId,
  )
  if (editionAlready?.id) {
    throw createError({
      status: 400,
      message: 'You already have this character',
    })
  }

  // Give new edition
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

  return {
    ok: true,
  }
})
