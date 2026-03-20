import { useDatabase } from '../database'

export class QuestRepository {
  static findAll() {
    const db = useDatabase()
    return db.query.quests.findMany({
      with: {
        rewards: true,
      },
    })
  }

  static findWithEditions(id: string) {
    const db = useDatabase()
    return db.query.quests.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        editions: {
          where: (t, { eq }) => eq(t.status, 'COMPLETED'),
          with: {
            profile: true,
          },
          orderBy: (t, { desc }) => desc(t.completedAt),
          limit: 50,
        },
        rewards: true,
        profile: true,
      },
    })
  }

  static findForProfile(profileId: string) {
    const db = useDatabase()
    return db.query.quests.findMany({
      with: {
        editions: {
          where: (t, { eq }) => eq(t.profileId, profileId),
        },
        rewards: true,
        profile: true,
      },
    })
  }
}
