import type { InferInsertModel } from 'drizzle-orm'
import { and, eq, gt, inArray } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class PaymentRepository {
  static findPendingSince(since: Date) {
    const db = useDatabase()
    return db.select().from(tables.payments).where(
      and(
        inArray(tables.payments.status, ['PENDING']),
        gt(tables.payments.createdAt, since),
      ),
    )
  }

  static create(data: InferInsertModel<typeof tables.payments>) {
    const db = useDatabase()
    return db.insert(tables.payments).values(data).returning()
  }

  static updateStatus(id: string, status: string) {
    const db = useDatabase()
    return db.update(tables.payments)
      .set({ status })
      .where(eq(tables.payments.id, id))
  }
}
