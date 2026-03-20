import type { InferInsertModel } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class TrophyEditionRepository {
  static findByProfile(profileId: string) {
    const db = useDatabase()
    return db.query.trophyEditions.findMany({
      where: (t, { eq }) => eq(t.profileId, profileId),
      with: {
        trophy: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    })
  }

  static findByIdAndProfile(id: string, profileId: string) {
    const db = useDatabase()
    return db.query.trophyEditions.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, id), eq(t.profileId, profileId)),
      with: { trophy: true },
    })
  }

  static create(data: InferInsertModel<typeof tables.trophyEditions>) {
    const db = useDatabase()
    return db.insert(tables.trophyEditions).values(data).returning()
  }
}
