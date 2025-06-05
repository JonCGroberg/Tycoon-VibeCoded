import { type GameState, BusinessType, ResourceType, Business } from "./game-types"

// Counter for generating unique IDs
let idCounter = 0

// Generate a unique ID with a prefix
export function generateUniqueId(prefix: string): string {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER
  return `${prefix}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`
}

// Initialize a new game state
export function initializeGameState(): GameState {
  return {
    // Starting coins
    coins: 20000,
    businesses: [
      // Add a market at a fixed position
      {
        id: generateUniqueId("market"),
        type: BusinessType.MARKET,
        position: { x: 400, y: 100 },
        incomingStorage: { current: 0, capacity: 10 },
        outgoingStorage: { current: 0, capacity: 10 },
        processingTime: 1,
        batchSize: 10,
        productionProgress: 0,
        workers: [],
        shippingTypes: [],
        level: 1,
        inputResource: ResourceType.NONE,
        outputResource: ResourceType.NONE,
        recentProfit: 0,
        profitDisplayTime: 0,
        totalInvested: 0
      },
    ],
    activeDeliveries: [], // Initialize empty array for active deliveries
    achievements: {
      firstBusiness: false,
      tycoon: false,
      industrialist: false,
      masterUpgrader: false,
      logisticsPro: false,
      marketMogul: false,
      shippingMaster: false,
      relocator: false,
      maxedOut: false,
      fastTycoon: false
    },
  }
}

export function getUpgradeCost(business: Business, upgradeType?: "incomingCapacity" | "processingTime" | "outgoingCapacity"): number {
  const base = 50
  // Track upgrades per type on the business object
  if (!business.upgrades) {
    business.upgrades = {
      incomingCapacity: 0,
      processingTime: 0,
      outgoingCapacity: 0
    }
  }
  // If no upgradeType is provided, fallback to old logic
  if (!upgradeType) {
    return Math.floor(base * Math.pow(2, business.level - 1))
  }
  // Each upgrade type is independent: first upgrade is 50, then 1.7x each time
  const n = business.upgrades[upgradeType] || 0;
  return Math.floor(base * Math.pow(1.7, n));
}
