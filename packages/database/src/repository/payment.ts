import type { InferInsertModel } from 'drizzle-orm'
import { and, eq, gt, inArray, sql } from 'drizzle-orm'
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

  static async sumByProfile(profileId: string): Promise<number> {
    const db = useDatabase()
    const result = await db.select({
      total: sql<number>`coalesce(sum(${tables.payments.amount}), 0)`,
    })
      .from(tables.payments)
      .where(and(
        eq(tables.payments.profileId, profileId),
        eq(tables.payments.status, 'COMPLETED'),
      ))
    return Number(result[0]?.total ?? 0)
  }

  static updateStatus(id: string, status: string) {
    const db = useDatabase()
    return db.update(tables.payments)
      .set({ status })
      .where(eq(tables.payments.id, id))
  }
}
