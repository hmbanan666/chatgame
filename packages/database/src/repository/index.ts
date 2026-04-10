import { useDatabase } from '../database'
import { BacklogItemRepository } from './backlogItem'
import { CharacterRepository } from './character'
import { CharacterEditionRepository } from './characterEdition'
import { CouponRepository } from './coupon'
import { InventoryItemRepository } from './inventoryItem'
import { InventoryItemEditionRepository } from './inventoryItemEdition'
import { OAuthAccessTokenRepository } from './oauthAccessToken'
import { PaymentRepository } from './payment'
import { ProductRepository } from './product'
import { ProductItemRepository } from './productItem'
import { ProfileRepository } from './profile'
import { RedemptionRepository } from './redemption'
import { SpriteRepository } from './sprite'
import { StreamRepository } from './stream'
import { StreamEngagementRepository } from './streamEngagement'
import { StreamerCurrencyRepository } from './streamerCurrency'
import { StreamerCurrencyBalanceRepository } from './streamerCurrencyBalance'
import { StreamerNoteRepository } from './streamerNote'
import { StreamerTagRepository } from './streamerTag'
import { StreamerViewerRepository } from './streamerViewer'
import { StreamerViewerTagRepository } from './streamerViewerTag'
import { TransactionRepository } from './transaction'
import { TwitchTokenRepository } from './twitchToken'
import { WidgetTokenRepository } from './widgetToken'

class Repository {
  readonly backlogItem = BacklogItemRepository
  readonly profile = ProfileRepository
  readonly sprite = SpriteRepository
  readonly character = CharacterRepository
  readonly characterEdition = CharacterEditionRepository
  readonly coupon = CouponRepository
  readonly redemption = RedemptionRepository
  readonly streamerViewer = StreamerViewerRepository
  readonly streamerViewerTag = StreamerViewerTagRepository
  readonly streamerTag = StreamerTagRepository
  readonly stream = StreamRepository
  readonly streamEngagement = StreamEngagementRepository
  readonly streamerCurrency = StreamerCurrencyRepository
  readonly streamerCurrencyBalance = StreamerCurrencyBalanceRepository
  readonly streamerNote = StreamerNoteRepository
  readonly transaction = TransactionRepository
  readonly payment = PaymentRepository
  readonly product = ProductRepository
  readonly productItem = ProductItemRepository
  readonly inventoryItem = InventoryItemRepository
  readonly inventoryItemEdition = InventoryItemEditionRepository
  readonly twitchToken = TwitchTokenRepository
  readonly oauthAccessToken = OAuthAccessTokenRepository
  readonly widgetToken = WidgetTokenRepository

  async checkHealth(): Promise<boolean> {
    await useDatabase().query.profiles.findFirst()
    return true
  }
}

export const repository = new Repository()
