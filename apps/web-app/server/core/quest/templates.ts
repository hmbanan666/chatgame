export interface QuestTemplate {
  id: string
  type: 'messages'
  goalMin: number
  goalMax: number
  rewardMin: number
  rewardMax: number
  textRu: string
  textEn: string
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'messages_small',
    type: 'messages',
    goalMin: 5,
    goalMax: 10,
    rewardMin: 1,
    rewardMax: 1,
    textRu: 'Напиши {goal} сообщений в чат',
    textEn: 'Send {goal} messages in chat',
  },
  {
    id: 'messages_medium',
    type: 'messages',
    goalMin: 15,
    goalMax: 25,
    rewardMin: 1,
    rewardMax: 2,
    textRu: 'Напиши {goal} сообщений в чат',
    textEn: 'Send {goal} messages in chat',
  },
  {
    id: 'messages_large',
    type: 'messages',
    goalMin: 30,
    goalMax: 50,
    rewardMin: 2,
    rewardMax: 3,
    textRu: 'Напиши {goal} сообщений в чат',
    textEn: 'Send {goal} messages in chat',
  },
]
