import type { CaravanState } from '#shared/types/charge'

const VILLAGES = [
  'Дубровка', 'Камнеград', 'Туманное', 'Зелёный Дол', 'Кристалловка',
  'Берёзовка', 'Каменка', 'Вольный Стан', 'Тихий Омут', 'Медовая Поляна',
  'Ржавый Мост', 'Лунная Роща', 'Горный Приют', 'Сосновый Бор', 'Озёрный Край',
]

const CARGO_TYPES = [
  { name: 'Древесина', icon: 'lucide:tree-pine', xpReward: 5 },
  { name: 'Кристаллы', icon: 'lucide:gem', xpReward: 8 },
  { name: 'Специи', icon: 'lucide:leaf', xpReward: 3 },
  { name: 'Руда', icon: 'lucide:pickaxe', xpReward: 10 },
  { name: 'Ткани', icon: 'lucide:shirt', xpReward: 4 },
  { name: 'Мёд', icon: 'lucide:droplet', xpReward: 4 },
  { name: 'Оружие', icon: 'lucide:swords', xpReward: 12 },
  { name: 'Зелья', icon: 'lucide:flask-conical', xpReward: 6 },
  { name: 'Книги', icon: 'lucide:book-open', xpReward: 5 },
  { name: 'Драгоценности', icon: 'lucide:crown', xpReward: 15 },
]

// Pause duration in ms (45 seconds)
export const CARAVAN_PAUSE_MS = 45_000

// Route distance in abstract units (1 unit = 1 second at speed 1)
// 300-600 units = ~5-10 min of travel
const ROUTE_DISTANCE_MIN = 300
const ROUTE_DISTANCE_MAX = 600

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

let lastVillage = ''

export function createNextRoute(currentVillage?: string): CaravanState {
  const from = currentVillage ?? pick(VILLAGES)

  // Pick a different destination
  let to: string
  do {
    to = pick(VILLAGES)
  } while (to === from || to === lastVillage)
  lastVillage = to

  const cargo = pick(CARGO_TYPES)

  return {
    fromVillage: from,
    toVillage: to,
    cargo: cargo.name,
    cargoIcon: cargo.icon,
    xpReward: cargo.xpReward,
    distanceTraveled: 0,
    distanceTotal: randInt(ROUTE_DISTANCE_MIN, ROUTE_DISTANCE_MAX),
    isPaused: false,
    pauseEndsAt: null,
    departedAt: Date.now(),
  }
}

export function createPausedState(village: string): CaravanState {
  return {
    fromVillage: village,
    toVillage: '',
    cargo: '',
    cargoIcon: '',
    xpReward: 0,
    distanceTraveled: 0,
    distanceTotal: 0,
    isPaused: true,
    pauseEndsAt: Date.now() + CARAVAN_PAUSE_MS,
    departedAt: Date.now(),
  }
}
