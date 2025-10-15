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
      logger.info('Storage not connected in dev mode')
      return { result: true }
    }

    try {
      await createAndUpdateMembersInWoodlandsLeaderboard()

      const leaderboards = await prisma.leaderboard.findMany({
        include: {
          members: {
            orderBy: {
              points: 'desc',
            },
          },
        },
      })

      for (const lb of leaderboards) {
        // update all members positions: by points
        for (const [index, member] of lb.members.entries()) {
          await prisma.leaderboardMember.update({
            where: { id: member.id },
            data: {
              position: index + 1,
            },
          })
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
  // Main lb
  const profiles = await prisma.profile.findMany({
    where: { points: { gt: 0 } },
    orderBy: {
      points: 'desc',
    },
  })
  const leaderboard = await prisma.leaderboard.findUnique({
    where: { id: woodlandLeaderboardId },
    include: {
      members: {
        orderBy: {
          points: 'desc',
        },
      },
    },
  })

  // Check if members exist and have actual points
  for (const profile of profiles) {
    const member = leaderboard?.members.find((member) => member.profileId === profile.id)
    if (!member) {
      // Create
      await prisma.leaderboardMember.create({
        data: {
          id: createId(),
          leaderboardId: woodlandLeaderboardId,
          profileId: profile.id,
          points: profile.points,
          position: 0,
        },
      })

      continue
    }

    // Update
    if (member.points !== profile.points) {
      await prisma.leaderboardMember.update({
        where: { id: member.id },
        data: {
          points: profile.points,
        },
      })
    }
  }
}
