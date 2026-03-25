export type EventMessage
  = | NewPlayerMessage
    | WagonFlipMessage
    | WagonFuelStateMessage

export type NewPlayerMessage = {
  event: 'newPlayerMessage'
  data: {
    player: {
      id: string
      name: string
      codename: string
      level: number
    }
    text: string
  }
}

export type WagonFlipMessage = {
  event: 'wagonFlip'
}

export type WagonFuelStateMessage = {
  event: 'wagonFuelState'
  data: {
    hasFuel: boolean
    speedMultiplier: number
  }
}
