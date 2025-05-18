import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BusinessPanel from '../business-panel'
import { BusinessType, ResourceType, DeliveryBot } from '@/lib/game-types'
import { getBotCost, getUpgradeCost, getBusinessName, getResourceName, getBufferStatusColor } from '../business-panel'

// Mock the business data
const mockDeliveryBots: DeliveryBot[] = [
    { id: '1', maxLoad: 10, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 },
    { id: '2', maxLoad: 10, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 },
]
const mockBusiness = {
    id: '1',
    type: BusinessType.RESOURCE_GATHERING,
    level: 1,
    inputResource: ResourceType.NONE,
    outputResource: ResourceType.WOOD,
    incomingBuffer: { current: 0, capacity: 10 },
    outgoingBuffer: { current: 0, capacity: 10 },
    processingTime: 5,
    productionProgress: 0,
    workers: [],
    deliveryBots: [mockDeliveryBots[0]],
    position: { x: 0, y: 0 },
    recentProfit: 0,
    profitDisplayTime: 0,
    severity: 0
}

describe('BusinessPanel', () => {
    const mockOnClose = jest.fn()
    const mockOnHireDeliveryBot = jest.fn()
    const mockOnUpgrade = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders business panel with correct title', () => {
        render(
            <BusinessPanel
                business={mockBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockOnUpgrade}
            />
        )

        expect(screen.getByText('Wood Cutter Camp')).toBeInTheDocument()
        expect(screen.getByText('Level 1')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
        render(
            <BusinessPanel
                business={mockBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockOnUpgrade}
            />
        )

        const buttons = screen.getAllByRole('button')
        fireEvent.click(buttons[0])
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('displays correct buffer information', () => {
        render(
            <BusinessPanel
                business={mockBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockOnUpgrade}
            />
        )

        expect(screen.getByText('Incoming Buffer')).toBeInTheDocument()
        expect(screen.getByText('Outgoing Buffer')).toBeInTheDocument()
        expect(screen.getByText('Processing')).toBeInTheDocument()
    })

    it('shows upgrades tab content when defaultTab is upgrades', async () => {
        const processingBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={processingBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockOnUpgrade}
                defaultTab="upgrades"
            />
        )
        expect(await screen.findByText('Available Upgrades')).toBeInTheDocument()
    })

    it('calculates bot cost correctly', () => {
        const business = {
            ...mockBusiness,
            deliveryBots: mockDeliveryBots
        }
        expect(getBotCost(business)).toBe(144)
    })

    it('calculates upgrade cost correctly', () => {
        const business = { ...mockBusiness, level: 3 }
        expect(getUpgradeCost(business)).toBe(200)
    })

    it('returns correct business name for different types and resources', () => {
        const woodBusiness = { ...mockBusiness, type: BusinessType.RESOURCE_GATHERING, outputResource: ResourceType.WOOD };
        const stoneBusiness = { ...mockBusiness, type: BusinessType.RESOURCE_GATHERING, outputResource: ResourceType.STONE };
        const planksBusiness = { ...mockBusiness, type: BusinessType.PROCESSING, outputResource: ResourceType.PLANKS };
        const furnitureBusiness = { ...mockBusiness, type: BusinessType.SHOP, outputResource: ResourceType.FURNITURE };
        const marketBusiness = { ...mockBusiness, type: BusinessType.MARKET };

        expect(getBusinessName(woodBusiness)).toBe('Wood Cutter Camp');
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
        const mockUpgrade = jest.fn()
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockUpgrade}
                defaultTab="upgrades"
            />
        )
        const upgradeButtons = screen.getAllByRole('button', { name: /upgrade/i })
        fireEvent.click(upgradeButtons[0])
        expect(mockUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'incomingCapacity')
    })

    it('calls onUpgrade for processing speed upgrade', () => {
        const mockUpgrade = jest.fn()
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockUpgrade}
                defaultTab="upgrades"
            />
        )
        const upgradeButtons = screen.getAllByRole('button', { name: /upgrade/i })
        fireEvent.click(upgradeButtons[1])
        expect(mockUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'processingTime')
    })

    it('calls onUpgrade for output capacity upgrade', () => {
        const mockUpgrade = jest.fn()
        const upgradeBusiness = {
            ...mockBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
        }
        render(
            <BusinessPanel
                business={upgradeBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockUpgrade}
                defaultTab="upgrades"
            />
        )
        const upgradeButtons = screen.getAllByRole('button', { name: /upgrade/i })
        fireEvent.click(upgradeButtons[2])
        expect(mockUpgrade).toHaveBeenCalledWith(upgradeBusiness.id, 'outgoingCapacity')
    })
})

describe('getBufferStatusColor', () => {
    it('returns red when fillPercentage >= 90', () => {
        expect(getBufferStatusColor(9, 10)).toBe('text-red-500')
        expect(getBufferStatusColor(90, 100)).toBe('text-red-500')
    })
    it('returns yellow when 70 <= fillPercentage < 90', () => {
        expect(getBufferStatusColor(7, 10)).toBe('text-yellow-500')
        expect(getBufferStatusColor(75, 100)).toBe('text-yellow-500')
    })
    it('returns blue when 0 < fillPercentage <= 10', () => {
        expect(getBufferStatusColor(1, 10)).toBe('text-blue-500')
        expect(getBufferStatusColor(0.5, 10)).toBe('text-blue-500')
    })
    it('returns green for normal operation', () => {
        expect(getBufferStatusColor(5, 10)).toBe('text-green-500')
        expect(getBufferStatusColor(50, 100)).toBe('text-green-500')
    })
    it('handles null/undefined values', () => {
        expect(getBufferStatusColor(null, null)).toBe('text-green-500')
        expect(getBufferStatusColor(undefined, undefined)).toBe('text-green-500')
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