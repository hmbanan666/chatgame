import { and, eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerNoteRepository {
  static findByStreamerAndProfile(streamerId: string, profileId: string) {
    const db = useDatabase()
    return db.query.streamerNotes.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.streamerId, streamerId), e(t.profileId, profileId)),
    })
  }

  static async upsert(streamerId: string, profileId: string, text: string) {
    const db = useDatabase()
    const existing = await db.select({ id: tables.streamerNotes.id })
      .from(tables.streamerNotes)
      .where(and(
        eq(tables.streamerNotes.streamerId, streamerId),
        eq(tables.streamerNotes.profileId, profileId),
      ))
      .limit(1)

    if (existing.length > 0) {
      return db.update(tables.streamerNotes)
        .set({ text, updatedAt: new Date() })
        .where(eq(tables.streamerNotes.id, existing[0]!.id))
        .returning()
    }

    return db.insert(tables.streamerNotes)
      .values({ streamerId, profileId, text })
      .returning()
  }
}
