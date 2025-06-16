// Game state types

export enum BusinessType {
  RESOURCE_GATHERING = "RESOURCE_GATHERING",
  PROCESSING = "PROCESSING",
  SHOP = "SHOP",
  MARKET = "MARKET",
  QUARRY = "QUARRY",
  MINE = "MINE",
  BRICK_KILN = "BRICK_KILN",
  SMELTER = "SMELTER",
  TOOL_SHOP = "TOOL_SHOP",
}

export enum ResourceType {
  NONE = "NONE",
  WOOD = "WOOD",
  STONE = "STONE",
  IRON_ORE = "IRON_ORE",
  PLANKS = "PLANKS",
  BRICKS = "BRICKS",
  IRON_INGOT = "IRON_INGOT",
  FURNITURE = "FURNITURE",
  TOOLS = "TOOLS",
}

export interface Storage {
  current: number
  capacity: number
}

export interface Worker {
  id: string
  gatherRate: number // Units per second
}

export interface DeliveryBot {
  id: string
  maxLoad: number
  speed: number // Studs per second
  isDelivering: boolean
  targetBusinessId: string | null
  currentLoad: number
  shippingTypeId?: string
  wage?: number // Coins paid per delivery or per time unit
}

export interface PendingDelivery {
  sourceBusinessId: string
  resourceAmount: number
  resourceType: ResourceType
}

export interface ShippingTypeState {
  type: string; // e.g. 'walker', 'bicyclist', 'truck', 'semi', etc.
  bots: DeliveryBot[];
}

export interface Business {
  id: string
  type: BusinessType
  position: { x: number; y: number }
  incomingStorage: Storage
  outgoingStorage: Storage
  processingTime: number // Seconds per unit
  batchSize?: number // Units produced per tick (default 1, but now 10)
  productionProgress: number // 0-1 progress of current production
  workers: Worker[]
  shippingTypes: ShippingTypeState[]
  level: number
  inputResource: ResourceType
  outputResource: ResourceType
  recentProfit: number // For showing profit indicators
  profitDisplayTime: number// Time remaining to display profit
  upgrades?: {
    incomingCapacity: number
    processingTime: number
    outgoingCapacity: number
  }
  gatherProgress?: number
  pendingDeliveries?: PendingDelivery[]
  totalInvested: number // Track total coins spent on this business
  operatingCost?: number // Coins paid per time unit
}

export interface GameState {
  coins: number
  businesses: Business[]
  activeDeliveries: ActiveDelivery[]
  achievements: { [key: string]: boolean }
  mineUnlocked?: boolean // Permanently unlocks mine after requirement is met
}

export interface ActiveDelivery {
  id: string
  sourceBusinessId: string
  targetBusinessId: string
  bot: DeliveryBot
  resourceAmount: number
  resourceType: ResourceType
  expectedArrival: number // timestamp in ms when delivery should complete
  createdAt: number
  travelTimeMs: number
}

export function getBusinessDisplayName(type: BusinessType): string {
  switch (type) {
    case BusinessType.RESOURCE_GATHERING:
      return "Wood Cutter";
    case BusinessType.QUARRY:
      return "Quarry";
    case BusinessType.MINE:
      return "Mine";
    case BusinessType.PROCESSING:
      return "Plank Mill";
    case BusinessType.BRICK_KILN:
      return "Brick Kiln";
    case BusinessType.SMELTER:
      return "Smelter";
    case BusinessType.SHOP:
      return "Furniture Shop";
    case BusinessType.TOOL_SHOP:
      return "Tool Shop";
    case BusinessType.MARKET:
      return "Market";
    default:
      return "Unknown Business";
  }
}
