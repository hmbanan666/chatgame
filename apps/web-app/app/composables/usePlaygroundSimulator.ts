import type { WagonEffect, WagonSessionStats } from '#shared/types/charge'
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

export function usePlaygroundSimulator() {
  const fuel = ref(50)
  const maxFuel = ref(100)
  const speed = ref(1)
  const isStopped = ref(false)
  const effects = ref<WagonEffect[]>([])
  const stats = ref<WagonSessionStats>({
    fuelAdded: 0,
    fuelStolen: 0,
    treesChopped: 0,
    donationsCount: 0,
    donationsTotal: 0,
    messagesCount: 0,
    peakViewers: 0,
    totalRedemptions: 0,
    streamStartedAt: new Date().toISOString(),
  })
  const viewerCount = ref(randomInt(50, 200))
  const backlogItems = ref<BacklogItem[]>([])
  const alerts = ref<EventMessage[]>([])

  let idCounter = 0
  const intervals: ReturnType<typeof setInterval>[] = []

  function nextId() {
    return `fake-${++idCounter}`
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
  }

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function wagonTick() {
    const now = Date.now()

    // Expire effects
    let recalc = false
    for (const effect of effects.value) {
      if (!effect.isExpired && now >= effect.expiredAt) {
        effect.isExpired = true
        recalc = true
      }
    }
    effects.value = effects.value.filter((e) => !e.isExpired)

    if (recalc) {
      isStopped.value = effects.value.some((e) => e.action === 'SABOTAGE')
      const hasBoost = effects.value.some((e) => e.action === 'SPEED_BOOST')
      speed.value = hasBoost ? 2 : 1
    }

    // Fuel drain
    if (!isStopped.value) {
      fuel.value = Math.max(0, fuel.value - 0.05 * speed.value)
    }

    // Fake tree chop
    if (Math.random() < 0.02) {
      stats.value.treesChopped++
    }

    // Fluctuate viewers
    viewerCount.value = Math.max(0, viewerCount.value + randomInt(-2, 3))
    if (viewerCount.value > stats.value.peakViewers) {
      stats.value.peakViewers = viewerCount.value
    }
  }

  function addFakeAction() {
    const actions = ['REFUEL', 'STEAL_FUEL', 'SPEED_BOOST', 'SABOTAGE'] as const
    const action = pick([...actions])
    const userName = pick(FAKE_NAMES)

    stats.value.totalRedemptions++

    const ACTION_TITLES: Record<string, string> = {
      REFUEL: 'Заправить вагон',
      STEAL_FUEL: 'Украсть топливо',
      SPEED_BOOST: 'Ускорение',
      SABOTAGE: 'Саботаж',
    }
    const ACTION_DESCRIPTIONS: Record<string, string> = {
      REFUEL: 'Заправил вагон!',
      STEAL_FUEL: 'Украл топливо!',
      SPEED_BOOST: 'Ускорил вагон!',
      SABOTAGE: 'Саботировал вагон!',
    }

    alerts.value.push({
      id: nextId(),
      type: 'WAGON_ACTION',
      data: {
        userName,
        codename: pick(FAKE_CODENAMES),
        action,
        actionTitle: ACTION_TITLES[action] ?? action,
        actionDescription: ACTION_DESCRIPTIONS[action] ?? action,
        xpEarned: randomInt(1, 20),
      },
    })

    switch (action) {
      case 'REFUEL':
        fuel.value = Math.min(maxFuel.value, fuel.value + 15)
        stats.value.fuelAdded += 15
        break
      case 'STEAL_FUEL':
        fuel.value = Math.max(0, fuel.value - 10)
        stats.value.fuelStolen += 10
        break
      case 'SPEED_BOOST':
        effects.value.push({
          id: nextId(),
          createdAt: Date.now(),
          expiredAt: Date.now() + 120_000,
          action: 'SPEED_BOOST',
          userName,
          isExpired: false,
        })
        speed.value = 2
        break
      case 'SABOTAGE':
        effects.value.push({
          id: nextId(),
          createdAt: Date.now(),
          expiredAt: Date.now() + 30_000,
          action: 'SABOTAGE',
          userName,
          isExpired: false,
        })
        isStopped.value = true
        break
    }
  }

  function addFakeMessage() {
    stats.value.messagesCount++
  }

  const activeQuestViewers = new Set<string>()

  function addBacklogItem() {
    const isQuest = Math.random() < 0.5

    if (isQuest) {
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

      // Donation adds fuel
      const fuelAmount = Math.min(donation.amount * 0.01, maxFuel.value)
      fuel.value = Math.min(maxFuel.value, fuel.value + fuelAmount)
      stats.value.donationsCount++
      stats.value.donationsTotal += donation.amount
      stats.value.fuelAdded += fuelAmount

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
    intervals.push(setInterval(wagonTick, 1000))

    function scheduleMessage() {
      const delay = randomInt(3000, 8000)
      const timeout = setTimeout(() => {
        addFakeMessage()
        scheduleMessage()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleMessage()

    function scheduleAction() {
      const delay = randomInt(20_000, 45_000)
      const timeout = setTimeout(() => {
        addFakeAction()
        scheduleAction()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleAction()

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

    function scheduleNewViewer() {
      const delay = randomInt(30_000, 70_000)
      const timeout = setTimeout(() => {
        alerts.value.push({
          id: nextId(),
          type: 'NEW_VIEWER',
          data: { userName: `viewer_${randomInt(100, 999)}`, codename: pick(FAKE_CODENAMES) },
        })
        scheduleNewViewer()
      }, delay)
      intervals.push(timeout as unknown as ReturnType<typeof setInterval>)
    }
    scheduleNewViewer()

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
    addFakeMessage()
    addFakeMessage()
    addFakeMessage()
  }

  function stop() {
    for (const id of intervals) {
      clearInterval(id)
    }
    intervals.length = 0
  }

  return {
    fuel,
    maxFuel,
    speed,
    isStopped,
    effects,
    stats,
    viewerCount,
    backlogItems,
    alerts,
    start,
    stop,
  }
}
