import { eq, inArray } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerViewerTagRepository {
  /** Tag IDs attached to a single viewer. */
  static async findByViewer(streamerViewerId: string): Promise<string[]> {
    const db = useDatabase()
    const rows = await db.select({ tagId: tables.streamerViewerTags.tagId })
      .from(tables.streamerViewerTags)
      .where(eq(tables.streamerViewerTags.streamerViewerId, streamerViewerId))
    return rows.map((r) => r.tagId)
  }

  /**
   * Batch lookup: for a list of streamer_viewer ids, return a Map keyed by
   * the viewer id with an array of tagIds per viewer. Empty array if none.
   */
  static async findTagsByViewerIds(streamerViewerIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>()
    for (const id of streamerViewerIds) {
      result.set(id, [])
    }
    if (streamerViewerIds.length === 0) {
      return result
    }
    const db = useDatabase()
    const rows = await db.select({
      streamerViewerId: tables.streamerViewerTags.streamerViewerId,
      tagId: tables.streamerViewerTags.tagId,
    })
      .from(tables.streamerViewerTags)
      .where(inArray(tables.streamerViewerTags.streamerViewerId, streamerViewerIds))

    for (const row of rows) {
      const existing = result.get(row.streamerViewerId)
      if (existing) {
        existing.push(row.tagId)
      }
    }
    return result
  }

  /**
   * Replace all tags on a viewer with the given set. Atomic:
   * DELETE existing + INSERT new inside a transaction.
   */
  static async setTagsForViewer(streamerViewerId: string, tagIds: string[]) {
    const db = useDatabase()
    const unique = [...new Set(tagIds)]
    return db.transaction(async (tx) => {
      await tx.delete(tables.streamerViewerTags)
        .where(eq(tables.streamerViewerTags.streamerViewerId, streamerViewerId))

      if (unique.length > 0) {
        await tx.insert(tables.streamerViewerTags)
          .values(unique.map((tagId) => ({ streamerViewerId, tagId })))
      }
    })
  }
}
