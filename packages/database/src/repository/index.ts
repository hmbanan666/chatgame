import { useDatabase } from '../database'
import { BacklogItemRepository } from './backlogItem'
import { CharacterRepository } from './character'
import { CharacterEditionRepository } from './characterEdition'
import { CharacterLevelRepository } from './characterLevel'
import { CouponRepository } from './coupon'
import { InventoryItemRepository } from './inventoryItem'
import { InventoryItemEditionRepository } from './inventoryItemEdition'
import { PaymentRepository } from './payment'
import { PlayerRepository } from './player'
import { ProductRepository } from './product'
import { ProductItemRepository } from './productItem'
import { ProfileRepository } from './profile'
import { SpriteRepository } from './sprite'
import { StreamRepository } from './stream'
import { StreamerRepository } from './streamer'
import { TransactionRepository } from './transaction'
import { TwitchAccessTokenRepository } from './twitchAccessToken'
import { TwitchTokenRepository } from './twitchToken'

class Repository {
  readonly backlogItem = BacklogItemRepository
  readonly profile = ProfileRepository
  readonly sprite = SpriteRepository
  readonly character = CharacterRepository
  readonly characterEdition = CharacterEditionRepository
  readonly characterLevel = CharacterLevelRepository
  readonly coupon = CouponRepository
  readonly player = PlayerRepository
  readonly stream = StreamRepository
  readonly streamer = StreamerRepository
  readonly transaction = TransactionRepository
  readonly payment = PaymentRepository
  readonly product = ProductRepository
  readonly productItem = ProductItemRepository
  readonly inventoryItem = InventoryItemRepository
  readonly inventoryItemEdition = InventoryItemEditionRepository
  readonly twitchToken = TwitchTokenRepository
  readonly twitchAccessToken = TwitchAccessTokenRepository

  async checkHealth(): Promise<boolean> {
    await useDatabase().query.profiles.findFirst()
    return true
  }
}

export const repository = new Repository()
