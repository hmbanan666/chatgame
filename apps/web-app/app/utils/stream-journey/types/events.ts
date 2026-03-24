export type EventMessage
  = | NewPlayerMessage
    | WagonFlipMessage

export type NewPlayerMessage = {
  event: 'newPlayerMessage'
  data: {
    player: {
      id: string
      name: string
      codename: string
    }
    text: string
  }
}

export type WagonFlipMessage = {
  event: 'wagonFlip'
}
