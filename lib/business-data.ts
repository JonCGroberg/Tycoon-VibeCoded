import { BusinessType, ResourceType } from "./game-types"

export interface BusinessData {
  type: BusinessType
  name: string
  icon: string
  iconColor: string
  color: {
    background: string
    border: string
  }
  inputResource: ResourceType | "ANY" | "NONE"
  outputResource: ResourceType | "COINS"
  outputResourceIcon: string
  outputResourceColor: string
  baseCost: number
  buffer: {
    incoming: { initialCapacity: number }
    outgoing: { initialCapacity: number }
  }
  workers: {
    initial: number
    gatherRate?: number
    wagePerUnit?: number
  }
  deliveryBots: {
    initial: number
    baseCost?: number
    capacity?: number
    speed?: number
  }
  processingTime: number
  productionProgress: number
  level: number
  upgrades: {
    incomingCapacity?: { base: number; multiplier: number }
    processingTime?: { base: number; divider: number }
    outgoingCapacity?: { base: number; multiplier: number }
  }
  profit: {
    baseValue: number | string
    marketValue: string
  }
}

export const BUSINESSES: BusinessData[] = [
  {
    type: BusinessType.RESOURCE_GATHERING,
    name: "Lumber Yard",
    icon: "TreeIcon",
    iconColor: "text-green-800",
    color: { background: "bg-green-200", border: "border-green-600" },
    inputResource: "NONE",
    outputResource: ResourceType.WOOD,
    outputResourceIcon: "TreeIcon",
    outputResourceColor: "bg-green-700",
    baseCost: 100,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 1, gatherRate: 1 / 3, wagePerUnit: 0.25 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 1, marketValue: "dynamic" }
  },
  {
    type: BusinessType.QUARRY,
    name: "Stone Quarry",
    icon: "GemIcon",
    iconColor: "text-gray-700",
    color: { background: "bg-gray-200", border: "border-gray-600" },
    inputResource: "NONE",
    outputResource: ResourceType.STONE,
    outputResourceIcon: "GemIcon",
    outputResourceColor: "bg-gray-500",
    baseCost: 120,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 1, gatherRate: 1 / 3, wagePerUnit: 0.25 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 1.5, marketValue: "dynamic" }
  },
  {
    type: BusinessType.MINE,
    name: "Iron Mine",
    icon: "BoxIcon",
    iconColor: "text-gray-900",
    color: { background: "bg-gray-300", border: "border-gray-700" },
    inputResource: "NONE",
    outputResource: ResourceType.IRON_ORE,
    outputResourceIcon: "BoxIcon",
    outputResourceColor: "bg-gray-700",
    baseCost: 150,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 1, gatherRate: 1 / 3, wagePerUnit: 0.25 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 2, marketValue: "dynamic" }
  },
  {
    type: BusinessType.PROCESSING,
    name: "Plank Mill",
    icon: "Logs",
    iconColor: "text-amber-700",
    color: { background: "bg-amber-200", border: "border-amber-600" },
    inputResource: ResourceType.WOOD,
    outputResource: ResourceType.PLANKS,
    outputResourceIcon: "Logs",
    outputResourceColor: "bg-amber-600",
    baseCost: 250,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 2, marketValue: "dynamic" }
  },
  {
    type: BusinessType.BRICK_KILN,
    name: "Brick Factory",
    icon: "PackageIcon",
    iconColor: "text-red-700",
    color: { background: "bg-red-200", border: "border-red-600" },
    inputResource: ResourceType.STONE,
    outputResource: ResourceType.BRICKS,
    outputResourceIcon: "PackageIcon",
    outputResourceColor: "bg-red-600",
    baseCost: 300,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 3, marketValue: "dynamic" }
  },
  {
    type: BusinessType.SMELTER,
    name: "Iron Smelter",
    icon: "WrenchIcon",
    iconColor: "text-gray-500",
    color: { background: "bg-gray-200", border: "border-gray-500" },
    inputResource: ResourceType.IRON_ORE,
    outputResource: ResourceType.IRON_INGOT,
    outputResourceIcon: "BoxIcon",
    outputResourceColor: "bg-gray-400",
    baseCost: 350,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 4, marketValue: "dynamic" }
  },
  {
    type: BusinessType.SHOP,
    name: "Furniture Shop",
    icon: "StoreIcon",
    iconColor: "text-blue-700",
    color: { background: "bg-blue-200", border: "border-blue-600" },
    inputResource: ResourceType.PLANKS,
    outputResource: ResourceType.FURNITURE,
    outputResourceIcon: "StoreIcon",
    outputResourceColor: "bg-amber-800",
    baseCost: 500,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 4, marketValue: "dynamic" }
  },
  {
    type: BusinessType.TOOL_SHOP,
    name: "Tool Shop",
    icon: "WrenchIcon",
    iconColor: "text-blue-800",
    color: { background: "bg-blue-300", border: "border-blue-700" },
    inputResource: ResourceType.IRON_INGOT,
    outputResource: ResourceType.TOOLS,
    outputResourceIcon: "WrenchIcon",
    outputResourceColor: "bg-blue-600",
    baseCost: 600,
    buffer: { incoming: { initialCapacity: 10 }, outgoing: { initialCapacity: 10 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0, baseCost: 100, capacity: 25, speed: 200 },
    processingTime: 10,
    productionProgress: 0,
    level: 1,
    upgrades: {
      incomingCapacity: { base: 10, multiplier: 2 },
      processingTime: { base: 10, divider: 2 },
      outgoingCapacity: { base: 10, multiplier: 2 }
    },
    profit: { baseValue: 8, marketValue: "dynamic" }
  },
  {
    type: BusinessType.MARKET,
    name: "Market",
    icon: "CoinsIcon",
    iconColor: "text-yellow-500",
    color: { background: "bg-yellow-200", border: "border-yellow-600" },
    inputResource: "ANY",
    outputResource: "COINS",
    outputResourceIcon: "CoinsIcon",
    outputResourceColor: "bg-yellow-500",
    baseCost: 0,
    buffer: { incoming: { initialCapacity: 0 }, outgoing: { initialCapacity: 0 } },
    workers: { initial: 0 },
    deliveryBots: { initial: 0 },
    processingTime: 0,
    productionProgress: 0,
    level: 1,
    upgrades: {},
    profit: { baseValue: "dynamic", marketValue: "dynamic" }
  }
]

export function getBusinessData(type: BusinessType): BusinessData {
  const data = BUSINESSES.find(b => b.type === type)
  if (!data) throw new Error(`No business data found for type: ${type}`)
  return data
}