import { type GameState, BusinessType, ResourceType } from "./game-types"

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
    coins: 2000, // Starting coins increased from 500
    businesses: [
      // Add a market at a fixed position
      {
        id: generateUniqueId("market"),
        type: BusinessType.MARKET,
        position: { x: 400, y: 100 },
        incomingStorage: { current: 0, capacity: 4 },
        outgoingStorage: { current: 0, capacity: 4 },
        processingTime: 10,
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
  }
}
