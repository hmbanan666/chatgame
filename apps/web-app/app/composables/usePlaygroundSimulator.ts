import type { CaravanState, WagonEffect, WagonSessionStats } from '#shared/types/charge'
import type { EventMessage } from '@chatgame/types'
import type { BacklogItem } from '~/components/BacklogList.vue'
import { QUEST_TEMPLATES } from '#shared/quest/templates'
import { getRandInteger } from '#shared/utils/random'

const FAKE_NAMES = ['kungfux010', 'sava5621', 'BezSovesty', 'mr_pickles', 'night_owl', 'pixel_ninja', 'stream_queen', 'code_wizard']

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
    couponsTaken: 0,
    streamStartedAt: new Date().toISOString(),
  })
  const viewerCount = ref(randomInt(50, 200))
  const caravan = ref<CaravanState>({
    fromVillage: 'Дубровка',
    toVillage: 'Камнеград',
    cargo: 'Древесина',
    cargoIcon: 'lucide:tree-pine',
    xpReward: 5,
    distanceTraveled: 0,
    distanceTotal: 400,
    isPaused: false,
    pauseEndsAt: null,
    departedAt: Date.now(),
  })
  const backlogItems = ref<BacklogItem[]>([])
  const alerts = ref<EventMessage[]>([])

  let idCounter = 0
  const intervals: ReturnType<typeof setInterval>[] = []

  function nextId() {
    return `fake-${++idCounter}`
  }

  function pick<T>(arr: T[]): T {
    return arr[getRandInteger(0, arr.length - 1)]!
  }

  function randomInt(min: number, max: number) {
    return getRandInteger(min, max)
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
    if (getRandInteger(1, 100) <= 2) {
      stats.value.treesChopped++
    }

    // Caravan progress
    const c = caravan.value
    if (c.isPaused) {
      if (c.pauseEndsAt && now >= c.pauseEndsAt) {
        const villages = ['Дубровка', 'Камнеград', 'Туманное', 'Зелёный Дол', 'Кристалловка']
        const cargos = ['Древесина', 'Кристаллы', 'Специи', 'Руда', 'Ткани']
        let dest: string
        do {
          dest = pick(villages)
        } while (dest === c.fromVillage)
        caravan.value = {
          fromVillage: c.fromVillage,
          toVillage: dest,
          cargo: pick(cargos),
          cargoIcon: 'lucide:package',
          xpReward: randomInt(3, 15),
          distanceTraveled: 0,
          distanceTotal: randomInt(300, 600),
          isPaused: false,
          pauseEndsAt: null,
          departedAt: now,
        }
      }
    } else if (!isStopped.value) {
      c.distanceTraveled += speed.value
      if (c.distanceTraveled >= c.distanceTotal) {
        caravan.value = {
          fromVillage: c.toVillage,
          toVillage: '',
          cargo: '',
          cargoIcon: '',
          xpReward: 0,
          distanceTraveled: 0,
          distanceTotal: 0,
          isPaused: true,
          pauseEndsAt: now + 15_000,
          departedAt: now,
        }
      }
    }

    // Fluctuate viewers
    viewerCount.value = Math.max(0, viewerCount.value + randomInt(-2, 3))
    if (viewerCount.value > stats.value.peakViewers) {
      stats.value.peakViewers = viewerCount.value
    }
  }

  function addFakeMessage() {
    stats.value.messagesCount++
  }

  const activeQuestViewers = new Set<string>()

  function addBacklogItem() {
    const isQuest = getRandInteger(0, 1) === 0

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
    caravan,
    backlogItems,
    alerts,
    start,
    stop,
  }
}
