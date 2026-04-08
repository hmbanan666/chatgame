import { eq, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class RedemptionRepository {
  static create(data: {
    streamerId: string
    streamId?: string
    twitchUserId: string
    userName: string
    rewardId: string
    rewardTitle: string
    rewardCost: number
  }) {
    const db = useDatabase()
    return db.insert(tables.redemptions).values(data).returning()
  }

  static findByStreamId(streamId: string) {
    const db = useDatabase()
    return db.query.redemptions.findMany({
      where: (t, { eq: e }) => e(t.streamId, streamId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    })
  }

  static findByStreamerId(streamerId: string, limit = 100, offset = 0) {
    const db = useDatabase()
    return db.query.redemptions.findMany({
      where: (t, { eq: e }) => e(t.streamerId, streamerId),
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
      offset,
    })
  }

  static async sumByStreamId(streamId: string) {
    const db = useDatabase()
    const result = await db.select({
      totalCost: sql<number>`coalesce(sum(${tables.redemptions.rewardCost}), 0)`,
      count: sql<number>`count(*)`,
    })
      .from(tables.redemptions)
      .where(eq(tables.redemptions.streamId, streamId))
    return { totalCost: Number(result[0]?.totalCost ?? 0), count: Number(result[0]?.count ?? 0) }
  }

  static async sumByStreamerId(streamerId: string) {
    const db = useDatabase()
    const result = await db.select({
      totalCost: sql<number>`coalesce(sum(${tables.redemptions.rewardCost}), 0)`,
      count: sql<number>`count(*)`,
    })
      .from(tables.redemptions)
      .where(eq(tables.redemptions.streamerId, streamerId))
    return { totalCost: Number(result[0]?.totalCost ?? 0), count: Number(result[0]?.count ?? 0) }
  }
}
