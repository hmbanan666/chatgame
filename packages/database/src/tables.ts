import { cuid2 } from 'drizzle-cuid2/postgres'
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profile', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { precision: 3, withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  twitchId: text('twitch_id'),
  username: text('user_name'),
  coupons: integer('coupons').notNull().default(0),
  level: integer('level').notNull().default(1),
  coins: integer('coins').notNull().default(0),
  mana: integer('mana').notNull().default(0),
  points: integer('points').notNull().default(0),
  patronPoints: integer('patron_points').notNull().default(0),
  rangerPoints: integer('ranger_points').notNull().default(0),
  storytellerPoints: integer('storyteller_points').notNull().default(0),
  trophyHunterPoints: integer('trophy_hunter_points').notNull().default(0),
  collectorPoints: integer('collector_points').notNull().default(0),
  isStreamer: boolean('is_streamer').notNull().default(false),
  activeEditionId: text('active_edition_id'),
  telegramProfileId: text('telegram_profile_id'),
})
