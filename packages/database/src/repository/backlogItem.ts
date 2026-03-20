import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class BacklogItemRepository {
  static findByStreamerId(streamerId: string) {
    const db = useDatabase()
    return db.query.backlogItems.findMany({
      where: (t, { eq }) => eq(t.streamerId, streamerId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    })
  }

  static findActiveByStreamerId(streamerId: string) {
    const db = useDatabase()
    return db.query.backlogItems.findMany({
      where: (t, { eq, and }) => and(
        eq(t.streamerId, streamerId),
        eq(t.status, 'new'),
      ),
      orderBy: (t, { desc }) => desc(t.createdAt),
    })
  }

  static create(data: { text: string, authorName: string, source: string, amount?: number, streamerId: string }) {
    const db = useDatabase()
    return db.insert(tables.backlogItems).values(data).returning()
  }

  static updateStatus(id: string, status: string) {
    const db = useDatabase()
    return db.update(tables.backlogItems)
      .set({ status })
      .where(eq(tables.backlogItems.id, id))
  }
}
