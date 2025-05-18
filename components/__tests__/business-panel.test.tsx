import { render, screen, fireEvent } from '@testing-library/react'
import BusinessPanel from '../business-panel'
import { BusinessType, ResourceType } from '@/lib/game-types'
import { getWorkerCost, getBotCost, getUpgradeCost } from '../business-panel'

// Mock the business data
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
    deliveryBots: [],
    position: { x: 0, y: 0 },
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

        expect(screen.getByText('Woodcutter')).toBeInTheDocument()
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

        // The close button is the first button rendered in the header
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

    it('switches between info and upgrades tabs', () => {
        render(
            <BusinessPanel
                business={mockBusiness}
                onClose={mockOnClose}
                onHireDeliveryBot={mockOnHireDeliveryBot}
                onUpgrade={mockOnUpgrade}
            />
        )

        const upgradesTab = screen.getByRole('tab', { name: /upgrades/i })
        fireEvent.click(upgradesTab)

        // Verify upgrades content is shown
        expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('calculates worker cost correctly', () => {
        const business = { ...mockBusiness, workers: [1, 2, 3] }
        expect(getWorkerCost(business)).toBe(66)
    })

    it('calculates bot cost correctly', () => {
        const business = { ...mockBusiness, deliveryBots: [1, 2] }
        expect(getBotCost(business)).toBe(144)
    })

    it('calculates upgrade cost correctly', () => {
        const business = { ...mockBusiness, level: 3 }
        expect(getUpgradeCost(business)).toBe(200)
    })
})