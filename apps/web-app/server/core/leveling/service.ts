import { sendAlertMessage } from '~~/server/api/websocket'
import { getXpForLevel } from '~~/server/utils/level'

const MAX_DELTA_MIN = 10

interface MessageContext {
  profileId: string
  activeEditionId: string | null
  userName: string
  codename: string
  roomId: string
  lastActionAt: Date
}

export class LevelingService {
  /** Add XP, track watch time, check level-ups */
  async onMessage(ctx: MessageContext) {
    const deltaMin = this.calcDeltaMin(ctx.lastActionAt)

    await Promise.all([
      this.addProfileXp(ctx),
      ctx.activeEditionId ? this.addCharacterXp(ctx.activeEditionId) : Promise.resolve(),
      deltaMin > 0 ? this.trackWatchTime(ctx.profileId, ctx.activeEditionId, deltaMin) : Promise.resolve(),
    ])
  }

  private calcDeltaMin(lastActionAt: Date): number {
    const deltaMs = Date.now() - lastActionAt.getTime()
    const deltaMin = Math.floor(deltaMs / 60_000)
    return Math.min(deltaMin, MAX_DELTA_MIN)
  }

  private async trackWatchTime(profileId: string, activeEditionId: string | null, minutes: number) {
    await db.profile.addWatchTime(profileId, minutes)
    if (activeEditionId) {
      await db.characterEdition.addPlayTime(activeEditionId, minutes)
    }
  }

  private async addProfileXp(ctx: MessageContext) {
    await db.profile.addXp(ctx.profileId)

    const profile = await db.profile.find(ctx.profileId)
    if (!profile) {
      return
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
    }
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
