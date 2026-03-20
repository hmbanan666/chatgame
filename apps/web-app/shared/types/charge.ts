import type { EventMessage } from '@chat-game/types'

export interface Charge {
  id: string
  startedAt: string
  energy: number
  baseRate: number
  difficulty: number
  twitchStreamId: string
  twitchStreamName: string
}

export interface ChargeInstance extends Charge {}

export interface ChargeService {}

export interface ChargeEventService extends ChargeService {
  stream: EventStream | null
  send: (event: EventMessage) => Promise<void>
}

export interface EventStream {
  push: (message: string) => Promise<void>
}

export interface ChargeModifier {
  id: string
  createdAt: number
  expiredAt: number
  code: string
  userName: string
  isExpired: boolean
}
