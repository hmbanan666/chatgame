import { createId } from '@paralleldrive/cuid2'

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
}
