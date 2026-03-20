import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class TwitchAccessTokenRepository {
  static findByUserId(userId: string) {
    const db = useDatabase()
    return db.query.twitchAccessTokens.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    })
  }

  static create(data: InferInsertModel<typeof tables.twitchAccessTokens>) {
    const db = useDatabase()
    return db.insert(tables.twitchAccessTokens).values(data).returning()
  }

  static updateByUserId(userId: string, data: Partial<InferInsertModel<typeof tables.twitchAccessTokens>>) {
    const db = useDatabase()
    return db.update(tables.twitchAccessTokens)
      .set(data)
      .where(eq(tables.twitchAccessTokens.userId, userId))
  }
}
