import type { InferInsertModel } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class ProductItemRepository {
  static findByProductId(productId: string) {
    const db = useDatabase()
    return db.query.productItems.findMany({
      where: (t, { eq }) => eq(t.productId, productId),
      orderBy: (t, { asc }) => asc(t.priority),
    })
  }

  static create(data: InferInsertModel<typeof tables.productItems>) {
    const db = useDatabase()
    return db.insert(tables.productItems).values(data).returning()
  }
}
