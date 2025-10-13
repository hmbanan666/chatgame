export type EventMessage
  = | NewPlayerMessage

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
