import {
  TreesIcon as TreeIcon,
  CoinsIcon,
  FactoryIcon,
  WrenchIcon,
  TruckIcon,
  ShoppingCartIcon,
  UserIcon,
  BotIcon,
  MoveIcon,
  TrophyIcon,
  ZapIcon
} from 'lucide-react'

export const ACHIEVEMENTS = [
  {
    key: 'firstBusiness',
    name: 'First Business',
    funName: 'Wood You Believe It?',
    icon: TreeIcon,
    description: 'Place your first business.'
  },
  {
    key: 'tycoon',
    name: 'Tycoon',
    funName: 'Money Bags!',
    icon: CoinsIcon,
    description: 'Reach 10,000 coins.'
  },
  {
    key: 'industrialist',
    name: 'Industrialist',
    funName: 'Factory Frenzy!',
    icon: FactoryIcon,
    description: 'Own 10 businesses.'
  },
  {
    key: 'masterUpgrader',
    name: 'Master Upgrader',
    funName: 'Upgrade Wizard!',
    icon: WrenchIcon,
    description: 'Upgrade a business to level 5.'
  },
  {
    key: 'logisticsPro',
    name: 'Logistics Pro',
    funName: 'Delivery Dynamo!',
    icon: TruckIcon,
    description: 'Complete 100 deliveries.'
  },
  {
    key: 'marketMogul',
    name: 'Market Mogul',
    funName: 'Market Marvel!',
    icon: ShoppingCartIcon,
    description: 'Earn 5,000 coins from the market.'
  },
  {
    key: 'shippingMaster',
    name: 'Shipping Master',
    funName: 'Bot-tastic!',
    icon: BotIcon,
    description: 'Own 5 or more shipping bots of any type.'
  },
  {
    key: 'relocator',
    name: 'Relocator',
    funName: "Movin' On Up!",
    icon: MoveIcon,
    description: 'Relocate a business.'
  },
  {
    key: 'maxedOut',
    name: 'Maxed Out',
    funName: 'Level Legend!',
    icon: TrophyIcon,
    description: 'Upgrade a business to level 10.'
  },
  {
    key: 'fastTycoon',
    name: 'Fast Tycoon',
    funName: 'Speed Tycoon!',
    icon: ZapIcon,
    description: 'Reach 10,000 coins in under 10 minutes.'
  }
]