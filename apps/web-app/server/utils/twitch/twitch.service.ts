import { getDateMinusMinutes } from '#shared/utils/date'
import { createId } from '@paralleldrive/cuid2'
import { sendGameMessage } from '~~/server/api/websocket'
import { getAlertService } from '~~/server/core/alerts'
import { dictionary } from '~~/server/core/locale'
import { getViewerQuestService } from '~~/server/core/quest'

export class TwitchService {
  readonly #roomId: string
  readonly #streamerId: string

  constructor(roomId: string, streamerId: string) {
    this.#roomId = roomId
    this.#streamerId = streamerId
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

    // Viewer quest (skip for streamer)
    if (userId !== this.#roomId) {
      const questService = getViewerQuestService(this.#streamerId, this.#roomId)
      await questService.tryAssignQuest(profile.id, userName, codename)
      await questService.trackMessage(profile.id)
    }

    // Stream Journey
    sendGameMessage(this.#roomId, {
      event: 'newPlayerMessage',
      data: {
        text,
        player: {
          id: userId,
          name: userName,
          codename,
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

  async handleCouponActivation(id: string, profileId: string, userName: string, codename: string) {
    const status = await this.#activateCouponByCommand(id, profileId)

    const t = dictionary('ru')
    if (status === 'OK') {
      const profile = await db.profile.find(profileId)

      getAlertService(this.#roomId).send({
        id: createId(),
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
