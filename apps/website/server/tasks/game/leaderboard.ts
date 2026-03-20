import { createId } from '@paralleldrive/cuid2'

const logger = useLogger('game:leaderboard')
const woodlandLeaderboardId = 'jfb1d82u6brqjttrc2v8bs15'

export default defineTask({
  meta: {
    name: 'game:leaderboard',
    description: 'Recalculate members positions on all Leaderboards',
  },
  async run() {
    // Only run in production
    if (import.meta.dev) {
      logger.info('Task not run in dev mode')
      return { result: true }
    }

    try {
      await createAndUpdateMembersInWoodlandsLeaderboard()

      const leaderboards = await db.leaderboard.findAllWithMembers()

      for (const lb of leaderboards) {
        // Sort members by points descending
        const sortedMembers = [...lb.members].sort((a, b) => b.points - a.points)

        // update all members positions: by points
        for (const [index, member] of sortedMembers.entries()) {
          await db.leaderboardMember.updatePosition(member.id, index + 1)
        }
      }
    } catch (error) {
      errorResolver(error)
    }

    logger.success('Done: Recalculate members positions on all Leaderboards')

    return { result: true }
  },
})

async function createAndUpdateMembersInWoodlandsLeaderboard() {
  const profiles = await db.profile.findAllWithPointsDesc()

  const leaderboard = await db.leaderboard.findWithMembers(woodlandLeaderboardId)

  // Check if members exist and have actual points
  for (const profile of profiles) {
    const member = leaderboard?.members.find((member: { profileId: string }) => member.profileId === profile.id)
    if (!member) {
      // Create
      await db.leaderboardMember.create({
        id: createId(),
        leaderboardId: woodlandLeaderboardId,
        profileId: profile.id,
        points: profile.points,
        position: 0,
      })

      continue
    }

    // Update
    if (member.points !== profile.points) {
      await db.leaderboardMember.updatePoints(member.id, profile.points)
    }
  }
}
