import { bots } from './bots'
import { characters } from './characters'
import { items } from './items'
import { products } from './products'
import { rooms } from './rooms'

export type Dictionary = typeof en

export const en = {
  route: {
    title: {
      game: 'Game',
      inventory: 'Inventory',
      quest: 'Quests',
      shop: 'Shop',
      top: 'Top',
      character: 'Character',
    },
  },
  inventory: {
    empty: 'No items in Inventory',
    currentAmount: 'In stock: {n} pcs.',
    chatgame: {
      title: 'Have a ChatGame profile?',
      description: 'Bind your main account to ChatGame. Requires Twitch.',
      button: 'Bind',
    },
  },
  character: {
    title: 'Character',
    titleActive: 'Active character',
    xpLeft: '{xp} left to the next level',
    maxLevel: 'Max level',
    maxLevelLabel: 'has reached max level',
    active: 'Active',
    activeLabel: 'This is your active character',
    level: 'level',
    reward: {
      title: 'Get rewards for levels!',
      received: 'Received',
    },
    unlock: {
      for: 'Unlock for',
      notForCoins: 'A character cannot be unlocked for Coins',
      pressToConfirm: 'Click again to confirm',
    },
    collection: {
      coins: 'Base Collection',
      rare: 'Rare Characters',
    },
  },
  item: {
    woodlandPoint: {
      title: 'Woodlands',
      amount: 'Woodlands | Woodland | Woodlands | Woodlands',
      description: 'Is the main indicator of progress in the game. It is like a profile level, but in the form of points. They cannot be spent - only accumulated.',
    },
    coin: {
      title: 'Coin',
      amount: 'Coins | Coin | Coins | Coins',
      description: 'Is the main currency for unlocking characters.',
    },
    coupon: {
      title: 'Stream Coupon',
      amount: 'Coupons | Coupon | Coupons | Coupons',
      description: 'There are periodic posts on the stream twitch.tv/hmbanan666 with instructions on how to get it. Exchange it for a reward.',
      empty: 'There are no coupons',
    },
    trophy: {
      title: 'Trophy',
      titleMine: 'My trophies',
      empty: 'There are no trophies',
      obtained: 'Obtained',
    },
    eatAndGetReward: 'Eat 1 piece and get a reward',
  },
  room: {
    titleActive: 'Active room',
  },
  top: {
    players: 'Top Players',
    myResult: 'My result',
  },
  shop: {
    titleSpecial: 'Special offers',
  },
  trade: {
    for: 'Trade for',
  },
  purchase: {
    for: 'Purchase for',
    limited: 'Limited',
  },
  welcome: {
    title: 'Welcome to the game!',
    description: 'Tap anywhere to move around. Tap trees to cut them down.',
    hint: 'What\'s next: level up your character, get rewards for levels. Unlock new characters.',
  },
  availableUntil: 'Available until',
  close: 'Close',
  connect: 'Connect',
  activate: 'Activate',
  reward: 'Reward',
  characters,
  rooms,
  products,
  items,
  bots,
}
