import type { AnimatedSprite, Application, Container, Sprite } from 'pixi.js'

export interface Game extends Container {
  id: string
  tick: number
  bottomY: number
  app: Application
  worldContainer: Container
  children: GameObject[]
  assetService: AssetService
  eventService: EventService
  wagonService: WagonService
  playerService: PlayerService
  treeService: TreeService
  init: (window: { width: number }) => Promise<void>
  addDecoration: (child: Container) => void
  removeObject: (id: string) => void
}

export type GameObjectType = 'PLAYER' | 'TREE' | 'WAGON'

export type GameObjectState
  = | 'MOVING'
    | 'IDLE'
    | 'WAITING'
    | 'CHOPPING'
    | 'MINING'
    | 'DESTROYED'

export type GameObjectDirection = 'LEFT' | 'RIGHT'

export type GameUnitCodename
  = | 'twitchy'
    | 'telegramo'
    | 'banana'
    | 'burger'
    | 'catchy'
    | 'claw'
    | 'gentleman'
    | 'marshmallow'
    | 'pioneer'
    | 'pup'
    | 'santa'
    | 'shape'
    | 'sharky'
    | 'woody'
    | 'wooly'

export type GameUnitAnimations = {
  idle: { alias: GameUnitAnimationAlias, src: string }
  moving: { alias: GameUnitAnimationAlias, src: string }
}

export type GameUnitAnimationType = keyof GameUnitAnimations

export type GameUnitAnimationAlias = `units.${GameUnitCodename}.${'idle' | 'moving'}`

/** Minimal interface for movement targets — coordinates + state */
export interface MovementTarget {
  x: number
  y: number
  destroyed: boolean
  state: GameObjectState
  target?: MovementTarget | undefined
}

export interface GameScript {
  id: string
  tasks: GameScriptTask[]
  isInterruptible: boolean
  live: () => void
  destroy?: () => void
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
  target: MovementTarget | undefined
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
  startFlip: () => void
}

export type BiomeVariant = 'GREEN' | 'BLUE' | 'STONE' | 'TEAL' | 'TOXIC' | 'VIOLET'

export interface GameObjectTree extends GameObject {
  variant: BiomeVariant
  treeType: '1' | '2' | '3' | '4' | '5'
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
  initName: (name: string, level?: number) => void
  updateLastActionAt: () => void
}

export interface AssetService {
  getSprite: (alias: string) => Sprite
  getAnimatedSprite: (codename: GameUnitCodename, type: GameUnitAnimationType) => Promise<AnimatedSprite>
}

export interface EventService {
}

export interface WagonService {
  wagon: GameObjectWagon | null
  init: () => void
  updateCameraPosition: () => void
  getNearestObstacle: () => GameObject | undefined
  getAvailableObstacle: () => GameObject | undefined
  getNearestTrees: () => GameObject[]
  getRandomNearPoint: () => { x: number, y: number }
  getOffScreenPoint: () => { x: number, y: number }
}

export interface PlayerService {
  activePlayers: GameObjectPlayer[]
  update: () => void
  init: (
    id: string,
    name: string,
    codename?: string | null,
    level?: number,
  ) => Promise<GameObjectPlayer>
}

export interface TreeServiceCreateOptions {
  id: string
  x: number
  zIndex?: number
  treeType?: GameObjectTree['treeType']
  variant?: GameObjectTree['variant']
  size: number
  maxSize: number
}

export interface TreeService {
  create: (options: TreeServiceCreateOptions) => GameObjectTree
  update: () => void
  getBiomeAt: (x: number) => string
}
