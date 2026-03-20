import type { InferInsertModel } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class TrophyRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.trophies.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findAll() {
    const db = useDatabase()
    return db.query.trophies.findMany()
  }

  static findWithEditions(id: string, limit = 50) {
    const db = useDatabase()
    return db.query.trophies.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        editions: {
          with: {
            profile: true,
          },
          orderBy: (t, { desc }) => desc(t.createdAt),
          limit,
        },
      },
    })
  }

  static create(data: InferInsertModel<typeof tables.trophies>) {
    const db = useDatabase()
    return db.insert(tables.trophies).values(data).returning()
  }
}
