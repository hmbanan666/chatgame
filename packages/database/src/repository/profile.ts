import { createId } from '@paralleldrive/cuid2'
import { and, count, eq, gte, lt, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class ProfileRepository {
  static async count() {
    const db = useDatabase()
    const result = await db.select({ count: count() }).from(tables.profiles)
    return result[0]?.count ?? 0
  }

  static find(id: string) {
    const db = useDatabase()
    return db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findByTwitchId(twitchId: string) {
    const db = useDatabase()
    return db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.twitchId, twitchId),
    })
  }

  static findWithCharacterEditions(id: string) {
    const db = useDatabase()
    return db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        characterEditions: {
          with: {
            character: true,
          },
        },
      },
    })
  }

  static findByUserName(userName: string) {
    const db = useDatabase()
    return db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.userName, userName),
      with: {
        characterEditions: {
          with: {
            character: true,
          },
        },
      },
    })
  }

  static async findOrCreate({ userId, userName }: { userId: string, userName: string }) {
    const db = useDatabase()
    let profile = await db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.twitchId, userId),
    })
    if (!profile) {
      const editionId = createId()

      const newProfile = {
        id: createId(),
        twitchId: userId,
        userName,
        activeEditionId: editionId,
        mana: 10,
      }

      const [createdProfile] = await db.insert(tables.profiles).values(newProfile).returning()

      // Twitchy
      await db.insert(tables.characterEditions).values({
        id: editionId,
        profileId: createdProfile!.id,
        characterId: 'staoqh419yy3k22cbtm9wquc',
      })

      const [updatedProfile] = await db.update(tables.profiles)
        .set({ activeEditionId: editionId })
        .where(eq(tables.profiles.id, createdProfile!.id))
        .returning()

      profile = updatedProfile
    }

    return profile
  }

  static updateManaOnAll() {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ mana: sql`${tables.profiles.mana} + 2` })
      .where(lt(tables.profiles.mana, 10))
  }

  static addCoins(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ coins: sql`${tables.profiles.coins} + ${amount}` })
      .where(eq(tables.profiles.id, id))
      .returning()
  }

  static addXp(id: string, amount = 1) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ xp: sql`${tables.profiles.xp} + ${amount}` })
      .where(eq(tables.profiles.id, id))
  }

  static addWatchTime(id: string, minutes: number) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ watchTimeMin: sql`${tables.profiles.watchTimeMin} + ${minutes}` })
      .where(eq(tables.profiles.id, id))
  }

  static setActiveEdition(id: string, editionId: string) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ activeEditionId: editionId })
      .where(eq(tables.profiles.id, id))
  }

  static addLevel(id: string) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ level: sql`${tables.profiles.level} + 1` })
      .where(eq(tables.profiles.id, id))
  }

  static deductMana(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ mana: sql`${tables.profiles.mana} - ${amount}` })
      .where(eq(tables.profiles.id, id))
  }

  static deductCoupons(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ coupons: sql`${tables.profiles.coupons} - ${amount}` })
      .where(eq(tables.profiles.id, id))
  }

  static async findTop(sortBy: 'level' | 'coins' | 'coupons' | 'watchTimeMin' = 'level', limit = 50) {
    const db = useDatabase()
    const column = tables.profiles[sortBy]
    return db.query.profiles.findMany({
      columns: {
        id: true,
        userName: true,
        level: true,
        xp: true,
        coins: true,
        coupons: true,
        watchTimeMin: true,
        activeEditionId: true,
      },
      with: {
        characterEditions: {
          with: {
            character: {
              columns: {
                codename: true,
              },
            },
          },
          columns: {
            id: true,
            characterId: true,
          },
        },
      },
      orderBy: (_, { desc }) => desc(column),
      limit,
    })
  }

  static async getPlaceInTopByCoupons(profileId: string) {
    const db = useDatabase()
    const topProfiles = await db.query.profiles.findMany({
      orderBy: (t, { desc }) => desc(t.coupons),
      limit: 1000,
    })

    return topProfiles.findIndex((profile) => profile.id === profileId) + 1
  }

  static async findAllStreamers(type: string) {
    const db = useDatabase()
    const result = await db.query.profiles.findMany({
      with: { twitchTokens: true },
    })
    return result.filter(
      (p) => p.twitchTokens?.some((t) => t.status === 'ACTIVE' && t.type === type),
    )
  }

  static activateStreamer(id: string) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({
        isStreamer: true,
        updatedAt: new Date(),
      })
      .where(eq(tables.profiles.id, id))
  }

  static deductCoinsAtomic(id: string, amount: number) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ coins: sql`${tables.profiles.coins} - ${amount}`, updatedAt: new Date() })
      .where(and(eq(tables.profiles.id, id), gte(tables.profiles.coins, amount)))
      .returning()
  }

  static unlockPremium(id: string) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ streamerPremiumPaidAt: new Date(), updatedAt: new Date() })
      .where(eq(tables.profiles.id, id))
  }

  static async addStreamerEarnings(id: string, amount: number, weeklyLimit = 200) {
    const db = useDatabase()
    const profile = await db.query.profiles.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      columns: { streamerCoinsEarnedWeekly: true, streamerWeekResetAt: true },
    })
    if (!profile) {
      return null
    }

    const now = new Date()
    let weeklyEarned = profile.streamerCoinsEarnedWeekly
    let resetAt = profile.streamerWeekResetAt

    // Reset if week has passed or never set
    if (!resetAt || now.getTime() - resetAt.getTime() >= 7 * 24 * 60 * 60 * 1000) {
      weeklyEarned = 0
      resetAt = now
    }

    const actual = Math.min(amount, weeklyLimit - weeklyEarned)
    if (actual <= 0) {
      return { added: 0, weeklyTotal: weeklyEarned, weeklyLimit, weekResetsAt: new Date(resetAt.getTime() + 7 * 24 * 60 * 60 * 1000) }
    }

    await db.update(tables.profiles)
      .set({
        coins: sql`${tables.profiles.coins} + ${actual}`,
        streamerCoinsEarnedWeekly: weeklyEarned + actual,
        streamerWeekResetAt: resetAt,
        updatedAt: now,
      })
      .where(eq(tables.profiles.id, id))

    return {
      added: actual,
      weeklyTotal: weeklyEarned + actual,
      weeklyLimit,
      weekResetsAt: new Date(resetAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    }
  }

  static findActiveStreamers() {
    const db = useDatabase()
    return db.query.profiles.findMany({
      where: (t, { eq }) => eq(t.isStreamer, true),
    })
  }

  static updateStreamerSettings(id: string, data: { donationAlertsUserId?: string | null }) {
    const db = useDatabase()
    return db.update(tables.profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.profiles.id, id))
  }

  static async getTokensCount(type: string) {
    const db = useDatabase()
    const result = await db.select({ count: count() })
      .from(tables.twitchTokens)
      .where(and(
        eq(tables.twitchTokens.status, 'ACTIVE'),
        eq(tables.twitchTokens.type, type),
      ))
    return result[0]?.count ?? 0
  }
}
