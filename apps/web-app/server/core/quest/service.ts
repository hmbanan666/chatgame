import { createId } from '@paralleldrive/cuid2'
import { getAlertService } from '~~/server/core/alerts'
import { QUEST_TEMPLATES } from './templates'

const logger = useLogger('quest:service')

interface ActiveQuest {
  backlogItemId: string
  profileId: string
  userName: string
  codename: string
  questText: string
  templateId: string
  progress: number
  goal: number
  reward: number
  lastPersistedProgress: number
}

export class ViewerQuestService {
  readonly #quests = new Map<string, ActiveQuest>()
  readonly #streamerId: string
  readonly #channelId: string

  constructor(streamerId: string, channelId: string) {
    this.#streamerId = streamerId
    this.#channelId = channelId
  }

  async tryAssignQuest(profileId: string, userName: string, codename: string): Promise<void> {
    if (this.#quests.has(profileId)) {
      return
    }

    const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)]
    if (!template) {
      return
    }

    const goal = randomInt(template.goalMin, template.goalMax)
    const reward = randomInt(template.rewardMin, template.rewardMax)
    const text = template.textRu(goal)

    try {
      const [item] = await db.backlogItem.createQuest({
        text,
        authorName: userName,
        streamerId: this.#streamerId,
        questProfileId: profileId,
        questTemplateId: template.id,
        questGoal: goal,
        questReward: reward,
      })

      if (!item) {
        return
      }

      this.#quests.set(profileId, {
        backlogItemId: item.id,
        profileId,
        userName,
        codename,
        questText: text,
        templateId: template.id,
        progress: 0,
        goal,
        reward,
        lastPersistedProgress: 0,
      })

      logger.info(`Quest assigned: ${template.id} (goal=${goal}, reward=${reward}) to ${userName}`)
    } catch (err) {
      logger.error('Failed to assign quest', err)
    }
  }

  async trackMessage(profileId: string): Promise<void> {
    const quest = this.#quests.get(profileId)
    if (!quest) {
      return
    }

    quest.progress++
    logger.info(`Quest progress: ${quest.userName} ${quest.progress}/${quest.goal}`)

    if (quest.progress >= quest.goal) {
      await this.#completeQuest(quest)
      return
    }

    // Persist progress every 5 messages
    if (quest.progress - quest.lastPersistedProgress >= 5) {
      quest.lastPersistedProgress = quest.progress
      try {
        await db.backlogItem.updateQuestProgress(quest.backlogItemId, quest.progress)
      } catch (err) {
        logger.error('Failed to persist quest progress', err)
      }
    }
  }

  async #completeQuest(quest: ActiveQuest): Promise<void> {
    try {
      await db.backlogItem.completeQuest(quest.backlogItemId, quest.goal)
      await db.profile.addCoins(quest.profileId, quest.reward)

      const profile = await db.profile.find(quest.profileId)

      getAlertService(this.#channelId).send({
        id: createId(),
        type: 'QUEST_COMPLETE',
        data: {
          userName: quest.userName,
          codename: quest.codename,
          questText: quest.questText,
          reward: quest.reward,
          totalCoins: profile?.coins ?? 0,
        },
      })

      logger.info(`Quest completed: ${quest.templateId} by ${quest.userName}, +${quest.reward} coins`)
    } catch (err) {
      logger.error('Failed to complete quest', err)
    }

    this.#quests.delete(quest.profileId)
  }

  async reset(): Promise<void> {
    for (const quest of this.#quests.values()) {
      try {
        await db.backlogItem.expireQuest(quest.backlogItemId, quest.progress)
      } catch (err) {
        logger.error('Failed to expire quest', err)
      }
    }
    this.#quests.clear()
    logger.info('Quest service reset')
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
