import { pluralizationRu } from '#shared/utils/pluralize'
import { sendAlertMessage, sendGameMessage } from '~~/server/api/websocket'
import { chargeRooms } from '~~/server/core/charge'
import { getLevelingService } from '~~/server/core/leveling/service'
import { dictionary } from '~~/server/core/locale'
import { getViewerQuestService } from '~~/server/core/quest'

export class TwitchService {
  readonly #roomId: string
  readonly #streamerId: string
  #streamStartedAt: Date = new Date()
  #seenThisStream = new Set<string>()

  constructor(roomId: string, streamerId: string) {
    this.#roomId = roomId
    this.#streamerId = streamerId
  }

  setStreamStartedAt(date: Date) {
    this.#streamStartedAt = date
    this.#seenThisStream.clear()
  }

  async handleMessage({
    userName,
    userId,
    text,
  }: {
    userName: string
    userId: string
    text: string
  }) {
    const strings = text.split(' ')
    const firstWord = strings[0] ?? ''
    const firstChar = firstWord.charAt(0)
    const possibleCommand = firstWord.substring(1)
    const otherStrings = strings.toSpliced(0, 1)
    const firstParam = otherStrings[0] ?? ''

    const profile = await db.profile.findByTwitchId(userId)
    if (!profile) {
      return
    }

    const { player, isNew } = await db.player.findOrCreate({ profileId: profile.id, userName })
    if (!player) {
      return
    }

    // Resolve character
    let codename = 'twitchy'
    if (profile.activeEditionId) {
      const edition = await db.characterEdition.findWithCharacter(profile.activeEditionId)
      if (edition?.character?.codename) {
        codename = edition.character.codename
      }
    }

    const chatAnnouncements: string[] = []

    // New viewer alert
    if (isNew) {
      sendAlertMessage(this.#roomId, {
        type: 'NEW_VIEWER',
        data: {
          userName,
          codename,
        },
      })
      chatAnnouncements.push(`Добро пожаловать, ${userName}! Пиши в чат, качай уровень и собирай персонажей на chatgame.space`)
    }

    // Viewer quest (skip for streamer)
    if (userId !== this.#roomId) {
      const questService = getViewerQuestService(this.#streamerId, this.#roomId)
      await questService.tryAssignQuest(profile.id, userName, codename)
      const questResult = await questService.trackMessage(profile.id)
      if (questResult.completed) {
        chatAnnouncements.push(`${questResult.userName} выполнил квест! +${questResult.reward} ${pluralizationRu(questResult.reward ?? 0, ['монета', 'монеты', 'монет'])}`)
      }
    }

    // XP gain + watch time
    const leveling = getLevelingService()
    const levelResult = await leveling.onMessage({
      profileId: profile.id,
      activeEditionId: profile.activeEditionId,
      userName,
      codename,
      roomId: this.#roomId,
      lastActionAt: player.lastActionAt,
    })

    if (levelResult.leveledUp && levelResult.newLevel) {
      chatAnnouncements.push(`${userName} достиг уровня ${levelResult.newLevel}!`)
    }

    // Update last action timestamp for watch time tracking
    await db.player.updateLastActionAt(player.id)

    // Refetch profile after XP gain (level may have changed)
    const updatedProfile = await db.profile.find(profile.id)

    // Stream Journey
    const isFirstThisStream = !this.#seenThisStream.has(userId)
    this.#seenThisStream.add(userId)

    sendGameMessage(this.#roomId, {
      event: 'newPlayerMessage',
      data: {
        text,
        isFirstThisStream,
        player: {
          id: userId,
          name: userName,
          codename,
          level: updatedProfile?.level ?? profile.level,
        },
      },
    })

    if (firstChar === '!' && possibleCommand) {
      switch (possibleCommand) {
        case 'купон':
        case 'coupon':
          return this.handleCouponActivation(firstParam, player.profileId, userName, codename)
        case 'инвентарь':
        case 'inventory':
          return this.handleInventoryCommand(player.profileId)
        case 'гитхаб':
        case 'github':
        case 'git':
          return this.handleGitHubCommand()
        case 'сальто':
        case 'flip':
          return this.handleFlipCommand()
      }
    }

    if (chatAnnouncements.length > 0) {
      return {
        ok: true,
        message: chatAnnouncements.join(' | '),
      }
    }
  }

  async handleInventoryCommand(profileId: string) {
    const profile = await db.profile.find(profileId)
    if (!profile) {
      return {
        ok: false,
        message: null,
      }
    }

    const t = dictionary('ru')
    return {
      ok: true,
      message: t.twitch.inventory.replace('{n}', String(profile.coupons)),
    }
  }

  handleGitHubCommand() {
    const t = dictionary('ru')
    return {
      ok: true,
      message: t.twitch.github,
    }
  }

  handleFlipCommand() {
    sendGameMessage(this.#roomId, { event: 'wagonFlip' })
  }

  async handleCouponActivation(id: string, profileId: string, userName: string, codename: string) {
    const status = await this.#activateCouponByCommand(id, profileId)

    const t = dictionary('ru')
    if (status === 'OK') {
      const profile = await db.profile.find(profileId)

      const session = chargeRooms.find((r) => r.id === this.#roomId)
      if (session) {
        session.stats.couponsTaken++
      }

      sendAlertMessage(this.#roomId, {
        type: 'COUPON_TAKEN',
        data: {
          userName,
          codename,
          totalCoupons: profile?.coupons ?? 0,
        },
      })

      return {
        ok: true,
        message: t.twitch.coupon.success,
      }
    }
    if (status === 'TIME_LIMIT') {
      return {
        ok: false,
        message: t.twitch.coupon.timeLimit,
      }
    }
    if (status === 'TAKEN_ALREADY') {
      return {
        ok: false,
        message: t.twitch.coupon.takenAlready,
      }
    }
    if (status === 'NOT_FOUND') {
      return {
        ok: false,
        message: null,
      }
    }
  }

  async #activateCouponByCommand(
    id: string,
    profileId: string,
  ): Promise<'OK' | 'TAKEN_ALREADY' | 'TIME_LIMIT' | 'NOT_FOUND'> {
    const isAlreadyToday = await db.coupon.findByProfileSince(profileId, this.#streamStartedAt)
    if (isAlreadyToday) {
      return 'TIME_LIMIT'
    }

    const coupon = await db.coupon.findByActivationCommandSince(id, this.#streamStartedAt)
    if (!coupon) {
      return 'NOT_FOUND'
    }
    if (coupon.profileId) {
      return 'TAKEN_ALREADY'
    }

    await db.coupon.update(coupon.id, { profileId, status: 'TAKEN' })
    await db.profile.deductCoupons(profileId, -1)

    return 'OK'
  }
}
