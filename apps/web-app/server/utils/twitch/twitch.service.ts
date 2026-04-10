import { pluralizationRu } from '#shared/utils/pluralize'
import { sendAlertMessage, sendGameMessage } from '~~/server/api/websocket'
import { getEngagementService } from '~~/server/core/engagement'
import { formatStreakGreeting, processDailyStreak } from '~~/server/core/leveling/dailyStreak'
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

  get streamerId() {
    return this.#streamerId
  }

  get seenCount() {
    return this.#seenThisStream.size
  }

  setStreamStartedAt(date: Date) {
    this.#streamStartedAt = date
    this.#seenThisStream.clear()
  }

  async addStreamerCoin(amount = 1): Promise<boolean> {
    const result = await db.profile.addStreamerEarnings(this.#streamerId, amount)
    return result !== null && result.added > 0
  }

  async handleMessage({
    userName,
    userId,
    text,
    replyTo,
  }: {
    userName: string
    userId: string
    text: string
    replyTo?: string
  }) {
    const strings = text.split(' ')
    const firstWord = strings[0] ?? ''
    const firstChar = firstWord.charAt(0)
    const possibleCommand = firstWord.substring(1)
    const profile = await db.profile.findOrCreate({ userId, userName })
    if (!profile) {
      return
    }

    // Is the streamer echoing their own IRC message? (we enabled
    // twitch.tv/echo-message so the dashboard sees bot/streamer messages).
    // Skip all viewer progression (quests, XP, streaks, engagement) — the
    // streamer shouldn't self-reward — but still forward to the dashboard
    // so cabinet/live chat panel shows the message.
    const isSelf = userId === this.#roomId

    // Resolve character
    let codename = 'twitchy'
    if (profile.activeEditionId) {
      const edition = await db.characterEdition.findWithCharacter(profile.activeEditionId)
      if (edition?.character?.codename) {
        codename = edition.character.codename
      }
    }

    const chatAnnouncements: string[] = []
    let viewer: Awaited<ReturnType<typeof db.streamerViewer.findOrCreate>>['viewer'] | null = null
    let levelResult: { leveledUp: boolean, newLevel?: number } = { leveledUp: false }

    if (!isSelf) {
      const { viewer: v, isNew } = await db.streamerViewer.findOrCreate(this.#streamerId, profile.id)
      if (!v) {
        return
      }
      viewer = v

      // Update last seen + message count
      await db.streamerViewer.updateLastSeen(viewer.id)

      // New viewer alert
      if (isNew) {
        sendAlertMessage(this.#roomId, {
          type: 'NEW_VIEWER',
          data: { userName, codename },
        })
        chatAnnouncements.push(`Добро пожаловать, ${userName}! Пиши в чат, качай уровень и собирай персонажей на chatgame.space`)
      }

      // Viewer quest
      const questService = getViewerQuestService(this.#streamerId, this.#roomId)
      await questService.tryAssignQuest(profile.id, userName, codename)
      const questResult = await questService.trackMessage(profile.id)
      if (questResult.completed) {
        chatAnnouncements.push(`${questResult.userName} выполнил квест! +${questResult.reward} ${pluralizationRu(questResult.reward ?? 0, ['монета', 'монеты', 'монет'])}`)
      }

      // XP gain + watch time (non-critical — don't crash message on failure)
      try {
        const leveling = getLevelingService()
        levelResult = await leveling.onMessage({
          profileId: profile.id,
          activeEditionId: profile.activeEditionId,
          userName,
          codename,
          roomId: this.#roomId,
          lastActionAt: viewer.lastSeenAt,
          streamerViewerId: viewer.id,
          addStreamerCoin: () => this.addStreamerCoin(),
        })
      } catch {
        // Lock timeout or DB error — skip XP, don't block chat
      }

      if (levelResult.leveledUp && levelResult.newLevel) {
        chatAnnouncements.push(`${userName} достиг уровня ${levelResult.newLevel}!`)
      }

      // Daily streak (global, per profile) — non-critical
      try {
        const streakOutcome = await processDailyStreak(profile.id, this.#roomId)
        const greeting = formatStreakGreeting(userName, streakOutcome)
        if (greeting) {
          chatAnnouncements.push(greeting)
        }
      } catch {
        // Don't block chat on streak errors
      }

      // Update last seen again after XP gain
      await db.streamerViewer.updateLastSeen(viewer.id)

      // Track viewer for streamer currency engagement
      const engagementService = getEngagementService(this.#streamerId)
      if (engagementService) {
        engagementService.trackViewer(profile.id)
      }
    }

    // Refetch profile after potential XP gain (level may have changed)
    const updatedProfile = await db.profile.find(profile.id)

    // Stream Journey
    const isFirstThisStream = !this.#seenThisStream.has(userId)
    this.#seenThisStream.add(userId)

    sendGameMessage(this.#roomId, {
      event: 'newPlayerMessage',
      data: {
        text,
        isFirstThisStream,
        replyTo,
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
        case 'инвентарь':
        case 'inventory':
          return this.handleInventoryCommand(profile.id)
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
}
