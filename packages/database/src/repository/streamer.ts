import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class StreamerRepository {
  static findAll() {
    const db = useDatabase()
    return db.query.streamers.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
    })
  }

  static findByTwitchChannelId(twitchChannelId: string) {
    const db = useDatabase()
    return db.query.streamers.findFirst({
      where: (t, { eq }) => eq(t.twitchChannelId, twitchChannelId),
    })
  }

  static update(id: string, data: { isActive?: boolean, twitchChannelName?: string, donationAlertsUserId?: string | null }) {
    const db = useDatabase()
    return db.update(tables.streamers)
      .set(data)
      .where(eq(tables.streamers.id, id))
  }
}
