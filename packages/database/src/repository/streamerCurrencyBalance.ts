import { and, eq, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerCurrencyBalanceRepository {
  static async findOrCreate(streamerId: string, profileId: string) {
    const db = useDatabase()
    const existing = await db.query.streamerCurrencyBalances.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamerId, streamerId), e(t.profileId, profileId)),
    })
    if (existing) {
      return existing
    }

    const [created] = await db.insert(tables.streamerCurrencyBalances)
      .values({ streamerId, profileId })
      .returning()
    return created!
  }

  static findByStreamerAndProfile(streamerId: string, profileId: string) {
    const db = useDatabase()
    return db.query.streamerCurrencyBalances.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamerId, streamerId), e(t.profileId, profileId)),
    })
  }

  static addTokens(streamerId: string, profileId: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.streamerCurrencyBalances)
      .set({
        balance: sql`${tables.streamerCurrencyBalances.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tables.streamerCurrencyBalances.streamerId, streamerId),
        eq(tables.streamerCurrencyBalances.profileId, profileId),
      ))
      .returning()
  }

  static findTopByStreamer(streamerId: string, limit = 20) {
    const db = useDatabase()
    return db
      .select({
        balance: tables.streamerCurrencyBalances.balance,
        profileId: tables.streamerCurrencyBalances.profileId,
        userName: tables.profiles.userName,
      })
      .from(tables.streamerCurrencyBalances)
      .innerJoin(tables.profiles, eq(tables.streamerCurrencyBalances.profileId, tables.profiles.id))
      .where(eq(tables.streamerCurrencyBalances.streamerId, streamerId))
      .orderBy(sql`${tables.streamerCurrencyBalances.balance} desc`)
      .limit(limit)
  }
}
