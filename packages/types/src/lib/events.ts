import type { CharacterEditionWithCharacter } from './types'

export type EventMessage = { id: string } & Events

export type Events
  = | EventNewPlayerMessage
    | EventQuestComplete
    | EventDonation
    | EventCouponTaken
    | EventLevelUp
    | EventNewViewer
    | EventNewFollower
    | EventRaid
    | EventPurchase
    | EventWagonAction
    | EventStreamerReward
    | EventCaravanArrived

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
    xpReward: number
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
    xpEarned: number
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

type EventNewFollower = {
  type: 'NEW_FOLLOWER'
  data: {
    userName: string
  }
}

type EventRaid = {
  type: 'RAID'
  data: {
    userName: string
    viewers: number
    xpEarned: number
  }
}

type EventPurchase = {
  type: 'PURCHASE'
  data: {
    userName: string
    coins: number
    price: number
    xpEarned: number
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
    xpEarned: number
  }
}

type EventStreamerReward = {
  type: 'STREAMER_REWARD'
  data: {
    userName: string
    codename: string
    amount: number
    rewardType: 'coins'
  }
}

type EventCaravanArrived = {
  type: 'CARAVAN_ARRIVED'
  data: {
    fromVillage: string
    toVillage: string
    cargo: string
    xpReward: number
    activeViewers: number
    viewers: { name: string, codename: string }[]
    travelTimeSec: number
  }
}
