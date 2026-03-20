import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class TwitchTokenRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.twitchTokens.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findByProfile(profileId: string) {
    const db = useDatabase()
    return db.query.twitchTokens.findMany({
      where: (t, { eq }) => eq(t.profileId, profileId),
    })
  }

  static findOnlineSince(since: Date) {
    const db = useDatabase()
    return db.query.twitchTokens.findMany({
      where: (t, { gte }) => gte(t.onlineAt, since),
      with: {
        profile: true,
      },
    })
  }

  static findByProfileAndType(profileId: string, type: string) {
    const db = useDatabase()
    return db.query.twitchTokens.findFirst({
      where: (t, { eq, and }) => and(eq(t.profileId, profileId), eq(t.type, type)),
    })
  }

  static create(data: InferInsertModel<typeof tables.twitchTokens>) {
    const db = useDatabase()
    return db.insert(tables.twitchTokens).values(data).returning()
  }

  static updateOnlineAt(id: string) {
    const db = useDatabase()
    return db.update(tables.twitchTokens)
      .set({ onlineAt: new Date() })
      .where(eq(tables.twitchTokens.id, id))
  }
}
