import { and, eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerTagRepository {
  static findByStreamer(streamerId: string) {
    const db = useDatabase()
    return db.query.streamerTags.findMany({
      where: (t, { eq: e }) => e(t.streamerId, streamerId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    })
  }

  static find(id: string) {
    const db = useDatabase()
    return db.query.streamerTags.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    })
  }

  static async create(data: { streamerId: string, name: string, color: string }) {
    const db = useDatabase()
    const [row] = await db.insert(tables.streamerTags)
      .values({
        streamerId: data.streamerId,
        name: data.name,
        color: data.color,
      })
      .returning()
    return row!
  }

  static async update(id: string, streamerId: string, data: { name?: string, color?: string }) {
    const db = useDatabase()
    const [row] = await db.update(tables.streamerTags)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(tables.streamerTags.id, id),
        eq(tables.streamerTags.streamerId, streamerId),
      ))
      .returning()
    return row ?? null
  }

  /**
   * Delete a tag and all viewer→tag links. Wrapped in a transaction so
   * both deletes happen atomically.
   */
  static async delete(id: string, streamerId: string) {
    const db = useDatabase()
    return db.transaction(async (tx) => {
      // Delete links first (no FK cascade in schema)
      await tx.delete(tables.streamerViewerTags)
        .where(eq(tables.streamerViewerTags.tagId, id))

      const [deleted] = await tx.delete(tables.streamerTags)
        .where(and(
          eq(tables.streamerTags.id, id),
          eq(tables.streamerTags.streamerId, streamerId),
        ))
        .returning()
      return deleted ?? null
    })
  }
}
