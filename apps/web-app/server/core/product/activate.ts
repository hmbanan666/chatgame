import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage } from '~~/server/api/websocket'
import { getChargeRoom } from '~~/server/core/charge'
import { getLevelingService } from '~~/server/core/leveling/service'

export async function activateProduct({ profileId, productId }: { profileId: string, productId: string }) {
  const product = await db.product.findWithItems(productId)
  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  const totalCoins = product.coins + product.bonusCoins
  if (totalCoins > 0) {
    await db.profile.addCoins(profileId, totalCoins)
  }

  for (const item of product.items) {
    switch (item.type) {
      case 'CHARACTER': {
        if (!item.entityId) {
          break
        }
        const profileWithEditions = await db.profile.findWithCharacterEditions(profileId)
        const hasChar = profileWithEditions?.characterEditions.some(
          (ce: { characterId: string }) => ce.characterId === item.entityId,
        )
        if (!hasChar) {
          await db.characterEdition.create({
            id: createId(),
            profileId,
            characterId: item.entityId,
          })
        }
        break
      }
    }
  }

  // XP and alert. A purchase isn't tied to a specific stream, but we want the
  // buyer to see their celebration moment. Find the stream they're currently
  // watching (fresh streamerViewer activity within 10 min) and send the alert
  // there. If they aren't watching anyone right now, silently grant XP.
  const profile = await db.profile.find(profileId)
  if (profile?.twitchId) {
    const xpEarned = Math.max(1, Math.floor(product.price / 5))

    const currentViewerRow = await db.streamerViewer.findCurrentStreamerForViewer(profile.id)
    const currentStreamer = currentViewerRow
      ? await db.profile.find(currentViewerRow.streamerId)
      : null
    const room = currentStreamer?.twitchId ? getChargeRoom(currentStreamer.twitchId) : null

    if (room?.isLive) {
      await getLevelingService().addXpForAction(profile.twitchId, xpEarned, room.id)
      sendAlertMessage(room.id, {
        type: 'PURCHASE',
        data: {
          userName: profile.userName ?? profileId,
          coins: totalCoins,
          price: product.price,
          xpEarned,
        },
      })
    } else {
      // Not watching anyone live — just grant XP, no alert
      await db.profile.addXp(profile.id, xpEarned)
    }
  }
}
