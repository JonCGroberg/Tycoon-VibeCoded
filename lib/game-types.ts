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

export interface Buffer {
  current: number
  capacity: number
}

export interface Worker {
  id: string
  gatherRate: number // Units per second
}

export interface DeliveryBot {
  id: string
  capacity: number
  speed: number // Studs per second
  isDelivering: boolean
  targetBusinessId: string | null
  carryingAmount: number
}

export interface Business {
  id: string
  type: BusinessType
  position: { x: number; y: number }
  incomingBuffer: Buffer
  outgoingBuffer: Buffer
  processingTime: number // Seconds per unit
  productionProgress: number // 0-1 progress of current production
  workers: Worker[]
  deliveryBots: DeliveryBot[]
  level: number
  inputResource: ResourceType
  outputResource: ResourceType
  recentProfit?: number // For showing profit indicators
  profitDisplayTime?: number // Time remaining to display profit
  upgrades?: {
    incomingCapacity: number
    processingTime: number
    outgoingCapacity: number
  }
  gatherProgress?: number
}

export interface GameState {
  coins: number
  businesses: Business[]
  activeDeliveries: ActiveDelivery[]
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
