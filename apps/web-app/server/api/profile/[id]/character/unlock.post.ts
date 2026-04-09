import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage } from '~~/server/api/websocket'

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

  // Check if already owned
  const profileWithEditions = await db.profile.findWithCharacterEditions(profileId!)
  const alreadyOwned = profileWithEditions?.characterEditions?.some(
    (e: { characterId: string }) => e.characterId === body.characterId,
  )
  if (alreadyOwned) {
    throw createError({ status: 400, message: 'Already owned' })
  }

  // Streamer currency unlock: check balance >= threshold (tokens are NOT spent)
  if (character.unlockedBy === 'STREAMER_CURRENCY') {
    if (!character.streamerId) {
      throw createError({ status: 400, message: 'Character has no streamer' })
    }

    const currency = await db.streamerCurrency.findByStreamerId(character.streamerId)
    if (!currency) {
      throw createError({ status: 400, message: 'Streamer currency not configured' })
    }

    const balance = await db.streamerCurrencyBalance.findByStreamerAndProfile(character.streamerId, profileId!)
    if (!balance || balance.balance < currency.characterPrice) {
      throw createError({ status: 400, message: 'Not enough streamer tokens' })
    }

    // Tokens are NOT deducted — they accumulate as loyalty score

    // Send exclusive unlock alert to streamer's channel
    const streamer = await db.profile.find(character.streamerId)
    if (streamer?.twitchId) {
      sendAlertMessage(streamer.twitchId, {
        type: 'EXCLUSIVE_UNLOCK',
        data: {
          userName: profile.userName ?? 'Unknown',
          codename: character.codename,
          characterName: character.nickname,
          currencyName: currency.name,
          currencyEmoji: currency.emoji,
        },
      })
    }
  } else {
    // Standard coin unlock
    if (profile.coins < character.price) {
      throw createError({ status: 400, message: 'Not enough coins' })
    }

    // Deduct coins
    await db.profile.addCoins(profileId!, -character.price)
  }

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
