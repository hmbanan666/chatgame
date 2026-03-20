import type { EventHandlerRequest } from 'h3'
import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler<EventHandlerRequest, Promise<{ ok: boolean }>>(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!body.characterId) {
    throw createError({
      statusCode: 400,
      message: 'You must provide data',
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

  await db.transaction.create({
    id: createId(),
    profileId: profile.id,
    entityId: edition!.id,
    amount: character.price,
    type: 'POINTS_FROM_CHARACTER_UNLOCK',
  })

  await db.profile.addCollectorPoints(profile.id, character.price)

  // Check trophy
  const trophyEditions = await db.trophyEdition.findByProfile(profile.id)
  if (
    !trophyEditions.some((progress: { trophyId: string }) => progress.trophyId === 'h09eur7whn4nyjr0bereyb5l')
  ) {
    await db.trophyEdition.create({
      id: createId(),
      profileId: profile.id,
      trophyId: 'h09eur7whn4nyjr0bereyb5l',
    })

    await db.profile.addTrophyHunterPoints(profile.id, 50)
  }

  // Donate points
  await db.profile.addPatronPoints(profile.id, (character.price / 2) * 10)

  return {
    ok: true,
  }
})
