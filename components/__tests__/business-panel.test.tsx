import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BusinessPanel from '../business-panel'
import { BusinessType, ResourceType, DeliveryBot, type Business } from '@/lib/game-types'
import { getUpgradeCost, getBusinessName, getResourceName, getBufferStatusColor } from '../business-panel'

// Mock the business data
const mockBots: DeliveryBot[] = [
    { id: '1', maxLoad: 5, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 },
    { id: '2', maxLoad: 10, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 },
]
const mockBusiness: Business = {
    id: "test-business",
    type: BusinessType.RESOURCE_GATHERING,
    position: { x: 0, y: 0 },
    incomingStorage: { current: 0, capacity: 10 },
    outgoingStorage: { current: 0, capacity: 10 },
    processingTime: 1,
    productionProgress: 0,
    workers: [],
    shippingTypes: [],
    level: 1,
    inputResource: ResourceType.WOOD,
    outputResource: ResourceType.WOOD,
    recentProfit: 0,
    profitDisplayTime: 0,
    totalInvested: 0,
    upgrades: {
        incomingCapacity: 0,
        processingTime: 0,
        outgoingCapacity: 0
    }
}

describe('BusinessPanel', () => {
    const mockOnClose = jest.fn()
    const mockOnHireShippingType = jest.fn()
    const mockOnSellShippingType = jest.fn()
    const mockOnUpgrade = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders business panel with correct title', () => {
        render(
            <BusinessPanel
                business={{ ...mockBusiness, type: BusinessType.RESOURCE_GATHERING, outputResource: ResourceType.WOOD, totalInvested: 0 }}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onUpgrade={mockOnUpgrade} coins={0} onSellShippingType={function (businessId: string, shippingTypeId: string): void {
                    throw new Error('Function not implemented.')
                }} />
        )
        expect(screen.getByText('Wood Camp')).toBeInTheDocument()
        expect(screen.getByText('Level 1')).toBeInTheDocument()
        const investedLabels = screen.getAllByText((content, node) => {
            if (!node) return false;
            return Boolean(node.textContent && node.textContent.match(/\$0\s*Invested/));
        })
        expect(investedLabels.length).toBeGreaterThan(0)
    })

    it('calls onClose when close button is clicked', () => {
        render(
            <BusinessPanel
                business={mockBusiness}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onUpgrade={mockOnUpgrade} coins={0} onSellShippingType={function (businessId: string, shippingTypeId: string): void {
                    throw new Error('Function not implemented.')
                }} />
        )

        const buttons = screen.getAllByRole('button')
        fireEvent.click(buttons[0])
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('displays correct buffer information', () => {
        render(
            <BusinessPanel
                business={{ ...mockBusiness, totalInvested: 0, type: BusinessType.PROCESSING }}
                coins={1000}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onSellShippingType={mockOnSellShippingType}
                onUpgrade={mockOnUpgrade}
            />
        )
        const incomingLabels = screen.getAllByText((content, node) => {
            return !!node && typeof node.textContent === 'string' && node.textContent.includes('Incoming Storage')
        })
        const outgoingLabels = screen.getAllByText((content, node) => {
            return !!node && typeof node.textContent === 'string' && node.textContent.includes('Outgoing Storage')
        })
        expect(incomingLabels.length).toBeGreaterThan(0)
        expect(outgoingLabels.length).toBeGreaterThan(0)
    })

    it('calculates upgrade cost correctly', () => {
        const business = {
            ...mockBusiness,
            level: 3,
            upgrades: {
                incomingCapacity: 1,
                processingTime: 2,
                outgoingCapacity: 0
            }
        }
        expect(getUpgradeCost(business)).toBe(200) // Base level upgrade cost
        expect(getUpgradeCost(business, 'incomingCapacity')).toBe(100) // 50 * 2^1
        expect(getUpgradeCost(business, 'processingTime')).toBe(200) // 50 * 2^2
        expect(getUpgradeCost(business, 'outgoingCapacity')).toBe(50) // 50 * 2^0
    })

    it('returns correct business name for different types and resources', () => {
        const woodBusiness = { ...mockBusiness, type: BusinessType.RESOURCE_GATHERING, outputResource: ResourceType.WOOD };
        const stoneBusiness = { ...mockBusiness, type: BusinessType.RESOURCE_GATHERING, outputResource: ResourceType.STONE };
        const planksBusiness = { ...mockBusiness, type: BusinessType.PROCESSING, outputResource: ResourceType.PLANKS };
        const furnitureBusiness = { ...mockBusiness, type: BusinessType.SHOP, outputResource: ResourceType.FURNITURE };
        const marketBusiness = { ...mockBusiness, type: BusinessType.MARKET };

        expect(getBusinessName(woodBusiness)).toBe('Wood Camp');
        expect(getBusinessName(stoneBusiness)).toBe('Quarry');
        expect(getBusinessName(planksBusiness)).toBe('Plank Mill');
        expect(getBusinessName(furnitureBusiness)).toBe('Furniture Shop');
        expect(getBusinessName(marketBusiness)).toBe('Market');
    });

    it('returns correct resource name for different resource types', () => {
        expect(getResourceName(ResourceType.WOOD)).toBe('Wood');
        expect(getResourceName(ResourceType.STONE)).toBe('Stone');
        expect(getResourceName(ResourceType.IRON_ORE)).toBe('Iron Ore');
        expect(getResourceName(ResourceType.PLANKS)).toBe('Planks');
        expect(getResourceName(ResourceType.BRICKS)).toBe('Bricks');
        expect(getResourceName(ResourceType.IRON_INGOT)).toBe('Iron Ingot');
        expect(getResourceName(ResourceType.FURNITURE)).toBe('Furniture');
        expect(getResourceName(ResourceType.TOOLS)).toBe('Tools');
        expect(getResourceName(ResourceType.NONE)).toBe('None');
    });

    it('calls onUpgrade for input capacity upgrade', () => {
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onUpgrade={mockOnUpgrade}
                coins={1000}
                onSellShippingType={mockOnSellShippingType}
            />
        )
        fireEvent.click(screen.getByTestId('upgrade-incoming'))
        expect(mockOnUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'incomingCapacity')
    })

    it('calls onUpgrade for processing speed upgrade', () => {
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onUpgrade={mockOnUpgrade}
                coins={1000}
                onSellShippingType={mockOnSellShippingType}
            />
        )
        fireEvent.click(screen.getByTestId('upgrade-processing'))
        expect(mockOnUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'processingTime')
    })

    it('calls onUpgrade for output capacity upgrade', () => {
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onUpgrade={mockOnUpgrade}
                coins={1000}
                onSellShippingType={mockOnSellShippingType}
            />
        )
        fireEvent.click(screen.getByTestId('upgrade-outgoing'))
        expect(mockOnUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'outgoingCapacity')
    })

    it('displays correct storage information', () => {
        render(
            <BusinessPanel
                business={{ ...mockBusiness, type: BusinessType.PROCESSING }}
                coins={1000}
                onClose={mockOnClose}
                onHireShippingType={mockOnHireShippingType}
                onSellShippingType={mockOnSellShippingType}
                onUpgrade={mockOnUpgrade}
            />
        )
        expect(screen.getByText('Incoming Storage')).toBeInTheDocument()
        expect(screen.getByText('Outgoing Storage')).toBeInTheDocument()
    })
})

describe('getBufferStatusColor', () => {
    it('returns red when fillPercentage >= 90', () => {
        expect(getBufferStatusColor(9, 10)).toBe('text-red-500')
        expect(getBufferStatusColor(90, 100)).toBe('text-red-500')
        expect(getBufferStatusColor(95, 100)).toBe('text-red-500')
    })

    it('returns yellow when 70 <= fillPercentage < 90', () => {
        expect(getBufferStatusColor(7, 10)).toBe('text-yellow-500')
        expect(getBufferStatusColor(75, 100)).toBe('text-yellow-500')
        expect(getBufferStatusColor(89, 100)).toBe('text-yellow-500')
    })

    it('returns blue when 0 < fillPercentage <= 10', () => {
        expect(getBufferStatusColor(1, 10)).toBe('text-blue-500')
        expect(getBufferStatusColor(0.5, 10)).toBe('text-blue-500')
        expect(getBufferStatusColor(1, 100)).toBe('text-blue-500')
    })

    it('returns green for normal operation', () => {
        expect(getBufferStatusColor(5, 10)).toBe('text-green-500')
        expect(getBufferStatusColor(50, 100)).toBe('text-green-500')
        expect(getBufferStatusColor(69, 100)).toBe('text-green-500')
    })

    it('handles edge cases', () => {
        expect(getBufferStatusColor(0, 0)).toBe('text-green-500')
        expect(getBufferStatusColor(null, null)).toBe('text-green-500')
        expect(getBufferStatusColor(undefined, undefined)).toBe('text-green-500')
        expect(getBufferStatusColor(0, 10)).toBe('text-green-500')
        expect(getBufferStatusColor(10, 10)).toBe('text-red-500')
    })
})

describe('getBusinessName edge case', () => {
    it('returns Unknown Business for unknown type', () => {
        const unknownBusiness = { ...mockBusiness, type: 'UNKNOWN_TYPE' as any }
        expect(getBusinessName(unknownBusiness)).toBe('Unknown Business')
    })
})

describe('getResourceName edge case', () => {
    it('returns None for unknown resource type', () => {
        expect(getResourceName('UNKNOWN_RESOURCE' as any)).toBe('None')
    })
})