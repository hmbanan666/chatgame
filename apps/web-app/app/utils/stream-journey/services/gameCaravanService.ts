import type { Game } from '../types'

const VILLAGE_NAMES = [
  'Дубровка', 'Камнеград', 'Туманное', 'Зелёный Дол', 'Кристалловка',
  'Берёзовка', 'Каменка', 'Вольный Стан', 'Тихий Омут', 'Медовая Поляна',
]

const CARGO_TYPES = [
  { name: 'Древесина', xpReward: 5 },
  { name: 'Кристаллы', xpReward: 8 },
  { name: 'Специи', xpReward: 3 },
  { name: 'Руда', xpReward: 10 },
  { name: 'Ткани', xpReward: 4 },
  { name: 'Мёд', xpReward: 4 },
  { name: 'Оружие', xpReward: 12 },
  { name: 'Зелья', xpReward: 6 },
  { name: 'Книги', xpReward: 5 },
  { name: 'Драгоценности', xpReward: 15 },
]

const PAUSE_DURATION = 45_000 // ms

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export interface CaravanState {
  fromVillage: string
  toVillage: string
  cargo: string
  xpReward: number
  startX: number
  targetX: number
  isPaused: boolean
  pauseEndsAt: number | null
}

export class GameCaravanService {
  state: CaravanState

  private villageIndex = 0
  private lastSentProgress = -1
  private savedSpeed = 20

  constructor(readonly game: Game) {
    // Start paused at first village
    this.state = {
      fromVillage: this.nextVillageName(),
      toVillage: '',
      cargo: '',
      xpReward: 0,
      startX: 0,
      targetX: 0,
      isPaused: true,
      pauseEndsAt: Date.now() + 5000, // short initial pause
    }
  }

  update() {
    const wagon = this.game.wagonService.wagon
    if (!wagon) {
      return
    }

    const c = this.state

    if (c.isPaused) {
      // Stop wagon in village
      if (wagon.speedPerSecond > 0) {
        this.savedSpeed = wagon.speedPerSecond
      }
      wagon.speedPerSecond = 0
      wagon.script = undefined
      wagon.target = undefined
      wagon.state = 'IDLE'

      if (c.pauseEndsAt && Date.now() >= c.pauseEndsAt) {
        this.depart(wagon.x)
      }
      return
    }

    // Check if arrived (wagon passed target village X)
    if (wagon.x >= c.targetX) {
      this.arrive()
    }
  }

  private depart(wagonX: number) {
    // Restore wagon movement
    const wagon = this.game.wagonService.wagon
    if (wagon) {
      wagon.speedPerSecond = this.savedSpeed
    }

    // Get next village from ChunkService
    const nextVillage = this.game.chunkService.getNextVillageChunk()
    const targetX = nextVillage ? (nextVillage.startX + nextVillage.endX) / 2 : wagonX + 15000
    const cargo = pick(CARGO_TYPES)

    this.state = {
      fromVillage: this.state.fromVillage,
      toVillage: nextVillage?.name ?? this.nextVillageName(),
      cargo: cargo.name,
      xpReward: cargo.xpReward,
      startX: wagonX,
      targetX,
      isPaused: false,
      pauseEndsAt: null,
    }
  }

  private arrive() {
    this.state = {
      fromVillage: this.state.toVillage,
      toVillage: '',
      cargo: '',
      xpReward: 0,
      startX: 0,
      targetX: 0,
      isPaused: true,
      pauseEndsAt: Date.now() + PAUSE_DURATION,
    }
  }

  get progress(): number {
    const c = this.state
    if (c.isPaused || c.targetX <= c.startX) {
      return 0
    }
    const wagon = this.game.wagonService.wagon
    if (!wagon) {
      return 0
    }
    return Math.min(1, (wagon.x - c.startX) / (c.targetX - c.startX))
  }

  /** Data to send to server via WS */
  getServerSyncData() {
    const prog = Math.round(this.progress * 100)
    // Only send if progress changed
    if (prog === this.lastSentProgress) {
      return null
    }
    this.lastSentProgress = prog

    return {
      fromVillage: this.state.fromVillage,
      toVillage: this.state.toVillage,
      cargo: this.state.cargo,
      xpReward: this.state.xpReward,
      progress: this.progress,
      isPaused: this.state.isPaused,
    }
  }

  private nextVillageName(): string {
    const name = VILLAGE_NAMES[this.villageIndex % VILLAGE_NAMES.length]!
    this.villageIndex++
    return name
  }
}
