import type { WagonSession } from './charge/stream'
import type { ViewerQuestService } from './quest/service'
import { dictionary } from './locale'

interface AnnouncementContext {
  session: WagonSession | null
  questService: ViewerQuestService | null
  seenCount: number
  streamMinutes: number
}

interface AnnouncementProvider {
  id: string
  weight: number
  condition: (ctx: AnnouncementContext) => boolean
  message: (ctx: AnnouncementContext) => string
}

const providers: AnnouncementProvider[] = [
  // ── Contextual (weight 3) ──────────────────────────
  {
    id: 'low_fuel',
    weight: 3,
    condition: (ctx) => (ctx.session?.fuelPercent ?? 100) <= 25 && (ctx.session?.fuel ?? 0) > 0,
    message: (ctx) => `Топливо ${Math.round(ctx.session!.fuel)}/${ctx.session!.maxFuel}! Заправь вагон за баллы канала — получишь XP!`,
  },
  {
    id: 'no_donations',
    weight: 3,
    condition: (ctx) => (ctx.session?.stats.donationsCount ?? 0) === 0 && ctx.streamMinutes >= 30,
    message: () => 'Поддержи стрим — донаты заправляют вагон и дают XP: chatgame.space/donate',
  },
  {
    id: 'active_quests',
    weight: 3,
    condition: (ctx) => (ctx.questService?.activeCount ?? 0) >= 3,
    message: (ctx) => `Сейчас ${ctx.questService!.activeCount} зрителей выполняют квесты! Пиши в чат чтобы получить свой`,
  },
  {
    id: 'no_redemptions',
    weight: 3,
    condition: (ctx) => (ctx.session?.stats.totalRedemptions ?? 0) === 0 && ctx.streamMinutes >= 20,
    message: () => 'Баллы канала — заправляй вагон, ускоряй, саботируй! Попробуй!',
  },

  // ── Facts (weight 2) ───────────────────────────────
  {
    id: 'trees_chopped',
    weight: 2,
    condition: (ctx) => (ctx.session?.stats.treesChopped ?? 0) >= 10,
    message: (ctx) => `За стрим срублено ${ctx.session!.stats.treesChopped} деревьев! 🌲`,
  },
  {
    id: 'new_viewers',
    weight: 2,
    condition: (ctx) => ctx.seenCount >= 3,
    message: (ctx) => `Сегодня к нам присоединилось ${ctx.seenCount} зрителей! Добро пожаловать!`,
  },
  {
    id: 'stream_time',
    weight: 2,
    condition: (ctx) => ctx.streamMinutes >= 60,
    message: (ctx) => {
      const h = Math.floor(ctx.streamMinutes / 60)
      return `Стрим идёт уже ${h} ч! Спасибо что вы с нами 💛`
    },
  },
  {
    id: 'messages_count',
    weight: 2,
    condition: (ctx) => (ctx.session?.stats.messagesCount ?? 0) >= 50,
    message: (ctx) => `${ctx.session!.stats.messagesCount} сообщений за стрим! Чат на огне 🔥`,
  },
]

// Static fallbacks from locale
function getStaticProviders(): AnnouncementProvider[] {
  const t = dictionary('ru')
  return Object.entries(t.twitch.info).map(([key, text]) => ({
    id: `static_${key}`,
    weight: 1,
    condition: () => true,
    message: () => text as string,
  }))
}

let lastAnnouncementId: string | null = null

export function getNextAnnouncement(ctx: AnnouncementContext): string {
  const all = [...providers, ...getStaticProviders()]
  const available = all.filter((p) => p.id !== lastAnnouncementId && p.condition(ctx))

  if (available.length === 0) {
    const t = dictionary('ru')
    return t.twitch.info.supportStreamer
  }

  // Weighted random selection
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0)
  let rand = Math.random() * totalWeight
  let selected = available[0]!

  for (const provider of available) {
    rand -= provider.weight
    if (rand <= 0) {
      selected = provider
      break
    }
  }

  lastAnnouncementId = selected.id
  return selected.message(ctx)
}
