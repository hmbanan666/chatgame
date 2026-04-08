import { and, count, eq, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerViewerRepository {
  static findByStreamerAndProfile(streamerId: string, profileId: string) {
    const db = useDatabase()
    return db.query.streamerViewers.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamerId, streamerId), e(t.profileId, profileId)),
    })
  }

  static async findOrCreate(streamerId: string, profileId: string) {
    const db = useDatabase()
    const existing = await db.query.streamerViewers.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamerId, streamerId), e(t.profileId, profileId)),
    })
    if (existing) {
      return { viewer: existing, isNew: false }
    }

    const [viewer] = await db.insert(tables.streamerViewers)
      .values({ streamerId, profileId })
      .returning()

    return { viewer: viewer!, isNew: true }
  }

  static updateLastSeen(id: string) {
    const db = useDatabase()
    return db.update(tables.streamerViewers)
      .set({
        lastSeenAt: new Date(),
        messagesCount: sql`${tables.streamerViewers.messagesCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tables.streamerViewers.id, id))
  }

  static addWatchTime(id: string, minutes: number) {
    const db = useDatabase()
    return db.update(tables.streamerViewers)
      .set({
        watchTimeMin: sql`${tables.streamerViewers.watchTimeMin} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(tables.streamerViewers.id, id))
  }

  static async findViewersByStreamer(streamerId: string, options: {
    search?: string
    sortBy?: 'lastSeenAt' | 'messagesCount' | 'watchTimeMin'
    limit?: number
    offset?: number
  } = {}) {
    const db = useDatabase()
    const { search, sortBy = 'lastSeenAt', limit = 50, offset = 0 } = options

    const conditions = [eq(tables.streamerViewers.streamerId, streamerId)]
    if (search) {
      conditions.push(sql`lower(${tables.profiles.userName}) like ${`%${search.toLowerCase()}%`}`)
    }

    const rows = await db
      .select({
        id: tables.streamerViewers.id,
        lastSeenAt: tables.streamerViewers.lastSeenAt,
        messagesCount: tables.streamerViewers.messagesCount,
        watchTimeMin: tables.streamerViewers.watchTimeMin,
        createdAt: tables.streamerViewers.createdAt,
        profileId: tables.streamerViewers.profileId,
        userName: tables.profiles.userName,
        twitchId: tables.profiles.twitchId,
        level: tables.profiles.level,
        xp: tables.profiles.xp,
        coins: tables.profiles.coins,
        coupons: tables.profiles.coupons,
        activeEditionId: tables.profiles.activeEditionId,
      })
      .from(tables.streamerViewers)
      .innerJoin(tables.profiles, eq(tables.streamerViewers.profileId, tables.profiles.id))
      .where(and(...conditions))
      .orderBy(sql`${tables.streamerViewers[sortBy]} desc`)
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(tables.streamerViewers)
      .innerJoin(tables.profiles, eq(tables.streamerViewers.profileId, tables.profiles.id))
      .where(and(...conditions))

    return { rows, total: totalResult[0]?.count ?? 0 }
  }

  static findRandomNames(streamerId: string, limit = 20) {
    const db = useDatabase()
    return db
      .select({ name: tables.profiles.userName })
      .from(tables.streamerViewers)
      .innerJoin(tables.profiles, eq(tables.streamerViewers.profileId, tables.profiles.id))
      .where(eq(tables.streamerViewers.streamerId, streamerId))
      .orderBy(sql`${tables.streamerViewers.lastSeenAt} desc`)
      .limit(limit)
  }
}
