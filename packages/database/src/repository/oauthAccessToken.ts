import type { InferInsertModel } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export type OAuthProvider = 'twitch' | 'donationalerts'

export class OAuthAccessTokenRepository {
  static findByUserId(userId: string, provider: OAuthProvider) {
    const db = useDatabase()
    return db.query.oauthAccessTokens.findFirst({
      where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.provider, provider)),
    })
  }

  static create(data: InferInsertModel<typeof tables.oauthAccessTokens>) {
    const db = useDatabase()
    return db.insert(tables.oauthAccessTokens).values(data).returning()
  }

  static updateByUserId(
    userId: string,
    provider: OAuthProvider,
    data: Partial<InferInsertModel<typeof tables.oauthAccessTokens>>,
  ) {
    const db = useDatabase()
    return db.update(tables.oauthAccessTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(tables.oauthAccessTokens.userId, userId),
        eq(tables.oauthAccessTokens.provider, provider),
      ))
  }

  static deleteByUserId(userId: string, provider: OAuthProvider) {
    const db = useDatabase()
    return db.delete(tables.oauthAccessTokens)
      .where(and(
        eq(tables.oauthAccessTokens.userId, userId),
        eq(tables.oauthAccessTokens.provider, provider),
      ))
  }
}
