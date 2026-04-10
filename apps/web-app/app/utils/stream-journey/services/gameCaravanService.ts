import type { Game } from '../types'

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

  private lastSentProgress = -1
  private savedSpeed = 20

  constructor(readonly game: Game) {
    // Start paused at the first village. Name is resolved lazily in update()
    // once the chunk service has generated the initial village chunk.
    this.state = {
      fromVillage: '',
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

    // Lazy-resolve initial fromVillage once the chunk service has it
    if (!c.fromVillage) {
      const current = this.game.chunkService.getCurrentChunk()
      if (current?.type === 'village') {
        c.fromVillage = current.name
      }
    }

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
    // ChunkService is the single source of truth for village names. If the
    // next village chunk hasn't been generated yet (steady-state generates
    // one chunk per frame), extend the pause and retry on a later tick
    // instead of falling back to a mismatched name.
    const nextVillage = this.game.chunkService.getNextVillageChunk()
    if (!nextVillage) {
      this.state.pauseEndsAt = Date.now() + 500
      return
    }

    const wagon = this.game.wagonService.wagon
    if (wagon) {
      wagon.speedPerSecond = this.savedSpeed
    }

    const targetX = (nextVillage.startX + nextVillage.endX) / 2
    const cargo = pick(CARGO_TYPES)

    this.state = {
      fromVillage: this.state.fromVillage,
      toVillage: nextVillage.name,
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
}
