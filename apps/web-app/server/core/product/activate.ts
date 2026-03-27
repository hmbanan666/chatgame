import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage } from '~~/server/api/websocket'
import { chargeRooms } from '~~/server/core/charge'
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

  // XP and alert
  const profile = await db.profile.find(profileId)
  const roomId = chargeRooms[0]?.id
  if (profile && roomId) {
    const xpEarned = Math.max(1, Math.floor(product.price / 5))
    await getLevelingService().addXpForAction(profileId, xpEarned, roomId)
    sendAlertMessage(roomId, {
      type: 'PURCHASE',
      data: {
        userName: profile.userName ?? profileId,
        coins: totalCoins,
        price: product.price,
        xpEarned,
      },
    })
  }
}
