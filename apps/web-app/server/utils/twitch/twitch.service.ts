import { rooms } from '~~/server/core/stream-journey'
import { getDateMinusMinutes } from '../date'
import { QuestService } from '../quest'

export class TwitchService {
  readonly #quest: QuestService

  constructor() {
    this.#quest = new QuestService()
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

    const player = await db.player.findOrCreate({ profileId: profile.id, userName })

    // Stream Journey
    const room = rooms.get('12345')
    if (room) {
      room.send({
        event: 'newPlayerMessage',
        data: {
          text,
          player: {
            id: userId,
            name: userName,
            codename: 'twitchy',
          },
        },
      })
    }

    if (firstChar === '!' && possibleCommand) {
      switch (possibleCommand) {
        case 'купон':
        case 'coupon':
          return this.handleCouponActivation(firstParam, player!.profileId)
        case 'инвентарь':
        case 'inventory':
          return this.handleInventoryCommand(player!.profileId)
        case 'гитхаб':
        case 'github':
        case 'git':
          return this.handleGitHubCommand()
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

    return {
      ok: true,
      message: `У тебя есть ${profile.coupons} купон(а/ов). Обменивай их на награды в игре.`,
    }
  }

  handleGitHubCommand() {
    return {
      ok: true,
      message: '👨‍💻 https://github.com/hmbanan666\n ⭐ https://github.com/k39space/k39',
    }
  }

  async handleCouponActivation(id: string, profileId: string) {
    const status = await this.#activateCouponByCommand(id, profileId)
    if (status === 'OK') {
      // Quest
      await this.#quest.completeQuest('xu44eon7teobb4a74cd4yvuh', profileId)

      return {
        ok: true,
        message: 'А ты молодец! +1 купон 🎟️',
      }
    }
    if (status === 'TIME_LIMIT') {
      return {
        ok: false,
        message: 'Неа, один уже взят. Новый - на следующем стриме 🍌',
      }
    }
    if (status === 'TAKEN_ALREADY') {
      return {
        ok: false,
        message: 'Тебя опередили 🔥',
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
    const cutoff = getDateMinusMinutes(60 * 10)

    const isAlreadyToday = await db.coupon.findByProfileSince(profileId, cutoff)
    if (isAlreadyToday) {
      return 'TIME_LIMIT'
    }

    const coupon = await db.coupon.findByActivationCommandSince(id, cutoff)
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
