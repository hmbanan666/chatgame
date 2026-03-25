import type { CharacterEditionWithCharacter } from './types'

export type EventMessage = { id: string } & Events

export type Events
  = | EventNewPlayerMessage
    | EventQuestComplete
    | EventDonation
    | EventCouponTaken
    | EventLevelUp
    | EventNewViewer
    | EventWagonAction

type EventNewPlayerMessage = {
  type: 'NEW_PLAYER_MESSAGE'
  data: {
    text: string
    player: {
      id: string
      name: string
    }
    character: CharacterEditionWithCharacter
  }
}

type EventQuestComplete = {
  type: 'QUEST_COMPLETE'
  data: {
    userName: string
    codename: string
    questText: string
    reward: number
    totalCoins: number
  }
}

type EventDonation = {
  type: 'DONATION'
  data: {
    userName: string
    codename: string
    amount: number
    currency: string
    message: string
  }
}

type EventCouponTaken = {
  type: 'COUPON_TAKEN'
  data: {
    userName: string
    codename: string
    totalCoupons: number
  }
}

type EventLevelUp = {
  type: 'LEVEL_UP'
  data: {
    userName: string
    codename: string
    level: number
    reward: number
  }
}

type EventNewViewer = {
  type: 'NEW_VIEWER'
  data: {
    userName: string
    codename: string
  }
}

type EventWagonAction = {
  type: 'WAGON_ACTION'
  data: {
    userName: string
    codename: string
    action: string
    actionTitle: string
    actionDescription: string
  }
}
