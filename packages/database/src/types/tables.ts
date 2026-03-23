import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type * as tables from '../tables'

export type Profile = InferSelectModel<typeof tables.profiles>
export type ProfileDraft = InferInsertModel<typeof tables.profiles>

export type Payment = InferSelectModel<typeof tables.payments>
export type Product = InferSelectModel<typeof tables.products>
export type ProductItem = InferSelectModel<typeof tables.productItems>

export type TwitchToken = InferSelectModel<typeof tables.twitchTokens>
export type TwitchAccessToken = InferSelectModel<typeof tables.twitchAccessTokens>

export type Player = InferSelectModel<typeof tables.players>

export type InventoryItem = InferSelectModel<typeof tables.inventoryItems>
export type InventoryItemEdition = InferSelectModel<typeof tables.inventoryItemEditions>

export type Character = InferSelectModel<typeof tables.characters>
export type CharacterEdition = InferSelectModel<typeof tables.characterEditions>
export type CharacterLevel = InferSelectModel<typeof tables.characterLevels>

export type Coupon = InferSelectModel<typeof tables.coupons>

export type Quest = InferSelectModel<typeof tables.quests>
export type QuestEdition = InferSelectModel<typeof tables.questEditions>
export type QuestReward = InferSelectModel<typeof tables.questRewards>

export type Transaction = InferSelectModel<typeof tables.transactions>
