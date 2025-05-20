import { Business } from "./game-types"

export function calculateEquity(businesses: Business[]): number {
  return businesses.reduce((sum, business) => sum + (business.totalInvested || 0), 0)
}