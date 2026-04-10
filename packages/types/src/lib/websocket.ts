export type WebSocketMessage = { id: string } & WebSocketEvents

export type WebSocketEvents
  = | WebSocketConnect
    | WebSocketConnectAddon
    | WebSocketConnectGame
    | WebSocketConnectAlerts
    | WebSocketConnectDashboard
    | WebSocketUpdateBiome
    | WebSocketTreeDestroyed

export interface WebSocketConnectAddon {
  type: 'CONNECT_ADDON'
  data: {
    token: string
  }
}

export interface WebSocketConnectGame {
  type: 'CONNECT_GAME'
  data: {
    roomId: string
  }
}

export interface WebSocketConnectAlerts {
  type: 'CONNECT_ALERTS'
  data: {
    roomId: string
  }
}

export interface WebSocketConnectDashboard {
  type: 'CONNECT_DASHBOARD'
  data: {
    roomId: string
  }
}

export interface WebSocketConnect {
  type: 'CONNECT'
  data: {
    client: 'WAGON_CLIENT' | 'SERVER'
    id: string
  }
}

export interface WebSocketUpdateBiome {
  type: 'UPDATE_BIOME'
  data: {
    roomId: string
    biome: string
  }
}

export interface WebSocketTreeDestroyed {
  type: 'TREE_DESTROYED'
  data: {
    roomId: string
  }
}
