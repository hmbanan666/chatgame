import type { QuestWithRewards } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'

export default defineEventHandler<EventHandlerRequest, Promise<QuestWithRewards[]>>(async () => {
  const quests = await db.quest.findAll()

  return quests as QuestWithRewards[]
})
