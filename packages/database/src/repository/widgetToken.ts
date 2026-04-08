import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class WidgetTokenRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.widgetTokens.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    })
  }

  static findByStreamerId(streamerId: string) {
    const db = useDatabase()
    return db.query.widgetTokens.findFirst({
      where: (t, { eq: e }) => e(t.streamerId, streamerId),
    })
  }

  static async findOrCreate(streamerId: string, roomId: string) {
    const db = useDatabase()
    const existing = await db.query.widgetTokens.findFirst({
      where: (t, { eq: e }) => e(t.streamerId, streamerId),
    })
    if (existing) {
      return existing
    }

    const [token] = await db.insert(tables.widgetTokens)
      .values({ streamerId, roomId })
      .returning()

    return token!
  }

  static delete(id: string) {
    const db = useDatabase()
    return db.delete(tables.widgetTokens)
      .where(eq(tables.widgetTokens.id, id))
  }
}
