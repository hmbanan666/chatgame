import { createId } from '@paralleldrive/cuid2'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class PlayerRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.players.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static async findOrCreate({ userName, profileId }: { userName: string, profileId: string }) {
    const db = useDatabase()
    let player = await db.query.players.findFirst({
      where: (t, { eq }) => eq(t.profileId, profileId),
    })
    if (!player) {
      const playerId = createId()

      const [newPlayer] = await db.insert(tables.players).values({
        id: playerId,
        name: userName,
        inventoryId: playerId,
        profileId,
      }).returning()

      player = newPlayer
    }

    return player
  }
}
