import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerCurrencyRepository {
  static findByStreamerId(streamerId: string) {
    const db = useDatabase()
    return db.query.streamerCurrencies.findFirst({
      where: (t, { eq: e }) => e(t.streamerId, streamerId),
      with: { character: true },
    })
  }

  static findByCharacterId(characterId: string) {
    const db = useDatabase()
    return db.query.streamerCurrencies.findFirst({
      where: (t, { eq: e }) => e(t.characterId, characterId),
    })
  }

  static async upsert(streamerId: string, data: { name: string, emoji: string, characterPrice?: number, characterId?: string | null }) {
    const db = useDatabase()
    const existing = await StreamerCurrencyRepository.findByStreamerId(streamerId)

    if (existing) {
      const [updated] = await db.update(tables.streamerCurrencies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.streamerCurrencies.id, existing.id))
        .returning()
      return updated!
    }

    const [created] = await db.insert(tables.streamerCurrencies)
      .values({ streamerId, ...data })
      .returning()
    return created!
  }
}
