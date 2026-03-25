import { and, eq, gte } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamRepository {
  static findLive(streamerId: string) {
    const db = useDatabase()
    return db.query.streams.findFirst({
      where: (t, { eq, and }) => and(eq(t.streamerId, streamerId), eq(t.isLive, true)),
    })
  }

  /** Find a recently ended stream (within windowMs) that can be resumed */
  static findRecent(streamerId: string, windowMs: number) {
    const db = useDatabase()
    const cutoff = new Date(Date.now() - windowMs)
    return db.query.streams.findFirst({
      where: (t, { eq, and, gte }) => and(
        eq(t.streamerId, streamerId),
        eq(t.isLive, false),
        gte(t.endedAt, cutoff),
      ),
      orderBy: (t, { desc }) => desc(t.endedAt),
    })
  }

  static resumeStream(id: string) {
    const db = useDatabase()
    return db.update(tables.streams)
      .set({ isLive: true, endedAt: null, updatedAt: new Date() })
      .where(eq(tables.streams.id, id))
  }

  static create(data: { streamerId: string, fuel?: number }) {
    const db = useDatabase()
    return db.insert(tables.streams).values({
      streamerId: data.streamerId,
      fuel: data.fuel ?? 50,
      isLive: true,
    }).returning()
  }

  static async endStream(id: string) {
    const db = useDatabase()
    return db.update(tables.streams)
      .set({
        isLive: false,
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tables.streams.id, id))
  }

  static async updateStats(id: string, data: {
    fuel?: number
    messagesCount?: number
    fuelAdded?: number
    fuelStolen?: number
    treesChopped?: number
    donationsCount?: number
    donationsTotal?: number
    totalRedemptions?: number
    couponsTaken?: number
    peakViewers?: number
    averageViewers?: number
  }) {
    const db = useDatabase()
    return db.update(tables.streams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.streams.id, id))
  }
}
