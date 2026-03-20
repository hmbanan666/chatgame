import type {
  CharacterEditionWithCharacter,
  WebSocketEvents,
  WebSocketMessage,
} from '@chat-game/types'
import type { UseWebSocketReturn } from '@vueuse/core'
import type { Application, Container, Sprite } from 'pixi.js'

export interface GameAddon extends Container {
  id: string
  client: 'WAGON_CLIENT'
  children: GameObject[]
  tick: number
  bottomY: number
  wagon: GameObjectWagon | null
  player: GameObjectPlayer | null
  app: Application
  assetService: AssetService
  playerService: PlayerService
  treeService: TreeService
  websocketService: WebSocketService
  updateUI: () => void
  openLoader: () => void
  vibrate: () => void
  play: () => void
  checkIfThisFlagIsTarget: (id: string) => boolean
  findObject: (id: string) => GameObject | undefined
  createObject: (data: { type: GameObject['type'], id: string, x: number, zIndex?: number }) => void
  removeObject: (id: string) => void
  rebuildScene: () => void
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
  isOnWagonPath: boolean
  addon: GameAddon
  script: Script | undefined
  live: () => void
  animate: () => void
  move: () => boolean
  setTarget: (obj: GameObject) => void
}

export interface GameObjectFlag extends GameObject {
  variant: 'MOVEMENT' | 'OUT_OF_SCREEN' | 'PLAYER_MOVEMENT'
}

export interface GameObjectTree extends GameObject {
  isAnObstacleToWagon: boolean
  variant: 'GREEN' | 'VIOLET' | 'STONE' | 'TEAL' | 'TOXIC' | 'BLUE'
  treeType: '1' | '2' | '3' | '4' | '5'
  maxSize: number
}

export interface GameObjectWagon extends GameObject {
  createFlagAndMove: (x: number) => void
}

export interface GameObjectUnit extends GameObject {
  name: string
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
  canClick: boolean
  nextClick: number
  click: () => void
}

export interface WebSocketService {
  roomId: string | null
  socket: UseWebSocketReturn<WebSocketMessage>
  connect: (roomId: string) => void
  send: (event: WebSocketEvents) => void
}

export interface PlayerService {
  activePlayers: GameObjectPlayer[]
  createPlayer: (data: { id: string, x: number, character?: CharacterEditionWithCharacter }) => Promise<GameObjectPlayer>
  removePlayer: (id: string) => void
  movePlayer: (data: { id: string, x: number }) => void
  update: () => void
}

export interface AssetService {
  sprite: (alias: string) => Sprite
}

export interface TreeService {
  create: (data: { id: string, x: number, zIndex: number, treeType: GameObjectTree['treeType'], variant: GameObjectTree['variant'], size: number, maxSize: number }) => void
  update: () => void
  getNearestObstacle: (x: number) => GameObjectTree | undefined
}

export type GameObjectState
  = | 'MOVING'
    | 'IDLE'
    | 'WAITING'
    | 'CHOPPING'
    | 'MINING'
    | 'DESTROYED'

export type GameObjectDirection = 'LEFT' | 'RIGHT'

type GameObjectType = 'PLAYER' | 'RAIDER' | 'FLAG' | 'TREE' | 'WAGON'

export interface Script {
  id: string
  tasks: Task[]
  isInterruptible: boolean
  live: () => void
}

export interface Task {
  id: string
  status: 'IDLE' | 'ACTIVE' | 'DONE'
  target?: GameObject
  live: () => void
}
