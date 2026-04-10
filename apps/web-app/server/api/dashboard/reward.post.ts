import { sendAlertMessage } from '~~/server/api/websocket'
import { getLevelingService } from '~~/server/core/leveling/service'

const logger = useLogger('dashboard:reward')

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const streamerProfile = await db.profile.find(session.user.id)
  if (!streamerProfile?.isStreamer || !streamerProfile.twitchId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  if (!body?.twitchId || !body?.type || !body?.amount) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  // Always derive roomId from the server-side streamer profile. The client
  // used to pass it, but if user.value wasn't hydrated yet it would be '' and
  // the alert silently went nowhere.
  const roomId = streamerProfile.twitchId
  const { twitchId, type } = body
  const amount = Math.min(Math.max(1, Number(body.amount)), type === 'xp' ? 100 : 50)

  const profile = await db.profile.findByTwitchId(twitchId)
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  if (type === 'xp') {
    await getLevelingService().addXpForAction(twitchId, amount, roomId)
    return { ok: true, type: 'xp', amount }
  }

  if (type === 'coins') {
    if (streamerProfile.coins < amount) {
      throw createError({ statusCode: 400, message: 'NOT_ENOUGH_COINS' })
    }

    await db.profile.addCoins(streamerProfile.id, -amount)
    await db.profile.addCoins(profile.id, amount)

    await db.transaction.create({
      type: 'STREAMER_GIFT_SENT',
      amount: -amount,
      profileId: streamerProfile.id,
      entityId: profile.id,
      text: `Gift to ${profile.userName ?? twitchId}`,
    })
    await db.transaction.create({
      type: 'COINS_FROM_STREAMER_GIFT',
      amount,
      profileId: profile.id,
      entityId: streamerProfile.id,
      text: `Gift from ${streamerProfile.userName}`,
    })

    let codename = 'twitchy'
    if (profile.activeEditionId) {
      const edition = await db.characterEdition.findWithCharacter(profile.activeEditionId)
      if (edition?.character?.codename) {
        codename = edition.character.codename
      }
    }

    logger.info(`Gift: ${streamerProfile.userName} → ${profile.userName ?? twitchId} +${amount} coins (room ${roomId})`)
    sendAlertMessage(roomId, {
      type: 'STREAMER_REWARD',
      data: {
        userName: profile.userName ?? twitchId,
        codename,
        amount,
        rewardType: 'coins',
      },
    })

    return { ok: true, type: 'coins', amount }
  }

  throw createError({ statusCode: 400, message: 'Invalid reward type' })
})
