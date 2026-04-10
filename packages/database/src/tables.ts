import { cuid2 } from 'drizzle-cuid2/postgres'
import { relations } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

// ── Profile ──────────────────────────────────────────────

export const profiles = pgTable('profile', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  twitchId: text('twitch_id'),
  userName: text('user_name'),
  isStreamer: boolean('is_streamer').notNull().default(false),
  coupons: integer('coupons').notNull().default(0),
  coins: integer('coins').notNull().default(0),
  mana: integer('mana').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  watchTimeMin: integer('watch_time_min').notNull().default(0),
  activeEditionId: text('active_edition_id'),
  donationAlertsUserId: text('donation_alerts_user_id'),
  streamerPremiumPaidAt: timestamp('streamer_premium_paid_at', { precision: 3, withTimezone: true, mode: 'date' }),
  streamerCoinsEarnedWeekly: integer('streamer_coins_earned_weekly').notNull().default(0),
  streamerWeekResetAt: timestamp('streamer_week_reset_at', { precision: 3, withTimezone: true, mode: 'date' }),
})

export const profilesRelations = relations(profiles, ({ many }) => ({
  twitchTokens: many(twitchTokens),
  characterEditions: many(characterEditions),
  transactions: many(transactions),
  itemEditions: many(inventoryItemEditions),
  payments: many(payments),
  streams: many(streams),
}))

// ── Payment ──────────────────────────────────────────────

export const payments = pgTable('payment', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  externalId: text('external_id').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  amount: integer('amount').notNull().default(0),
  productId: text('product_id').notNull(),
  profileId: text('profile_id').notNull(),
})

export const paymentsRelations = relations(payments, ({ one }) => ({
  profile: one(profiles, { fields: [payments.profileId], references: [profiles.id] }),
}))

// ── Product ──────────────────────────────────────────────

export const products = pgTable('product', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  finishAt: timestamp('finish_at', { precision: 3, withTimezone: true, mode: 'date' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  coins: integer('coins').notNull().default(0),
  bonusCoins: integer('bonus_coins').notNull().default(0),
  price: integer('price').notNull().default(0),
  regularPrice: integer('regular_price').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),
  singlePurchase: boolean('single_purchase').notNull().default(false),
})

export const productsRelations = relations(products, ({ many }) => ({
  items: many(productItems),
}))

export const productItems = pgTable('product_item', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  type: text('type').notNull(),
  amount: integer('amount').notNull().default(0),
  entityId: text('entity_id'),
  priority: integer('priority').notNull().default(0),
  productId: text('product_id').notNull(),
})

export const productItemsRelations = relations(productItems, ({ one }) => ({
  product: one(products, { fields: [productItems.productId], references: [products.id] }),
}))

// ── Stream ──────────────────────────────────────────────

export const streams = pgTable('stream', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { precision: 3, withTimezone: true, mode: 'date' }),
  isLive: boolean('is_live').notNull().default(true),
  fuel: integer('fuel').notNull().default(50),
  messagesCount: integer('messages_count').notNull().default(0),
  fuelAdded: integer('fuel_added').notNull().default(0),
  fuelStolen: integer('fuel_stolen').notNull().default(0),
  treesChopped: integer('trees_chopped').notNull().default(0),
  donationsCount: integer('donations_count').notNull().default(0),
  donationsTotal: integer('donations_total').notNull().default(0),
  totalRedemptions: integer('total_redemptions').notNull().default(0),
  couponsTaken: integer('coupons_taken').notNull().default(0),
  peakViewers: integer('peak_viewers').notNull().default(0),
  averageViewers: integer('average_viewers').notNull().default(0),
  streamerId: text('streamer_id').notNull(),
})

export const streamsRelations = relations(streams, ({ one }) => ({
  streamer: one(profiles, { fields: [streams.streamerId], references: [profiles.id] }),
}))

// ── Backlog ─────────────────────────────────────────────

export const backlogItems = pgTable('backlog_item', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  text: text('text').notNull(),
  authorName: text('author_name').notNull(),
  source: text('source').notNull().default('donation'),
  status: text('status').notNull().default('new'),
  amount: integer('amount'),
  streamerId: text('streamer_id').notNull(),
  questProfileId: text('quest_profile_id'),
  questTemplateId: text('quest_template_id'),
  questProgress: integer('quest_progress').notNull().default(0),
  questGoal: integer('quest_goal'),
  questReward: integer('quest_reward'),
})

export const backlogItemsRelations = relations(backlogItems, ({ one }) => ({
  streamer: one(profiles, { fields: [backlogItems.streamerId], references: [profiles.id] }),
}))

// ── Twitch ───────────────────────────────────────────────

export const twitchTokens = pgTable('twitch_token', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  onlineAt: timestamp('online_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  status: text('status').notNull(),
  type: text('type').notNull(),
  points: integer('points').notNull().default(0),
  language: text('language').notNull().default('ru'),
  accessTokenId: text('access_token_id'),
  profileId: text('profile_id').notNull(),
})

export const twitchTokensRelations = relations(twitchTokens, ({ one }) => ({
  profile: one(profiles, { fields: [twitchTokens.profileId], references: [profiles.id] }),
}))

export const oauthAccessTokens = pgTable('oauth_access_token', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  provider: text('provider').notNull().default('twitch'),
  userId: text('user_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  scope: text('scope').array(),
  expiresIn: integer('expires_in'),
  obtainmentTimestamp: text('obtainment_timestamp').notNull(),
}, (t) => [
  unique('oauth_access_token_provider_user_id').on(t.provider, t.userId),
])

// ── Streamer Viewer (per-streamer viewer stats) ─────────

export const streamerViewers = pgTable('streamer_viewer', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  messagesCount: integer('messages_count').notNull().default(0),
  watchTimeMin: integer('watch_time_min').notNull().default(0),
  streamerId: text('streamer_id').notNull(),
  profileId: text('profile_id').notNull(),
}, (t) => [
  unique('streamer_viewer_streamer_profile').on(t.streamerId, t.profileId),
])

export const streamerViewersRelations = relations(streamerViewers, ({ one }) => ({
  streamer: one(profiles, { fields: [streamerViewers.streamerId], references: [profiles.id], relationName: 'streamerViewerAsStreamer' }),
  profile: one(profiles, { fields: [streamerViewers.profileId], references: [profiles.id], relationName: 'streamerViewerAsViewer' }),
}))

// ── Inventory ────────────────────────────────────────────

export const inventoryItems = pgTable('inventory_item', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
})

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  editions: many(inventoryItemEditions),
  rewards: many(characterLevels),
}))

export const inventoryItemEditions = pgTable('inventory_item_edition', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  amount: integer('amount').notNull().default(0),
  durability: integer('durability').notNull().default(100),
  itemId: text('item_id').notNull(),
  profileId: text('profile_id').notNull(),
})

export const inventoryItemEditionsRelations = relations(inventoryItemEditions, ({ one }) => ({
  item: one(inventoryItems, { fields: [inventoryItemEditions.itemId], references: [inventoryItems.id] }),
  profile: one(profiles, { fields: [inventoryItemEditions.profileId], references: [profiles.id] }),
}))

// ── Character ────────────────────────────────────────────

export const characters = pgTable('character', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  codename: text('codename').notNull(),
  nickname: text('nickname').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isReady: boolean('is_ready').notNull().default(false),
  unlockedBy: text('unlocked_by').notNull().default('COINS'),
  coefficient: integer('coefficient').notNull().default(1),
  price: integer('price').notNull().default(0),
  streamerId: text('streamer_id'),
})

export const charactersRelations = relations(characters, ({ many }) => ({
  editions: many(characterEditions),
  levels: many(characterLevels),
}))

export const characterEditions = pgTable('character_edition', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  playTimeMin: integer('play_time_min').notNull().default(0),
  profileId: text('profile_id').notNull(),
  characterId: text('character_id').notNull(),
})

export const characterEditionsRelations = relations(characterEditions, ({ one }) => ({
  profile: one(profiles, { fields: [characterEditions.profileId], references: [profiles.id] }),
  character: one(characters, { fields: [characterEditions.characterId], references: [characters.id] }),
}))

export const characterLevels = pgTable('character_level', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  level: integer('level').notNull(),
  requiredXp: integer('required_xp').notNull(),
  awardAmount: integer('award_amount').notNull().default(0),
  inventoryItemId: text('inventory_item_id'),
  characterId: text('character_id').notNull(),
})

export const characterLevelsRelations = relations(characterLevels, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [characterLevels.inventoryItemId], references: [inventoryItems.id] }),
  character: one(characters, { fields: [characterLevels.characterId], references: [characters.id] }),
}))

// ── Streamer Currency ───────────────────────────────────

export const streamerCurrencies = pgTable('streamer_currency', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  name: text('name').notNull(),
  namePlural: text('name_plural'),
  emoji: text('emoji').notNull(),
  characterPrice: integer('character_price').notNull().default(100),
  streamerId: text('streamer_id').notNull().unique(),
  characterId: text('character_id'),
})

export const streamerCurrenciesRelations = relations(streamerCurrencies, ({ one }) => ({
  streamer: one(profiles, { fields: [streamerCurrencies.streamerId], references: [profiles.id] }),
  character: one(characters, { fields: [streamerCurrencies.characterId], references: [characters.id] }),
}))

export const streamerCurrencyBalances = pgTable('streamer_currency_balance', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  balance: integer('balance').notNull().default(0),
  streamerId: text('streamer_id').notNull(),
  profileId: text('profile_id').notNull(),
}, (t) => [
  unique('currency_balance_streamer_profile').on(t.streamerId, t.profileId),
])

export const streamerCurrencyBalancesRelations = relations(streamerCurrencyBalances, ({ one }) => ({
  streamer: one(profiles, { fields: [streamerCurrencyBalances.streamerId], references: [profiles.id], relationName: 'currencyBalanceAsStreamer' }),
  profile: one(profiles, { fields: [streamerCurrencyBalances.profileId], references: [profiles.id], relationName: 'currencyBalanceAsViewer' }),
}))

// ── Stream Engagement ──────────────────────────────────

export const streamEngagements = pgTable('stream_engagement', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  tier1Claimed: boolean('tier1_claimed').notNull().default(false),
  tier2Claimed: boolean('tier2_claimed').notNull().default(false),
  tokensAwarded: integer('tokens_awarded').notNull().default(0),
  streamId: text('stream_id').notNull(),
  profileId: text('profile_id').notNull(),
}, (t) => [
  unique('engagement_stream_profile').on(t.streamId, t.profileId),
])

export const streamEngagementsRelations = relations(streamEngagements, ({ one }) => ({
  stream: one(streams, { fields: [streamEngagements.streamId], references: [streams.id] }),
  profile: one(profiles, { fields: [streamEngagements.profileId], references: [profiles.id] }),
}))

// ── Coupon ───────────────────────────────────────────────

export const coupons = pgTable('coupon', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  activationCommand: text('activation_command').notNull(),
  status: text('status').notNull(),
  profileId: text('profile_id'),
})

// ── Transaction ──────────────────────────────────────────

export const transactions = pgTable('transaction', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  amount: integer('amount').notNull().default(0),
  type: text('type').notNull(),
  entityId: text('entity_id').notNull(),
  text: text('text'),
  profileId: text('profile_id').notNull(),
})

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, { fields: [transactions.profileId], references: [profiles.id] }),
}))

// ── Sprite ──────────────────────────────────────────────

export const sprites = pgTable('sprite', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  codename: text('codename').notNull().unique(),
  type: text('type').notNull().default('character'),
  frameSize: integer('frame_size').notNull().default(32),
  slotRoles: jsonb('slot_roles').$type<string[]>().notNull(),
  defaultPalette: jsonb('default_palette').$type<number[]>().notNull(),
})

export const spritesRelations = relations(sprites, ({ many }) => ({
  frames: many(spriteFrames),
}))

export const spriteFrames = pgTable('sprite_frame', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  name: text('name').notNull(),
  pixels: jsonb('pixels').$type<[number, number, number][]>().notNull(),
  spriteId: text('sprite_id').notNull(),
})

export const spriteFramesRelations = relations(spriteFrames, ({ one }) => ({
  sprite: one(sprites, { fields: [spriteFrames.spriteId], references: [sprites.id] }),
}))

// ── Streamer Notes ──────────────────────────────────────

export const streamerNotes = pgTable('streamer_note', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  text: text('text').notNull().default(''),
  streamerId: text('streamer_id').notNull(),
  profileId: text('profile_id').notNull(),
}, (t) => [
  unique('streamer_note_streamer_profile').on(t.streamerId, t.profileId),
])

export const streamerNotesRelations = relations(streamerNotes, ({ one }) => ({
  streamer: one(profiles, { fields: [streamerNotes.streamerId], references: [profiles.id], relationName: 'streamerNotes' }),
  profile: one(profiles, { fields: [streamerNotes.profileId], references: [profiles.id], relationName: 'viewerNotes' }),
}))

// ── Redemptions (channel point reward history) ──────────

export const redemptions = pgTable('redemption', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  streamerId: text('streamer_id').notNull(),
  streamId: text('stream_id'),
  twitchUserId: text('twitch_user_id').notNull(),
  userName: text('user_name').notNull(),
  rewardId: text('reward_id').notNull(),
  rewardTitle: text('reward_title').notNull(),
  rewardCost: integer('reward_cost').notNull(),
})

// ── Widget Tokens ───────────────────────────────────────

export const widgetTokens = pgTable('widget_token', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  streamerId: text('streamer_id').notNull(),
  roomId: text('room_id').notNull(),
})

export const widgetTokensRelations = relations(widgetTokens, ({ one }) => ({
  streamer: one(profiles, { fields: [widgetTokens.streamerId], references: [profiles.id] }),
}))
