import { useDatabase } from '../database'
import { CharacterRepository } from './character'
import { CharacterEditionRepository } from './characterEdition'
import { CharacterLevelRepository } from './characterLevel'
import { CouponRepository } from './coupon'
import { InventoryItemRepository } from './inventoryItem'
import { InventoryItemEditionRepository } from './inventoryItemEdition'
import { LeaderboardRepository } from './leaderboard'
import { LeaderboardMemberRepository } from './leaderboardMember'
import { PaymentRepository } from './payment'
import { PlayerRepository } from './player'
import { ProductRepository } from './product'
import { Profile } from './profile'
import { QuestRepository } from './quest'
import { QuestEditionRepository } from './questEdition'
import { TransactionRepository } from './transaction'
import { TrophyRepository } from './trophy'
import { TrophyEditionRepository } from './trophyEdition'
import { TwitchAccessTokenRepository } from './twitchAccessToken'
import { TwitchTokenRepository } from './twitchToken'

class Repository {
  readonly profile = Profile
  readonly character = CharacterRepository
  readonly characterEdition = CharacterEditionRepository
  readonly characterLevel = CharacterLevelRepository
  readonly coupon = CouponRepository
  readonly player = PlayerRepository
  readonly trophy = TrophyRepository
  readonly trophyEdition = TrophyEditionRepository
  readonly quest = QuestRepository
  readonly questEdition = QuestEditionRepository
  readonly transaction = TransactionRepository
  readonly payment = PaymentRepository
  readonly product = ProductRepository
  readonly inventoryItem = InventoryItemRepository
  readonly inventoryItemEdition = InventoryItemEditionRepository
  readonly twitchToken = TwitchTokenRepository
  readonly twitchAccessToken = TwitchAccessTokenRepository
  readonly leaderboard = LeaderboardRepository
  readonly leaderboardMember = LeaderboardMemberRepository

  async checkHealth(): Promise<boolean> {
    await useDatabase().query.profiles.findFirst()
    return true
  }
}

export const repository = new Repository()
