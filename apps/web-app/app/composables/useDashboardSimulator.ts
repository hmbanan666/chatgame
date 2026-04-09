import { getRandInteger } from '#shared/utils/random'

const NAMES = ['kungfux010', 'sava5621', 'BezSovesty', 'pixel_ninja', 'stream_queen', 'mr_pickles', 'night_owl', 'code_wizard']
const CODENAMES = ['twitchy', 'banana', 'burger', 'gentleman', 'marshmallow', 'pup', 'shape']

const CHAT_TEXTS = [
  'привет!', 'го играть', 'класс', 'это Индия точно', 'Мексика', 'а где это?',
  'Бразилия!', 'это Россия 100%', 'Африка', 'я знаю это место!', 'США',
  'лайк за стрим', 'ахаха', 'нет, это Европа', 'Франция?', 'привет с ютуба',
  'подписался!', 'красивое место', 'я был там', 'Австралия', 'чешский язык',
  '!купон 42', 'ЛЯЯЯ', 'шок', 'красота', 'как давно стримишь?',
]

export interface DashboardChatMessage {
  id: string
  twitchId: string
  name: string
  level: number
  text: string
  time: string
  isSystem: boolean
  isFirstThisStream: boolean
  loadingXp: boolean
  loadingCoins: boolean
  replyTo?: string
}

export interface ViewerCardData {
  twitchId: string
  userName: string
  level: number
  xp: number
  xpRequired: number
  coins: number
  coupons: number
  watchTimeMin: number
  createdAt: string
  lastSeenAt: string
  charactersCount: number
  donationTotal: number
  note: string
  profileId: string
}

export interface DashboardEvent {
  id: string
  type: string
  time: string
  data: Record<string, any>
}

function pick<T>(arr: T[]): T {
  return arr[getRandInteger(0, arr.length - 1)]!
}

function timeNow(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export function useDashboardSimulator() {
  const chatMessages = reactive<DashboardChatMessage[]>([])
  const events = reactive<DashboardEvent[]>([])
  const stats = ref({
    isLive: true,
    fuel: 65,
    maxFuel: 100,
    viewerCount: getRandInteger(30, 150),
    biome: 'GREEN',
    nextCouponAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    stats: {
      messagesCount: 0,
      treesChopped: getRandInteger(50, 200),
      couponsTaken: getRandInteger(0, 5),
      streamStartedAt: new Date(Date.now() - getRandInteger(30, 120) * 60_000).toISOString(),
    },
  })

  const seenNames = new Set<string>()

  let idCounter = 0
  const intervals: ReturnType<typeof setInterval>[] = []

  function nextId() {
    return `demo-${++idCounter}`
  }

  function generateFakeViewerCard(name: string): ViewerCardData {
    const daysAgo = getRandInteger(0, 30)
    const lastSeen = new Date(Date.now() - daysAgo * 86400_000)
    const isDonor = getRandInteger(1, 100) <= 30
    const notes = ['', '', '', 'Зовут Игорь, любит Африку', 'Постоянный зритель, играет в GeoGuessr', '']

    return {
      twitchId: `fake-${name}`,
      userName: name,
      level: getRandInteger(1, 30),
      xp: getRandInteger(0, 100),
      xpRequired: getRandInteger(50, 200),
      coins: getRandInteger(0, 500),
      coupons: getRandInteger(0, 15),
      watchTimeMin: getRandInteger(30, 3000),
      createdAt: new Date(Date.now() - getRandInteger(7, 365) * 86400_000).toISOString(),
      lastSeenAt: lastSeen.toISOString(),
      charactersCount: getRandInteger(1, 5),
      donationTotal: isDonor ? getRandInteger(100, 5000) : 0,
      note: pick(notes),
      profileId: `fake-profile-${name}`,
    }
  }

  function addChatMessage() {
    const name = pick(NAMES)
    const isFirst = !seenNames.has(name)
    seenNames.add(name)

    chatMessages.push({
      id: nextId(),
      twitchId: `fake-${name}`,
      name,
      level: getRandInteger(1, 25),
      text: pick(CHAT_TEXTS),
      time: timeNow(),
      isSystem: false,
      isFirstThisStream: isFirst,
      loadingXp: false,
      loadingCoins: false,
    })
    if (chatMessages.length > 200) {
      chatMessages.splice(0, chatMessages.length - 200)
    }
    stats.value.stats.messagesCount++

    // Occasionally add system message
    if (getRandInteger(1, 100) <= 15) {
      const botMessages = [
        'Добро пожаловать в игру! Пиши в чат, качай уровень',
        'Появился новый Купон! Забирай: пиши команду "!купон 42"',
        'Подписывайтесь на канал и заходите на chatgame.space',
      ]
      chatMessages.push({
        id: nextId(),
        twitchId: '',
        name: 'BOT',
        level: 0,
        text: pick(botMessages),
        time: timeNow(),
        isSystem: true,
        isFirstThisStream: false,
        loadingXp: false,
        loadingCoins: false,
      })
    }
  }

  function addEvent() {
    const types = [
      'NEW_VIEWER', 'LEVEL_UP', 'QUEST_COMPLETE',
      'COUPON_TAKEN', 'NEW_FOLLOWER', 'WAGON_ACTION',
    ]
    const type = pick(types)
    const userName = pick(NAMES)
    const codename = pick(CODENAMES)

    const generators: Record<string, () => Record<string, any>> = {
      NEW_VIEWER: () => ({ userName, codename }),
      LEVEL_UP: () => ({ userName, codename, level: getRandInteger(2, 30), reward: 1 }),
      QUEST_COMPLETE: () => ({ userName, codename, questText: 'Срубить 10 деревьев', reward: getRandInteger(1, 3), xpReward: getRandInteger(3, 10), totalCoins: getRandInteger(10, 100) }),
      COUPON_TAKEN: () => ({ userName, codename, totalCoupons: getRandInteger(1, 10) }),
      NEW_FOLLOWER: () => ({ userName }),
      WAGON_ACTION: () => ({ userName, codename, action: 'REFUEL', actionTitle: 'Заправить вагон', actionDescription: 'Заправил вагон!', xpEarned: getRandInteger(1, 20) }),
    }

    events.push({
      id: nextId(),
      type,
      time: timeNow(),
      data: generators[type]!(),
    })
    if (events.length > 200) {
      events.splice(0, events.length - 200)
    }
  }

  function tick() {
    // Fluctuate viewers
    stats.value.viewerCount = Math.max(1, stats.value.viewerCount + getRandInteger(-2, 3))
    // Fuel drain
    stats.value.fuel = Math.max(0, Math.min(100, stats.value.fuel - 0.1 + getRandInteger(0, 1) * 0.3))
    // Trees
    if (getRandInteger(1, 100) <= 5) {
      stats.value.stats.treesChopped++
    }
  }

  function start() {
    // Initial seed
    // Seed messages after a tick so watchers are connected
    const seedTimeout = setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        addChatMessage()
      }
      addEvent()
    }, 100)
    intervals.push(seedTimeout as unknown as ReturnType<typeof setInterval>)

    // Chat messages every 2-6 sec
    function scheduleChat() {
      const delay = getRandInteger(2000, 6000)
      const timeout = setTimeout(() => {
        addChatMessage()
        scheduleChat()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleChat()

    // Events every 8-20 sec
    function scheduleEvent() {
      const delay = getRandInteger(8000, 20_000)
      const timeout = setTimeout(() => {
        addEvent()
        scheduleEvent()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleEvent()

    // Stats tick every second
    intervals.push(setInterval(tick, 1000))
  }

  function stop() {
    for (const id of intervals) {
      clearInterval(id)
    }
    intervals.length = 0
  }

  return {
    chatMessages,
    events,
    stats,
    generateFakeViewerCard,
    start,
    stop,
  }
}
