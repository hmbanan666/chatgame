import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class LeaderboardMemberRepository {
  static create(data: InferInsertModel<typeof tables.leaderboardMembers>) {
    const db = useDatabase()
    return db.insert(tables.leaderboardMembers).values(data).returning()
  }

  static updatePoints(id: string, points: number) {
    const db = useDatabase()
    return db.update(tables.leaderboardMembers)
      .set({ points })
      .where(eq(tables.leaderboardMembers.id, id))
  }

  static updatePosition(id: string, position: number) {
    const db = useDatabase()
    return db.update(tables.leaderboardMembers)
      .set({ position })
      .where(eq(tables.leaderboardMembers.id, id))
  }
}
