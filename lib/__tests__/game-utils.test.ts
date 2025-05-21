import { calculateEquity } from '../game-utils'
import { Business, BusinessType, ResourceType } from '@/lib/game-types'
describe('calculateEquity', () => {
    it('returns 0 for empty businesses', () => {
        expect(calculateEquity([])).toBe(0)
    })
    it('sums totalInvested for all businesses', () => {
        const businesses: Business[] = [
            { id: '1', type: BusinessType.RESOURCE_GATHERING, position: { x: 0, y: 0 }, incomingStorage: { current: 0, capacity: 0 }, outgoingStorage: { current: 0, capacity: 0 }, processingTime: 0, productionProgress: 0, workers: [], shippingTypes: [], level: 1, inputResource: ResourceType.WOOD, outputResource: ResourceType.WOOD, recentProfit: 0, profitDisplayTime: 0, totalInvested: 100 },
            { id: '2', type: BusinessType.RESOURCE_GATHERING, position: { x: 0, y: 0 }, incomingStorage: { current: 0, capacity: 0 }, outgoingStorage: { current: 0, capacity: 0 }, processingTime: 0, productionProgress: 0, workers: [], shippingTypes: [], level: 1, inputResource: ResourceType.WOOD, outputResource: ResourceType.WOOD, recentProfit: 0, profitDisplayTime: 0, totalInvested: 200 },
            { id: '3', type: BusinessType.RESOURCE_GATHERING, position: { x: 0, y: 0 }, incomingStorage: { current: 0, capacity: 0 }, outgoingStorage: { current: 0, capacity: 0 }, processingTime: 0, productionProgress: 0, workers: [], shippingTypes: [], level: 1, inputResource: ResourceType.WOOD, outputResource: ResourceType.WOOD, recentProfit: 0, profitDisplayTime: 0, totalInvested: 0 },
        ]
        expect(calculateEquity(businesses)).toBe(300)
    })
    it('handles missing totalInvested', () => {
        const businesses: Business[] = [
            { id: '1', type: BusinessType.RESOURCE_GATHERING, position: { x: 0, y: 0 }, incomingStorage: { current: 0, capacity: 0 }, outgoingStorage: { current: 0, capacity: 0 }, processingTime: 0, productionProgress: 0, workers: [], shippingTypes: [], level: 1, inputResource: ResourceType.WOOD, outputResource: ResourceType.WOOD, recentProfit: 0, profitDisplayTime: 0, totalInvested: 0 },
            { id: '2', type: BusinessType.RESOURCE_GATHERING, position: { x: 0, y: 0 }, incomingStorage: { current: 0, capacity: 0 }, outgoingStorage: { current: 0, capacity: 0 }, processingTime: 0, productionProgress: 0, workers: [], shippingTypes: [], level: 1, inputResource: ResourceType.WOOD, outputResource: ResourceType.WOOD, recentProfit: 0, profitDisplayTime: 0, totalInvested: 50 },
        ]
        expect(calculateEquity(businesses)).toBe(50)
    })
})