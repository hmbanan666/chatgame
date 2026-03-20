import { cuid2 } from 'drizzle-cuid2/postgres'
import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
  level: integer('level').notNull().default(1),
  points: integer('points').notNull().default(0),
  patronPoints: integer('patron_points').notNull().default(0),
  trophyHunterPoints: integer('trophy_hunter_points').notNull().default(0),
  rangerPoints: integer('ranger_points').notNull().default(0),
  storytellerPoints: integer('storyteller_points').notNull().default(0),
  collectorPoints: integer('collector_points').notNull().default(0),
  activeEditionId: text('active_edition_id'),
})

export const profilesRelations = relations(profiles, ({ many }) => ({
  twitchTokens: many(twitchTokens),
  characterEditions: many(characterEditions),
  transactions: many(transactions),
  trophyEditions: many(trophyEditions),
  itemEditions: many(inventoryItemEditions),
  payments: many(payments),
  leaderboardMembers: many(leaderboardMembers),
  quests: many(quests),
  questEditions: many(questEditions),
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

// ── Streamer ────────────────────────────────────────────

export const streamers = pgTable('streamer', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  twitchChannelId: text('twitch_channel_id').notNull().unique(),
  twitchChannelName: text('twitch_channel_name').notNull(),
  donationAlertsUserId: text('donation_alerts_user_id'),
  profileId: text('profile_id').notNull(),
})

export const streamersRelations = relations(streamers, ({ one }) => ({
  profile: one(profiles, { fields: [streamers.profileId], references: [profiles.id] }),
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

export const twitchAccessTokens = pgTable('twitch_access_token', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  scope: text('scope').array(),
  expiresIn: integer('expires_in'),
  obtainmentTimestamp: text('obtainment_timestamp').notNull(),
})

// ── Village / Player / Skill ─────────────────────────────

export const villages = pgTable('village', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  globalTarget: integer('global_target'),
  globalTargetSuccess: integer('global_target_success'),
  wood: integer('wood').notNull().default(0),
  stone: integer('stone').notNull().default(0),
})

export const players = pgTable('player', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  lastActionAt: timestamp('last_action_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  name: text('name').notNull(),
  coins: integer('coins').notNull().default(0),
  reputation: integer('reputation').notNull().default(0),
  viewerPoints: integer('viewer_points').notNull().default(0),
  villainPoints: integer('villain_points').notNull().default(0),
  refuellerPoints: integer('refueller_points').notNull().default(0),
  raiderPoints: integer('raider_points').notNull().default(0),
  inventoryId: text('inventory_id').notNull(),
  profileId: text('profile_id').notNull(),
})

export const skills = pgTable('skill', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  type: text('type').notNull(),
  lvl: integer('lvl').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  xpNextLvl: integer('xp_next_lvl').notNull().default(20),
  objectId: text('object_id').notNull(),
})

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

// ── Coupon ───────────────────────────────────────────────

export const coupons = pgTable('coupon', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  activationCommand: text('activation_command').notNull(),
  status: text('status').notNull(),
  profileId: text('profile_id'),
})

// ── Trophy ───────────────────────────────────────────────

export const trophies = pgTable('trophy', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  points: integer('points').notNull(),
  rarity: integer('rarity').notNull().default(0),
  isShown: boolean('is_shown').notNull().default(false),
  hasImage: boolean('has_image').notNull().default(false),
})

export const trophiesRelations = relations(trophies, ({ many }) => ({
  editions: many(trophyEditions),
}))

export const trophyEditions = pgTable('trophy_edition', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  profileId: text('profile_id').notNull(),
  trophyId: text('trophy_id').notNull(),
})

export const trophyEditionsRelations = relations(trophyEditions, ({ one }) => ({
  profile: one(profiles, { fields: [trophyEditions.profileId], references: [profiles.id] }),
  trophy: one(trophies, { fields: [trophyEditions.trophyId], references: [trophies.id] }),
}))

// ── Leaderboard ──────────────────────────────────────────

export const leaderboards = pgTable('leaderboard', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { precision: 3, withTimezone: true, mode: 'date' }),
  title: text('title').notNull(),
  description: text('description'),
})

export const leaderboardsRelations = relations(leaderboards, ({ many }) => ({
  members: many(leaderboardMembers),
}))

export const leaderboardMembers = pgTable('leaderboard_member', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  position: integer('position').notNull().default(0),
  points: integer('points').notNull().default(0),
  profileId: text('profile_id').notNull(),
  leaderboardId: text('leaderboard_id').notNull(),
})

export const leaderboardMembersRelations = relations(leaderboardMembers, ({ one }) => ({
  profile: one(profiles, { fields: [leaderboardMembers.profileId], references: [profiles.id] }),
  leaderboard: one(leaderboards, { fields: [leaderboardMembers.leaderboardId], references: [leaderboards.id] }),
}))

// ── Quest ────────────────────────────────────────────────

export const quests = pgTable('quest', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  points: integer('points').notNull(),
  progressCompleted: integer('progress_completed').notNull().default(1),
  profileId: text('profile_id').notNull(),
})

export const questsRelations = relations(quests, ({ one, many }) => ({
  profile: one(profiles, { fields: [quests.profileId], references: [profiles.id] }),
  editions: many(questEditions),
  rewards: many(questRewards),
}))

export const questEditions = pgTable('quest_edition', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { precision: 3, withTimezone: true, mode: 'date' }),
  status: text('status').notNull(),
  progress: integer('progress').notNull().default(0),
  profileId: text('profile_id').notNull(),
  questId: text('quest_id').notNull(),
})

export const questEditionsRelations = relations(questEditions, ({ one }) => ({
  profile: one(profiles, { fields: [questEditions.profileId], references: [profiles.id] }),
  quest: one(quests, { fields: [questEditions.questId], references: [quests.id] }),
}))

export const questRewards = pgTable('quest_reward', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  type: text('type').notNull(),
  amount: integer('amount').notNull().default(0),
  entityId: text('entity_id'),
  questId: text('quest_id').notNull(),
})

export const questRewardsRelations = relations(questRewards, ({ one }) => ({
  quest: one(quests, { fields: [questRewards.questId], references: [quests.id] }),
}))

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
