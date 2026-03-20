import { createId } from '@paralleldrive/cuid2'

export async function addItemToInventory(data: { profileId: string, itemId: string, amount: number }) {
  if (!data.amount || data.amount <= 0) {
    return
  }

  const item = await db.inventoryItemEdition.findByProfileAndItem(data.profileId, data.itemId)
  if (item) {
    return db.inventoryItemEdition.addAmount(item.id, data.amount)
  }

  return db.inventoryItemEdition.create({
    id: createId(),
    itemId: data.itemId,
    profileId: data.profileId,
    amount: data.amount,
  })
}

export async function removeItemFromInventory({ itemEditionId, amount }: { itemEditionId: string, amount: number }) {
  if (!amount || amount <= 0) {
    return
  }

  const item = await db.inventoryItemEdition.find(itemEditionId)
  if (!item) {
    return
  }

  // Will be zero?
  if (item.amount - amount <= 0) {
    return db.inventoryItemEdition.delete(item.id)
  }

  return db.inventoryItemEdition.removeAmount(item.id, amount)
}
