import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class QuestEditionRepository {
  static create(data: InferInsertModel<typeof tables.questEditions>) {
    const db = useDatabase()
    return db.insert(tables.questEditions).values(data).returning()
  }

  static update(id: string, data: { status?: string, completedAt?: Date | null }) {
    const db = useDatabase()
    return db.update(tables.questEditions)
      .set(data)
      .where(eq(tables.questEditions.id, id))
  }
}
