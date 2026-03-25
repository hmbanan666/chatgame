import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class PlayerRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.players.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static async findRandomNames(limit = 20) {
    const db = useDatabase()
    const rows = await db.query.players.findMany({
      columns: { name: true },
      orderBy: (t, { desc }) => desc(t.lastActionAt),
      limit,
    })
    return rows.map((r) => r.name)
  }

  static async findOrCreate({ userName, profileId }: { userName: string, profileId: string }) {
    const db = useDatabase()
    const existing = await db.query.players.findFirst({
      where: (t, { eq }) => eq(t.profileId, profileId),
    })
    if (existing) {
      return { player: existing, isNew: false }
    }

    const playerId = createId()
    const [player] = await db.insert(tables.players).values({
      id: playerId,
      name: userName,
      inventoryId: playerId,
      profileId,
    }).returning()

    return { player: player!, isNew: true }
  }

  static updateLastActionAt(id: string) {
    const db = useDatabase()
    return db.update(tables.players)
      .set({ lastActionAt: new Date() })
      .where(eq(tables.players.id, id))
  }
}
