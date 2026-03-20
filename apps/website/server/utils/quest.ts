import type { QuestReward } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'

export class QuestService {
  async updateProgress(profileId: string) {
    const profileQuests = await db.quest.findForProfile(profileId)

    for (const quest of profileQuests) {
      let progress = quest.editions[0]
      if (!progress) {
        [progress] = await db.questEdition.create({
          id: createId(),
          completedAt: null,
          status: 'IN_PROGRESS',
          questId: quest.id,
          progress: 0,
          profileId,
        })
      }
    }
  }

  async completeQuest(id: string, profileId: string) {
    const profileQuests = await db.quest.findForProfile(profileId)
    const quest = profileQuests.find((q: { id: string }) => q.id === id)
    const questEdition = quest?.editions[0]
    const questRewards = quest?.rewards as unknown as QuestReward[]

    if (!questEdition || questEdition.status === 'COMPLETED') {
      return
    }

    if (id === 'xu44eon7teobb4a74cd4yvuh') {
      // Coupon taken
      await db.questEdition.update(questEdition.id, {
        completedAt: new Date(),
        status: 'COMPLETED',
      })

      await db.profile.addRangerPoints(profileId, quest.points)

      // Rewards
      for (const reward of questRewards) {
        if (reward.type === 'COINS') {
          await db.transaction.create({
            id: createId(),
            profileId,
            entityId: quest.id,
            amount: reward.amount,
            type: 'COINS_FROM_QUEST',
          })
          await db.profile.addCoins(profileId, reward.amount)
        }
        if (reward.type === 'TROPHY' && reward.entityId) {
          await this.#addTrophyToProfile(reward.entityId, profileId)
        }
      }
    }
  }

  async #addTrophyToProfile(trophyId: string, profileId: string) {
    const trophyEdition = await db.trophyEdition.findByIdAndProfile(trophyId, profileId)
    if (trophyEdition?.id) {
      // Already added
      return
    }

    const [newEdition] = await db.trophyEdition.create({
      id: createId(),
      profileId,
      trophyId,
    })

    if (newEdition) {
      const editionWithTrophy = await db.trophyEdition.findByIdAndProfile(newEdition.id, profileId)
      if (editionWithTrophy?.trophy) {
        await db.profile.addTrophyHunterPoints(profileId, editionWithTrophy.trophy.points)
      }
    }
  }
}
