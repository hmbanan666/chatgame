import type { InferInsertModel } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class TransactionRepository {
  static findRecent(limit: number) {
    const db = useDatabase()
    return db.query.transactions.findMany({
      with: {
        profile: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
    })
  }

  static create(data: InferInsertModel<typeof tables.transactions>) {
    const db = useDatabase()
    return db.insert(tables.transactions).values(data).returning()
  }
}
