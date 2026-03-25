import { getXpForLevel } from '#shared/utils/level'
import { sendAlertMessage } from '~~/server/api/websocket'

const MAX_DELTA_MIN = 10

interface MessageContext {
  profileId: string
  activeEditionId: string | null
  userName: string
  codename: string
  roomId: string
  lastActionAt: Date | null
}

export interface LevelingResult {
  leveledUp: boolean
  newLevel?: number
}

export class LevelingService {
  /** Add XP, track watch time, check level-ups */
  async onMessage(ctx: MessageContext): Promise<LevelingResult> {
    const deltaMin = this.calcDeltaMin(ctx.lastActionAt)

    const [profileResult] = await Promise.all([
      this.addProfileXp(ctx),
      deltaMin > 0 ? db.profile.addWatchTime(ctx.profileId, deltaMin) : Promise.resolve(),
    ])

    // Character edition updates run sequentially to avoid lock contention on the same row
    if (ctx.activeEditionId) {
      await this.addCharacterXp(ctx.activeEditionId)
      if (deltaMin > 0) {
        await db.characterEdition.addPlayTime(ctx.activeEditionId, deltaMin)
      }
    }

    return profileResult ?? { leveledUp: false }
  }

  private calcDeltaMin(lastActionAt: Date | null): number {
    if (!lastActionAt) {
      return 0
    }
    const deltaMs = Date.now() - lastActionAt.getTime()
    const deltaMin = Math.floor(deltaMs / 60_000)
    return Math.min(deltaMin, MAX_DELTA_MIN)
  }

  private async addProfileXp(ctx: MessageContext): Promise<LevelingResult> {
    await db.profile.addXp(ctx.profileId)

    const profile = await db.profile.find(ctx.profileId)
    if (!profile) {
      return { leveledUp: false }
    }

    const requiredXp = getXpForLevel(profile.level + 1)
    if (profile.xp >= requiredXp) {
      const newLevel = profile.level + 1
      const reward = 1

      await db.profile.addLevel(ctx.profileId)
      await db.profile.addCoins(ctx.profileId, reward)

      sendAlertMessage(ctx.roomId, {
        type: 'LEVEL_UP',
        data: {
          userName: ctx.userName,
          codename: ctx.codename,
          level: newLevel,
          reward,
        },
      })

      return { leveledUp: true, newLevel }
    }

    return { leveledUp: false }
  }

  private async addCharacterXp(editionId: string) {
    await db.characterEdition.addXp(editionId)

    const edition = await db.characterEdition.findWithCharacter(editionId)
    if (!edition) {
      return
    }

    const requiredXp = getXpForLevel(edition.level + 1)
    if (edition.xp >= requiredXp) {
      await db.characterEdition.addLevel(editionId)
    }
  }
}

let levelingService: LevelingService | undefined

export function getLevelingService() {
  if (!levelingService) {
    levelingService = new LevelingService()
  }
  return levelingService
}
