import { createId } from '@paralleldrive/cuid2'
import { and, count, eq, lt, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class ProfileRepository {
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
