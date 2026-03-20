import { useDatabase } from '../database'

export class LeaderboardRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.leaderboards.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findWithMembers(id: string, limit = 500) {
    const db = useDatabase()
    return db.query.leaderboards.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        members: {
          orderBy: (t, { asc }) => asc(t.position),
          limit,
          with: {
            profile: true,
          },
        },
      },
    })
  }

  static findAllWithMembers() {
    const db = useDatabase()
    return db.query.leaderboards.findMany({
      with: {
        members: true,
      },
    })
  }
}
