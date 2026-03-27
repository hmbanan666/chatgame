import { and, eq, lt } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class BacklogItemRepository {
  static findByStreamerId(streamerId: string) {
    const db = useDatabase()
    return db.query.backlogItems.findMany({
      where: (t, { eq }) => eq(t.streamerId, streamerId),
      orderBy: (t, { asc }) => asc(t.updatedAt),
    })
  }

  static findActiveByStreamerId(streamerId: string) {
    const db = useDatabase()
    const cutoff = new Date(Date.now() - 60 * 60 * 1000)
    return db.query.backlogItems.findMany({
      where: (t, { eq, and, gte }) => and(
        eq(t.streamerId, streamerId),
        eq(t.status, 'new'),
        gte(t.updatedAt, cutoff),
      ),
      orderBy: (t, { asc }) => asc(t.updatedAt),
      limit: 20,
    })
  }

  static create(data: { text: string, authorName: string, source: string, amount?: number, streamerId: string }) {
    const db = useDatabase()
    return db.insert(tables.backlogItems).values(data).returning()
  }

  static createQuest(data: {
    text: string
    authorName: string
    streamerId: string
    questProfileId: string
    questTemplateId: string
    questGoal: number
    questReward: number
  }) {
    const db = useDatabase()
    return db.insert(tables.backlogItems).values({
      ...data,
      source: 'quest',
    }).returning()
  }

  static updateStatus(id: string, status: string) {
    const db = useDatabase()
    return db.update(tables.backlogItems)
      .set({ status })
      .where(eq(tables.backlogItems.id, id))
  }

  static updateQuestProgress(id: string, progress: number) {
    const db = useDatabase()
    return db.update(tables.backlogItems)
      .set({ questProgress: progress, updatedAt: new Date() })
      .where(eq(tables.backlogItems.id, id))
  }

  static completeQuest(id: string, finalProgress: number) {
    const db = useDatabase()
    return db.update(tables.backlogItems)
      .set({ questProgress: finalProgress, status: 'done', updatedAt: new Date() })
      .where(eq(tables.backlogItems.id, id))
  }

  static findQuestByProfileSince(questProfileId: string, since: Date) {
    const db = useDatabase()
    return db.query.backlogItems.findFirst({
      where: (t, { and, eq, gte }) => and(
        eq(t.questProfileId, questProfileId),
        eq(t.source, 'quest'),
        gte(t.createdAt, since),
      ),
    })
  }

  static expireStaleQuests(staleMinutes = 60) {
    const db = useDatabase()
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000)
    return db.update(tables.backlogItems)
      .set({ status: 'expired' })
      .where(
        and(
          eq(tables.backlogItems.source, 'quest'),
          eq(tables.backlogItems.status, 'new'),
          lt(tables.backlogItems.updatedAt, cutoff),
        ),
      )
  }

  static expireQuest(id: string, finalProgress: number) {
    const db = useDatabase()
    return db.update(tables.backlogItems)
      .set({ questProgress: finalProgress, status: 'expired', updatedAt: new Date() })
      .where(eq(tables.backlogItems.id, id))
  }
}
