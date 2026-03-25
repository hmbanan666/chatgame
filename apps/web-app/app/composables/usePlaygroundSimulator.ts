import type { ChargeModifier } from '#shared/types/charge'
import type { EventMessage } from '@chat-game/types'
import type { BacklogItem } from '~/components/BacklogList.vue'
import { QUEST_TEMPLATES } from '#shared/quest/templates'

const FAKE_NAMES = ['kungfux010', 'sava5621', 'BezSovesty', 'mr_pickles', 'night_owl', 'pixel_ninja', 'stream_queen', 'code_wizard']
const FAKE_CODENAMES = ['twitchy', 'banana', 'burger', 'catchy', 'claw', 'gentleman', 'marshmallow', 'pioneer', 'pup', 'santa', 'shape', 'sharky', 'woody', 'wooly']

const FAKE_DONATIONS = [
  { text: 'Крутой стрим, продолжай!', amount: 100 },
  { text: 'На развитие проекта', amount: 500 },
  { text: 'Добавь новых персонажей', amount: 250 },
  { text: 'Лучший стрим', amount: 150 },
  { text: 'Классная игра, респект', amount: 300 },
]

const MODIFIER_CODES = ['positive1', 'positive2', 'negative1', 'positive3']

export function usePlaygroundSimulator() {
  const energy = ref(100)
  const ratePerMinute = ref(2)
  const difficulty = ref(1.0)
  const messagesCount = ref(0)
  const modifiers = ref<ChargeModifier[]>([])
  const backlogItems = ref<BacklogItem[]>([])
  const alerts = ref<EventMessage[]>([])

  let idCounter = 0
  let tickCount = 0
  const intervals: ReturnType<typeof setInterval>[] = []
  const activeMessages: { expiresAt: number }[] = []

  function nextId() {
    return `fake-${++idCounter}`
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
  }

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function chargeTick() {
    tickCount++

    const now = Date.now()
    while (activeMessages.length > 0 && activeMessages[0]!.expiresAt < now) {
      activeMessages.shift()
    }
    messagesCount.value = activeMessages.length

    modifiers.value = modifiers.value.filter((m) => m.expiredAt > now)

    if (tickCount % 300 === 0) {
      difficulty.value = Math.round((difficulty.value + 0.04) * 100) / 100
    }

    const baseRate = 0.15
    const drain = -(baseRate * difficulty.value)
    const messageBoost = Math.min(activeMessages.length, 3) * 0.08
    const modBoost = modifiers.value.reduce((sum, m) => {
      if (m.code === 'positive1') {
        return sum + 0.1
      }
      if (m.code === 'positive2') {
        return sum + 0.2
      }
      if (m.code === 'negative1') {
        return sum - 0.1
      }
      return sum
    }, 0)
    const rate = drain + messageBoost + modBoost
    ratePerMinute.value = Math.round(rate * 60 * 100) / 100

    energy.value = Math.max(0, Math.min(100, energy.value + rate))
  }

  function addFakeMessage() {
    activeMessages.push({ expiresAt: Date.now() + 30_000 })
    messagesCount.value = activeMessages.length
  }

  function addFakeModifier() {
    const code = pick(MODIFIER_CODES)
    const duration = randomInt(30, 90) * 1000
    modifiers.value.push({
      id: nextId(),
      createdAt: Date.now(),
      expiredAt: Date.now() + duration,
      code,
      userName: pick(FAKE_NAMES),
      isExpired: false,
    })
    if (modifiers.value.length > 8) {
      modifiers.value = modifiers.value.slice(-8)
    }
  }

  const activeQuestViewers = new Set<string>()

  function addBacklogItem() {
    const isQuest = Math.random() < 0.5

    if (isQuest) {
      // Find a viewer without an active quest
      const available = FAKE_NAMES.filter((n) => !activeQuestViewers.has(n))
      if (available.length === 0) {
        return
      }
      const authorName = pick(available)
      activeQuestViewers.add(authorName)

      const template = pick(QUEST_TEMPLATES)
      const goal = randomInt(template.goalMin, template.goalMax)
      const reward = randomInt(template.rewardMin, template.rewardMax)
      const item: BacklogItem = {
        id: nextId(),
        text: template.textRu(goal),
        authorName,
        source: 'quest',
        status: 'new',
        amount: null,
        questProgress: 0,
        questGoal: goal,
        questReward: reward,
      }
      backlogItems.value.push(item)

      const progressInterval = setInterval(() => {
        if (item.status === 'done') {
          clearInterval(progressInterval)
          return
        }
        item.questProgress = Math.min(item.questProgress + randomInt(1, 3), item.questGoal!)
        // Move updated quest to end (most visible)
        const idx = backlogItems.value.indexOf(item)
        if (idx !== -1) {
          backlogItems.value.splice(idx, 1)
          backlogItems.value.push(item)
        }
        if (item.questProgress >= item.questGoal!) {
          item.status = 'done'
          alerts.value.push({
            id: nextId(),
            type: 'QUEST_COMPLETE',
            data: { userName: item.authorName, codename: pick(FAKE_CODENAMES), questText: item.text, reward: item.questReward ?? 1, totalCoins: randomInt(5, 120) },
          })
          setTimeout(() => {
            backlogItems.value = backlogItems.value.filter((i) => i.id !== item.id)
            activeQuestViewers.delete(item.authorName)
          }, 5000)
          clearInterval(progressInterval)
        }
      }, randomInt(4000, 8000))
      intervals.push(progressInterval)
    } else {
      const donation = pick(FAKE_DONATIONS)
      const donorName = pick(FAKE_NAMES)
      alerts.value.push({
        id: nextId(),
        type: 'DONATION',
        data: { userName: donorName, codename: pick(FAKE_CODENAMES), amount: donation.amount, currency: 'RUB', message: donation.text },
      })
      backlogItems.value.push({
        id: nextId(),
        text: donation.text,
        authorName: donorName,
        source: 'donation',
        status: 'new',
        amount: donation.amount,
        questProgress: 0,
        questGoal: null,
        questReward: null,
      })
    }

    if (backlogItems.value.length > 10) {
      backlogItems.value = backlogItems.value.slice(-10)
    }
  }

  function start() {
    intervals.push(setInterval(chargeTick, 1000))

    function scheduleMessage() {
      const delay = randomInt(3000, 8000)
      const timeout = setTimeout(() => {
        addFakeMessage()
        scheduleMessage()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleMessage()

    function scheduleModifier() {
      const delay = randomInt(30_000, 60_000)
      const timeout = setTimeout(() => {
        addFakeModifier()
        scheduleModifier()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleModifier()

    function scheduleCoupon() {
      const delay = randomInt(40_000, 80_000)
      const timeout = setTimeout(() => {
        alerts.value.push({
          id: nextId(),
          type: 'COUPON_TAKEN',
          data: { userName: pick(FAKE_NAMES), codename: pick(FAKE_CODENAMES), totalCoupons: randomInt(1, 15) },
        })
        scheduleCoupon()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleCoupon()

    function scheduleLevelUp() {
      const delay = randomInt(50_000, 100_000)
      const timeout = setTimeout(() => {
        alerts.value.push({
          id: nextId(),
          type: 'LEVEL_UP',
          data: { userName: pick(FAKE_NAMES), codename: pick(FAKE_CODENAMES), level: randomInt(2, 15), reward: 1 },
        })
        scheduleLevelUp()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleLevelUp()

    function scheduleBacklog() {
      const delay = randomInt(8000, 15_000)
      const timeout = setTimeout(() => {
        addBacklogItem()
        scheduleBacklog()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleBacklog()

    addBacklogItem()
    addFakeModifier()
    for (let i = 0; i < 3; i++) {
      addFakeMessage()
    }
  }

  function stop() {
    for (const id of intervals) {
      clearInterval(id)
    }
    intervals.length = 0
  }

  return {
    energy,
    ratePerMinute,
    difficulty,
    messagesCount,
    modifiers,
    backlogItems,
    alerts,
    start,
    stop,
  }
}
