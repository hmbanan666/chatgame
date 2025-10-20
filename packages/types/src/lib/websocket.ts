import type { CharacterEditionWithCharacter, Player, Profile } from './types'

export type GameObject = {
  id: string
  x: number
  state: 'IDLE' | 'MOVING'
  health: number
  speedPerSecond: number
  size: number
  zIndex: number
} & GameObjects

export type GameObjects = GameObjectTree | GameObjectFlag | GameObjectWagon | GameObjectPlayer

export interface GameObjectTree {
  type: 'TREE'
  variant: 'GREEN' | 'VIOLET' | 'STONE' | 'TEAL' | 'TOXIC' | 'BLUE'
  treeType: '1' | '2' | '3' | '4' | '5'
  maxSize: number
}

export interface GameObjectFlag {
  type: 'FLAG'
}

export interface GameObjectWagon {
  type: 'WAGON'
}

export interface GameObjectPlayer {
  type: 'PLAYER'
  telegramId: string
  character: CharacterEditionWithCharacter
}

export type WebSocketMessage = { id: string } & WebSocketEvents

export type WebSocketEvents
  = | WebSocketConnect
    | WebSocketConnectAddon
    | WebSocketConnectedToWagonRoom
    | WebSocketDisconnectedFromWagonRoom
    | WebSocketEventCommand
    | WebSocketEventMessage
    | WebSocketEventLevelUp
    | WebSocketNewTree
    | WebSocketDestroyTree
    | WebSocketNewWagonTarget
    | WebSocketNewPlayerTarget
    | WebSocketWagonRoomDestroy

export interface WebSocketConnectAddon {
  type: 'CONNECT_ADDON'
  data: {
    token: string
  }
}

export interface WebSocketConnect {
  type: 'CONNECT'
  data: {
    client: 'TELEGRAM_CLIENT' | 'WAGON_CLIENT' | 'SERVER'
    id: string
    telegramId?: string
  }
}

export interface WebSocketEventCommand {
  type: 'COMMAND'
  data: {
    command: string
    params: string[]
    player: Player
    profile: Profile
    character: CharacterEditionWithCharacter
    text: string
  }
}

export interface WebSocketEventMessage {
  type: 'MESSAGE'
  data: {
    player: Player
    profile: Profile
    character: CharacterEditionWithCharacter
    text: string
  }
}

export interface WebSocketEventLevelUp {
  type: 'LEVEL_UP'
  data: {
    text: string
    playerId: string
  }
}

export interface WebSocketConnectedToWagonRoom {
  type: 'CONNECTED_TO_WAGON_ROOM'
  data: {
    id: string
    roomId: string
    type: 'WAGON' | 'PLAYER'
    objects: GameObject[]
  }
}

export interface WebSocketDisconnectedFromWagonRoom {
  type: 'DISCONNECTED_FROM_WAGON_ROOM'
  data: {
    id: string
  }
}

export interface WebSocketNewWagonTarget {
  type: 'NEW_WAGON_TARGET'
  data: {
    x: number
  }
}

export interface WebSocketNewPlayerTarget {
  type: 'NEW_PLAYER_TARGET'
  data: {
    id: string
    x: number
  }
}

export interface WebSocketNewTree {
  type: 'NEW_TREE'
  data: {
    id: string
    x: number
    zIndex: number
    treeType: GameObjectTree['treeType']
    variant: GameObjectTree['variant']
    size: number
    maxSize: number
  }
}

export interface WebSocketDestroyTree {
  type: 'DESTROY_TREE'
  data: {
    id: string
  }
}

export interface WebSocketWagonRoomDestroy {
  type: 'ROOM_DESTROYED'
  data: {
    id: string
  }
}
