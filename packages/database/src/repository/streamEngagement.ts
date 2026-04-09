import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamEngagementRepository {
  static async findOrCreate(streamId: string, profileId: string) {
    const db = useDatabase()
    const existing = await db.query.streamEngagements.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamId, streamId), e(t.profileId, profileId)),
    })
    if (existing) {
      return existing
    }

    const [created] = await db.insert(tables.streamEngagements)
      .values({ streamId, profileId })
      .returning()
    return created!
  }

  static findByStreamAndProfile(streamId: string, profileId: string) {
    const db = useDatabase()
    return db.query.streamEngagements.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamId, streamId), e(t.profileId, profileId)),
    })
  }

  static markTier1(streamId: string, profileId: string) {
    const db = useDatabase()
    return db.update(tables.streamEngagements)
      .set({
        tier1Claimed: true,
        tokensAwarded: sql`${tables.streamEngagements.tokensAwarded} + 1`,
      })
      .where(and(
        eq(tables.streamEngagements.streamId, streamId),
        eq(tables.streamEngagements.profileId, profileId),
      ))
      .returning()
  }

  static markTier2(streamId: string, profileId: string) {
    const db = useDatabase()
    return db.update(tables.streamEngagements)
      .set({
        tier2Claimed: true,
        tokensAwarded: sql`${tables.streamEngagements.tokensAwarded} + 1`,
      })
      .where(and(
        eq(tables.streamEngagements.streamId, streamId),
        eq(tables.streamEngagements.profileId, profileId),
      ))
      .returning()
  }

  static async sumTokensByStreamIds(streamIds: string[]) {
    const db = useDatabase()
    const rows = await db
      .select({
        streamId: tables.streamEngagements.streamId,
        total: sum(tables.streamEngagements.tokensAwarded).mapWith(Number),
      })
      .from(tables.streamEngagements)
      .where(inArray(tables.streamEngagements.streamId, streamIds))
      .groupBy(tables.streamEngagements.streamId)

    return rows
  }
}
