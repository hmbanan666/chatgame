import type {
  CharacterEditionWithCharacter,
  Coupon,
  Profile,
  ProfileWithTokens,
  QuestEdition,
  TelegramProfile,
  TwitchAccessToken,
  TwitchToken,
} from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'
import { notifyAdmin } from '../core/telegram/oldBot'
import { getDateMinusMinutes } from './date'

export class DBRepository {
  createTwitchAccessToken(token: TwitchAccessToken) {
    return prisma.twitchAccessToken.create({
      data: {
        ...token,
        obtainmentTimestamp: token.obtainmentTimestamp.toString(),
      },
    })
  }

  async getTwitchAccessToken(userId: string): Promise<TwitchAccessToken | null> {
    const token = await prisma.twitchAccessToken.findFirst({
      where: { userId },
    })
    if (!token) {
      return null
    }

    return {
      ...token,
      obtainmentTimestamp: Number(token.obtainmentTimestamp),
    }
  }

  updateTwitchAccessToken(userId: string, token: Partial<TwitchAccessToken>) {
    return prisma.twitchAccessToken.updateMany({
      where: { userId },
      data: {
        ...token,
        obtainmentTimestamp: token.obtainmentTimestamp?.toString(),
      },
    })
  }

  async findAllStreamers(type: TwitchToken['type']): Promise<ProfileWithTokens[]> {
    return (await prisma.profile.findMany({
      where: { twitchTokens: { some: { status: 'ACTIVE', type } } },
      include: {
        twitchTokens: true,
      },
    })) as ProfileWithTokens[]
  }

  async getTokensCount(type: TwitchToken['type']) {
    return prisma.twitchToken.count({
      where: { status: 'ACTIVE', type },
    })
  }

  findProfile(id: string) {
    return prisma.profile.findUnique({ where: { id } })
  }

  findProfileByTwitchId(twitchId: string): Promise<Profile | null> {
    return prisma.profile.findFirst({ where: { twitchId } })
  }

  async findOrCreateProfile({ userId, userName }: { userId: string, userName: string }) {
    let profile = await prisma.profile.findFirst({
      where: { twitchId: userId },
    })
    if (!profile) {
      const editionId = createId()

      const newProfile = {
        id: createId(),
        twitchId: userId,
        userName,
        activeEditionId: editionId,
        mana: 10,
      }

      const createdProfile: Profile = await prisma.profile.create({
        data: newProfile,
      })

      // Twitchy
      const edition = await prisma.characterEdition.create({
        data: {
          id: editionId,
          profileId: createdProfile.id,
          characterId: 'staoqh419yy3k22cbtm9wquc',
        },
      })

      profile = await prisma.profile.update({
        where: { id: createdProfile.id },
        data: {
          activeEditionId: edition.id,
        },
      })
    }

    return profile
  }

  async getTelegramProfile(telegramId: string) {
    return prisma.telegramProfile.findFirst({
      where: { telegramId },
      include: {
        profile: {
          include: {
            trophyEditions: {
              orderBy: { createdAt: 'desc' },
              include: {
                trophy: true,
              },
            },
            characterEditions: true,
            itemEditions: {
              include: {
                item: true,
              },
            },
            payments: true,
          },
        },
      },
    })
  }

  async findOrCreateTelegramProfile({ telegramId, username, firstName, lastName, languageCode }: { telegramId: string, username?: string, firstName?: string, lastName?: string, languageCode?: string }) {
    const profile = await this.getTelegramProfile(telegramId)
    if (!profile) {
      const telegramProfileId = createId()
      const profileId = createId()
      const editionId = createId()

      const finalFirstName = firstName ?? 'Аноним'

      const createdProfile: TelegramProfile = await prisma.telegramProfile.create({
        data: {
          id: telegramProfileId,
          telegramId,
          username,
          energy: 10,
          firstName: finalFirstName,
          lastName,
          languageCode,
        },
      })

      const mainProfile = await this.findOrCreateProfile({
        userId: profileId,
        userName: `tg_${telegramId}`,
      })

      // Telegramo
      const edition = await prisma.characterEdition.create({
        data: {
          id: editionId,
          profileId: mainProfile.id,
          characterId: 'c3hrpu39wodc2nlv6pmgmm2k',
        },
      })

      await prisma.profile.update({
        where: { id: mainProfile.id },
        data: {
          telegramProfileId,
          activeEditionId: edition.id,
        },
      })

      await notifyAdmin(`Новый игровой профиль: ${telegramId}, ${finalFirstName} ${lastName}`)

      return this.getTelegramProfile(createdProfile.telegramId)
    }

    // If some profile data changed
    if (profile.firstName !== firstName || profile.lastName !== lastName) {
      await prisma.telegramProfile.update({
        where: { id: profile.id },
        data: {
          firstName,
          lastName,
        },
      })
    }

    if (languageCode && profile.languageCode !== languageCode) {
      await prisma.telegramProfile.update({
        where: { id: profile.id },
        data: { languageCode },
      })
    }

    return profile
  }

  async findCharacterByEditionId(editionId: string): Promise<CharacterEditionWithCharacter> {
    const char = await prisma.characterEdition.findFirst({
      where: { id: editionId },
      include: {
        character: true,
      },
    })

    return char as CharacterEditionWithCharacter
  }

  async updateManaOnProfiles() {
    const profiles = await prisma.profile.findMany({
      where: {
        mana: {
          lt: 10,
        },
      },
    })

    for (const profile of profiles) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          mana: {
            increment: 2,
          },
        },
      })
    }
  }

  addXpToCharacterEdition(id: string) {
    return prisma.characterEdition.update({
      where: { id },
      data: {
        xp: {
          increment: 1,
        },
      },
    })
  }

  addLevelToCharacterEdition(id: string) {
    return prisma.characterEdition.update({
      where: { id },
      data: {
        level: {
          increment: 1,
        },
      },
    })
  }

  async addCoinsToProfile(id: string, editionId: string, increment = 1) {
    await prisma.transaction.create({
      data: {
        id: createId(),
        profileId: id,
        entityId: editionId,
        amount: increment,
        type: 'COIN_FROM_LVL_UP',
      },
    })

    return prisma.profile.update({
      where: { id },
      data: {
        coins: { increment },
      },
    })
  }

  async addCoinsToProfileFromQuest(id: string, questId: string, increment = 1) {
    await prisma.transaction.create({
      data: {
        id: createId(),
        profileId: id,
        entityId: questId,
        amount: increment,
        type: 'COINS_FROM_QUEST',
      },
    })

    return prisma.profile.update({
      where: { id },
      data: {
        coins: { increment },
      },
    })
  }

  async addTrophyToProfile(id: string, profileId: string) {
    const trophyEdition = await prisma.trophyEdition.findUnique({
      where: { id, profileId },
      include: { trophy: true },
    })
    if (trophyEdition?.id) {
      // Already added
      return
    }

    const newEdition = await prisma.trophyEdition.create({
      data: {
        id: createId(),
        profileId,
        trophyId: id,
      },
      include: { trophy: true },
    })

    return this.addTrophyHunterPoints(profileId, newEdition.trophy.points)
  }

  async addCollectorPoints(id: string, points: number) {
    await prisma.transaction.create({
      data: {
        id: createId(),
        profileId: id,
        entityId: id,
        amount: points,
        type: 'POINTS_FROM_LEVEL_UP',
      },
    })

    const profile = await prisma.profile.update({
      where: { id },
      data: {
        collectorPoints: {
          increment: points,
        },
      },
    })

    return profile
  }

  addLevelToProfile(id: string) {
    return prisma.profile.update({
      where: { id },
      data: {
        level: { increment: 1 },
      },
    })
  }

  async addTrophyHunterPoints(id: string, points: number) {
    const profile = await prisma.profile.update({
      where: { id },
      data: {
        trophyHunterPoints: {
          increment: points,
        },
      },
    })

    return profile
  }

  async addRangerPoints(id: string, points: number) {
    const profile = await prisma.profile.update({
      where: { id },
      data: {
        rangerPoints: { increment: points },
      },
    })

    return profile
  }

  async findOrCreatePlayer({ userName, profileId }: { userName: string, profileId: string }) {
    let player = await prisma.player.findFirst({
      where: { profileId },
    })
    if (!player) {
      const playerId = createId()

      // Create new one
      const newPlayer = {
        id: playerId,
        name: userName,
        inventoryId: playerId,
        profileId,
      }
      player = await prisma.player.create({
        data: newPlayer,
      })
    }

    return player
  }

  async getPlaceInTopByCoupons(profileId: string) {
    const topProfiles = await prisma.profile.findMany({
      orderBy: { coupons: 'desc' },
      take: 1000,
    })

    return topProfiles.findIndex((profile) => profile.id === profileId) + 1
  }

  async generateCouponCommand(): Promise<string> {
    // Generate 2-digit number
    const number = Math.floor(Math.random() * 90 + 10)

    // Check if already have in 24 hours
    const gte = getDateMinusMinutes(60 * 24)

    const isAlreadyExist = await prisma.coupon.findFirst({
      where: { activationCommand: number.toString(), createdAt: { gte } },
    })
    if (isAlreadyExist) {
      return this.generateCouponCommand()
    }

    return number.toString()
  }

  async generateCoupon() {
    const activationCommand = await this.generateCouponCommand()

    const newCoupon: Omit<Coupon, 'createdAt' | 'updatedAt' | 'profileId'> = {
      id: createId(),
      activationCommand,
      status: 'CREATED',
    }

    return prisma.coupon.create({
      data: newCoupon,
    })
  }

  async activateCouponByCommand(
    id: string,
    profileId: string,
  ): Promise<'OK' | 'TAKEN_ALREADY' | 'TIME_LIMIT' | 'NOT_FOUND'> {
    // Check, if this profile already take coupon in 10 hours
    const gte = getDateMinusMinutes(60 * 10)

    const isAlreadyToday = await prisma.coupon.findFirst({
      where: { profileId, createdAt: { gte } },
    })
    if (isAlreadyToday) {
      return 'TIME_LIMIT'
    }

    const coupon = await prisma.coupon.findFirst({
      where: { activationCommand: id, createdAt: { gte } },
    })
    if (!coupon) {
      return 'NOT_FOUND'
    }
    if (coupon.profileId) {
      return 'TAKEN_ALREADY'
    }

    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        profileId,
        status: 'TAKEN',
      },
    })

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        coupons: { increment: 1 },
      },
    })

    return 'OK'
  }

  async findProfileQuests(profileId: string) {
    return prisma.quest.findMany({
      include: {
        editions: {
          where: { profileId },
        },
        rewards: true,
      },
    })
  }

  async createQuestEdition(data: Omit<QuestEdition, 'createdAt' | 'updatedAt'>) {
    return prisma.questEdition.create({
      data,
    })
  }

  async updateQuestEdition(id: string, data: Pick<QuestEdition, 'completedAt' | 'status'>) {
    return prisma.questEdition.update({
      where: { id },
      data,
    })
  }
}
