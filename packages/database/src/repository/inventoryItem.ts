import { useDatabase } from '../database'

export class InventoryItemRepository {
  static findAll() {
    const db = useDatabase()
    return db.query.inventoryItems.findMany()
  }
}
