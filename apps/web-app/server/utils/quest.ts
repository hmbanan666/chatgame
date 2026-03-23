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
      }
    }
  }
}
