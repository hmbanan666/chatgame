export interface Profile {
  id: string
  createdAt: Date
  updatedAt: Date
  twitchId: string
  userName: string
  isStreamer: boolean
  coupons: number
  coins: number
  level: number
  mana: number
  activeEditionId: string
  donationAlertsUserId: string | null
  streamerPremiumPaidAt: Date | null
}

export interface ProfileWithTokens extends Profile {
  twitchTokens: TwitchToken[]
}

export interface ProfileWithOwnedCharacters extends Profile {
  characterEditions: CharacterEditionWithCharacter[]
}

export interface ProfileCreateResponse {
  ok: boolean
  result: Profile
}

export interface TokenCreateResponse {
  ok: boolean
  result: TwitchToken
}

export interface TwitchToken {
  id: string
  createdAt: Date
  updatedAt: Date
  onlineAt: Date
  status: 'ACTIVE' | 'INACTIVE'
  type: 'ADDON'
  points: number
  language: 'ru' | 'en'
  profileId: string
  accessTokenId: string | null
}

export interface TwitchTokenWithProfile extends TwitchToken {
  profile: Profile
}

export interface Character {
  id: string
  createdAt: Date
  updatedAt: Date
  name: string
  description: string
  codename: string
  nickname: string
  isReady: boolean
  unlockedBy: 'COINS' | 'SHOP' | 'TROPHY' | 'STREAMER_CURRENCY'
  price: number
  coefficient: number
  streamerId: string | null
}

export interface CharacterWithProfile extends Character {
  profile: Profile
  editions: CharacterEdition[]
}

export interface CharacterWithEditions extends Character {
  editions: CharacterEdition[]
}

export interface CharacterEdition {
  id: string
  createdAt: Date
  updatedAt: Date
  level: number
  xp: number
  profileId: string
  characterId: string
}

export interface CharacterEditionWithCharacter extends CharacterEdition {
  character: Character
}

export interface CharacterEditionWithProfile extends CharacterEdition {
  profile: Profile
  character: Character
}

export interface CharacterLevel {
  id: string
  createdAt: Date
  updatedAt: Date
  level: number
  requiredXp: number
  awardAmount: number
  inventoryItemId: string | null
  characterId: string
}

export type CharacterLevelWithItem = CharacterLevel & {
  inventoryItem: InventoryItem
}

export type CharacterEditionData = CharacterEdition & {
  character: Character
  levels: CharacterLevelWithItem[]
  currentLevel: CharacterLevelWithItem | null
  nextLevel: CharacterLevelWithItem | null
  xpToNextLevel: number | null
}

export type CharacterWithLevels = Character & {
  levels: CharacterLevelWithItem[]
}

export type CharacterEditionsOnProfileData = (CharacterEdition & {
  character: CharacterWithLevels
})[]

export interface ActiveCharacter extends CharacterEditionWithCharacter {
  lastActionAt: Date
  token: string
}

export interface Coupon {
  id: string
  createdAt: Date
  updatedAt: Date
  activationCommand: string
  status: 'CREATED' | 'TAKEN'
  profileId: string | null
}

export interface StreamerCurrency {
  id: string
  createdAt: Date
  updatedAt: Date
  name: string
  emoji: string
  characterPrice: number
  streamerId: string
  characterId: string | null
}

export interface StreamerCurrencyBalance {
  id: string
  createdAt: Date
  updatedAt: Date
  balance: number
  streamerId: string
  profileId: string
}

export interface StreamEngagement {
  id: string
  createdAt: Date
  tier1Claimed: boolean
  tier2Claimed: boolean
  tokensAwarded: number
  streamId: string
  profileId: string
}

/** @deprecated Use StreamerViewer for per-streamer viewer data */
export interface Player {
  id: string
  name: string
  profileId: string
}

export interface InventoryItem {
  id: string
  createdAt: Date
  updatedAt: Date
  type: InventoryItemType
  name: string
  description: string
}

export type InventoryItemType = 'BASIC_WOOD' | 'BASIC_CURRENCY' | 'BASIC_FOOD' | 'BASIC_MANUFACTURE' | 'SEASONAL'

export interface InventoryItemEdition {
  id: string
  createdAt: Date
  updatedAt: Date
  amount: number
  durability: number
  itemId: string
  profileId: string
}

export interface TwitchServiceStatus {
  service: 'HMBANAN666_TWITCH' | 'COUPON_GENERATOR'
  status: 'RUNNING' | 'STOPPED'
}

export interface Transaction {
  id: string
  createdAt: Date
  updatedAt: Date
  profileId: string
  entityId: string
  amount: number
  type:
    | 'CHARACTER_UNLOCK'
    | 'COIN_FROM_LVL_UP'
    | 'COINS_FROM_COUPON'
    | 'POINTS_FROM_LEVEL_UP'
    | 'POINTS_FROM_CHARACTER_UNLOCK'
    | 'STREAMER_PREMIUM_UNLOCK'
    | 'COINS_FROM_STREAMER_GIFT'
    | 'STREAMER_GIFT_SENT'
    | 'STREAMER_TOKEN_EARNED'
    | 'COUPONS_EXCHANGED'
  text: string | null
}

export interface TransactionWithProfile extends Transaction {
  profile: Profile
}

export interface Product {
  id: string
  createdAt: Date
  updatedAt: Date
  finishAt: Date | null
  title: string
  description: string
  coins: number
  bonusCoins: number
  price: number
  regularPrice: number
  isActive: boolean
  priority: number
  singlePurchase: boolean
}

export interface ProductItem {
  id: string
  createdAt: Date
  updatedAt: Date
  productId: string
  type: 'COIN' | 'CHARACTER'
  amount: number
  priority: number
  entityId: string | null
}

export interface Payment {
  id: string
  createdAt: Date
  updatedAt: Date
  profileId: string
  productId: string
  status: 'PENDING' | 'PAID'
  externalId: string
  provider: 'YOOKASSA'
  amount: number
}

export interface TwitchAccessTokenResponse {
  access_token: string
  refresh_token: string
  scope: string[]
  expires_in: number
  token_type: 'bearer'
}

// ── Constants ──────────────────────────────────────────────

export const STREAMER_PREMIUM_COST = 100

export interface TwitchAccessToken {
  id: string
  userId: string
  accessToken: string
  refreshToken: string | null
  scope: string[]
  expiresIn: number | null
  obtainmentTimestamp: number
}
