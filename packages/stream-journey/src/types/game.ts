import type { AnimatedSprite, Application, Container, Sprite } from 'pixi.js'

export interface Game extends Container {
  id: string
  tick: number
  bottomY: number
  app: Application
  children: GameObject[]
  assetService: AssetService
  eventService: EventService
  wagonService: WagonService
  playerService: PlayerService
  treeService: TreeService
  init: (window: { width: number }) => Promise<void>
}

export type GameObjectType = 'PLAYER' | 'RAIDER' | 'FLAG' | 'TREE' | 'WAGON'

export type GameObjectState
  = | 'MOVING'
    | 'IDLE'
    | 'WAITING'
    | 'CHOPPING'
    | 'MINING'
    | 'DESTROYED'

export type GameObjectDirection = 'LEFT' | 'RIGHT'

export type GameUnitAnimationAlias = 'twitchy.unit.idle' | 'twitchy.unit.moving'

export interface GameScript {
  id: string
  tasks: GameScriptTask[]
  isInterruptible: boolean
  live: () => void
}

export interface GameScriptTask {
  id: string
  status: 'IDLE' | 'ACTIVE' | 'DONE'
  target?: GameObject
  live: () => void
}

export interface GameObject extends Container {
  id: string
  type: GameObjectType
  state: GameObjectState
  direction: GameObjectDirection
  target: GameObject | undefined
  health: number
  speedPerSecond: number
  size: number
  maxSize: number
  isObstacleForWagon: boolean
  minDistance: number
  game: Game
  script: GameScript | undefined
  live: () => void
  animate: () => void
  move: () => boolean
  setTarget: (obj: GameObject) => void
}

export interface GameObjectWagon extends GameObject {
  createFlagAndMove: (x: number) => void
}

export interface GameObjectTree extends GameObject {
  variant: 'GREEN' | 'VIOLET' | 'STONE' | 'TEAL' | 'TOXIC' | 'BLUE'
  treeType: '1' | '2' | '3' | '4' | '5'
}

export interface GameObjectFlag extends GameObject {
  variant: 'MOVEMENT' | 'OUT_OF_SCREEN' | 'PLAYER_MOVEMENT'
}

export interface GameObjectUnit extends GameObject {
  name: string
  coins: number
  visual: {
    head: '1'
    hairstyle: 'BOLD' | 'CLASSIC' | 'COAL_LONG' | 'ORANGE_WITH_BEARD'
    top:
      | 'VIOLET_SHIRT'
      | 'BLACK_SHIRT'
      | 'GREEN_SHIRT'
      | 'BLUE_SHIRT'
      | 'DARK_SILVER_SHIRT'
  }
  dialogue: {
    messages: { id: string, text: string }[]
  }
  addMessage: (message: string) => void
  initVisual: (codename?: string | null) => Promise<void>
}

export interface GameObjectPlayer extends GameObjectUnit {
  lastActionAt: Date
  initName: (name: string) => void
  updateLastActionAt: () => void
}

export interface AssetService {
  getSprite: (alias: string) => Sprite
  getAnimatedSprite: (alias: GameUnitAnimationAlias) => Promise<AnimatedSprite>
}

export interface EventService {
  stream: EventSource
}

export interface WagonService {
  wagon: GameObjectWagon | null
  randomNearFlag: GameObjectFlag
  randomOutFlag: GameObjectFlag
  init: () => void
  updateCameraPosition: () => void
  getNearestObstacle: () => GameObject | undefined
}

export interface PlayerService {
  activePlayers: GameObjectPlayer[]
  update: () => void
  init: (
    id: string,
    name: string,
    codename?: string | null,
  ) => Promise<GameObjectPlayer>
}

export interface TreeService {
  create: (data: { id: string, x: number, zIndex: number, treeType: GameObjectTree['treeType'], variant: GameObjectTree['variant'], size: number, maxSize: number }) => GameObjectTree
  update: () => void
}
