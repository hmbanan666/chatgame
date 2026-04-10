import type { InferInsertModel } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { and, eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export type OAuthProvider = 'twitch' | 'donationalerts'

type OAuthTokenInsert = InferInsertModel<typeof tables.oauthAccessTokens>

export interface OAuthTokenUpsertData {
  accessToken: string
  refreshToken: string
  scope?: string[] | null
  expiresIn?: number | null
  obtainmentTimestamp: string
}

export class OAuthAccessTokenRepository {
  static findByUserId(userId: string, provider: OAuthProvider) {
    const db = useDatabase()
    return db.query.oauthAccessTokens.findFirst({
      where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.provider, provider)),
    })
  }

  static create(data: OAuthTokenInsert) {
    const db = useDatabase()
    return db.insert(tables.oauthAccessTokens).values(data).returning()
  }

  static updateByUserId(
    userId: string,
    provider: OAuthProvider,
    data: Partial<OAuthTokenInsert>,
  ) {
    const db = useDatabase()
    return db.update(tables.oauthAccessTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(tables.oauthAccessTokens.userId, userId),
        eq(tables.oauthAccessTokens.provider, provider),
      ))
  }

  /**
   * Race-safe upsert based on the unique (provider, user_id) constraint.
   * Returns the resulting row, whether newly inserted or updated.
   */
  static async upsertByUserId(
    userId: string,
    provider: OAuthProvider,
    data: OAuthTokenUpsertData,
  ) {
    const db = useDatabase()
    const now = new Date()
    const [row] = await db.insert(tables.oauthAccessTokens)
      .values({
        id: createId(),
        provider,
        userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        scope: data.scope ?? null,
        expiresIn: data.expiresIn ?? null,
        obtainmentTimestamp: data.obtainmentTimestamp,
      })
      .onConflictDoUpdate({
        target: [tables.oauthAccessTokens.provider, tables.oauthAccessTokens.userId],
        set: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          scope: data.scope ?? null,
          expiresIn: data.expiresIn ?? null,
          obtainmentTimestamp: data.obtainmentTimestamp,
          updatedAt: now,
        },
      })
      .returning()
    return row!
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
