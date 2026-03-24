export interface QuestTemplate {
  id: string
  type: 'messages'
  goalMin: number
  goalMax: number
  rewardMin: number
  rewardMax: number
  textRu: (goal: number) => string
  textEn: (goal: number) => string
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n)
  if (abs % 10 === 1 && abs % 100 !== 11) {
    return one
  }
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) {
    return few
  }
  return many
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'messages_small',
    type: 'messages',
    goalMin: 5,
    goalMax: 10,
    rewardMin: 1,
    rewardMax: 1,
    textRu: (g) => `Напиши ${g} ${pluralRu(g, 'сообщение', 'сообщения', 'сообщений')} в чат`,
    textEn: (g) => `Send ${g} ${g === 1 ? 'message' : 'messages'} in chat`,
  },
  {
    id: 'messages_medium',
    type: 'messages',
    goalMin: 15,
    goalMax: 25,
    rewardMin: 1,
    rewardMax: 2,
    textRu: (g) => `Напиши ${g} ${pluralRu(g, 'сообщение', 'сообщения', 'сообщений')} в чат`,
    textEn: (g) => `Send ${g} ${g === 1 ? 'message' : 'messages'} in chat`,
  },
  {
    id: 'messages_large',
    type: 'messages',
    goalMin: 30,
    goalMax: 50,
    rewardMin: 2,
    rewardMax: 3,
    textRu: (g) => `Напиши ${g} ${pluralRu(g, 'сообщение', 'сообщения', 'сообщений')} в чат`,
    textEn: (g) => `Send ${g} ${g === 1 ? 'message' : 'messages'} in chat`,
  },
]
