import type { InferInsertModel } from 'drizzle-orm'
import { eq, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class InventoryItemEditionRepository {
  static findByProfileAndItem(profileId: string, itemId: string) {
    const db = useDatabase()
    return db.query.inventoryItemEditions.findFirst({
      where: (t, { eq, and }) => and(eq(t.profileId, profileId), eq(t.itemId, itemId)),
    })
  }

  static find(id: string) {
    const db = useDatabase()
    return db.query.inventoryItemEditions.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static create(data: InferInsertModel<typeof tables.inventoryItemEditions>) {
    const db = useDatabase()
    return db.insert(tables.inventoryItemEditions).values(data).returning()
  }

  static addAmount(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.inventoryItemEditions)
      .set({ amount: sql`${tables.inventoryItemEditions.amount} + ${amount}` })
      .where(eq(tables.inventoryItemEditions.id, id))
  }

  static removeAmount(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.inventoryItemEditions)
      .set({ amount: sql`${tables.inventoryItemEditions.amount} - ${amount}` })
      .where(eq(tables.inventoryItemEditions.id, id))
  }

  static delete(id: string) {
    const db = useDatabase()
    return db.delete(tables.inventoryItemEditions)
      .where(eq(tables.inventoryItemEditions.id, id))
  }
}
