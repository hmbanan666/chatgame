import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type * as tables from '../tables'

export type Profile = InferSelectModel<typeof tables.profiles>
export type ProfileDraft = InferInsertModel<typeof tables.profiles>

export type Payment = InferSelectModel<typeof tables.payments>
export type Product = InferSelectModel<typeof tables.products>
export type ProductItem = InferSelectModel<typeof tables.productItems>

export type TwitchToken = InferSelectModel<typeof tables.twitchTokens>
export type OAuthAccessToken = InferSelectModel<typeof tables.oauthAccessTokens>

export type StreamerViewer = InferSelectModel<typeof tables.streamerViewers>
export type StreamerTag = InferSelectModel<typeof tables.streamerTags>
export type StreamerViewerTag = InferSelectModel<typeof tables.streamerViewerTags>
export type WidgetToken = InferSelectModel<typeof tables.widgetTokens>

export type InventoryItem = InferSelectModel<typeof tables.inventoryItems>
export type InventoryItemEdition = InferSelectModel<typeof tables.inventoryItemEditions>

export type Character = InferSelectModel<typeof tables.characters>
export type CharacterEdition = InferSelectModel<typeof tables.characterEditions>

export type Coupon = InferSelectModel<typeof tables.coupons>

export type Transaction = InferSelectModel<typeof tables.transactions>
