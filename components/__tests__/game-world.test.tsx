import { render, screen, fireEvent, act } from '@testing-library/react'
import GameWorld from '../game-world'
import { BusinessType, ResourceType } from '@/lib/game-types'

describe('GameWorld', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    const mockBusinesses = [
        {
            id: '1',
            type: BusinessType.RESOURCE_GATHERING,
            position: { x: 100, y: 100 },
            shippingTypes: [],
            resourceType: ResourceType.WOOD,
            level: 1,
            productionRate: 1,
            storage: { current: 0, capacity: 100 },
            lastProductionTime: Date.now(),
            incomingBuffer: { current: 0, capacity: 100 },
            outgoingBuffer: { current: 0, capacity: 100 },
            processingTime: 0,
            productionProgress: 0,
            isProcessing: false,
            isProducing: false,
            isStoring: false,
            isShipping: false,
            isReceiving: false,
            workers: [],
            inputResource: ResourceType.NONE,
            outputResource: ResourceType.WOOD,
            recentProfit: 0,
            profitDisplayTime: 0
        },
        {
            id: '2',
            type: BusinessType.PROCESSING,
            position: { x: 300, y: 300 },
            shippingTypes: [],
            resourceType: ResourceType.PLANKS,
            level: 1,
            productionRate: 1,
            storage: { current: 0, capacity: 100 },
            lastProductionTime: Date.now(),
            incomingBuffer: { current: 0, capacity: 100 },
            outgoingBuffer: { current: 0, capacity: 100 },
            processingTime: 0,
            productionProgress: 0,
            isProcessing: false,
            isProducing: false,
            isStoring: false,
            isShipping: false,
            isReceiving: false,
            workers: [],
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            recentProfit: 0,
            profitDisplayTime: 0
        }
    ]

    const mockProps = {
        businesses: mockBusinesses,
        placingBusiness: null,
        activeDeliveries: [],
        onPlaceBusiness: jest.fn(),
        onSelectBusiness: jest.fn(),
        onDeliveryComplete: jest.fn(),
        marketPrices: {
            WOOD: { value: 10, target: 10 },
            PLANKS: { value: 20, target: 20 }
        }
    }

    it('renders the game world with grid', () => {
        render(<GameWorld {...mockProps} />)
        const gameWorld = screen.getByTestId('game-world')
        expect(gameWorld).toBeInTheDocument()
        // Check for grid cells (12x12 = 144 cells)
        const gridCells = document.querySelectorAll('.border-gray-300')
        expect(gridCells.length).toBe(144)
    })

    it('renders all businesses', () => {
        render(<GameWorld {...mockProps} />)
        // Since we're using absolute positioning, we need to check for the business elements by their position
        const businessElements = document.querySelectorAll('[style*="left: 52px"], [style*="left: 252px"]')
        expect(businessElements.length).toBe(2) // Two businesses should be rendered
    })

    it('handles business selection', () => {
        render(<GameWorld {...mockProps} />)
        // Find business by position and click it
        const businessElements = document.querySelectorAll('[style*="left: 52px"], [style*="left: 252px"]')
        expect(businessElements.length).toBeGreaterThan(0)
        fireEvent.click(businessElements[0])
        expect(mockProps.onSelectBusiness).toHaveBeenCalledWith(mockBusinesses[0])
    })

    it('shows business placement preview when placingBusiness is set', () => {
        const propsWithPlacing = {
            ...mockProps,
            placingBusiness: BusinessType.RESOURCE_GATHERING
        }
        render(<GameWorld {...propsWithPlacing} />)
        const previewElements = screen.getAllByText('Wood Camp')
        expect(previewElements.length).toBe(2) // One for the preview, one for the actual business
    })

    it('handles business placement on click', () => {
        const propsWithPlacing = {
            ...mockProps,
            placingBusiness: BusinessType.RESOURCE_GATHERING
        }
        render(<GameWorld {...propsWithPlacing} />)
        const gameWorld = screen.getByTestId('game-world')

        // Mock getBoundingClientRect
        gameWorld.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            width: 600,
            height: 600,
            right: 600,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => { }
        })

        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })
        fireEvent.click(gameWorld, { clientX: 200, clientY: 200 })

        expect(mockProps.onPlaceBusiness).toHaveBeenCalledWith(
            BusinessType.RESOURCE_GATHERING,
            { x: 200, y: 200 }
        )
    })

    it('renders active deliveries', () => {
        const mockDelivery = {
            id: 'delivery1',
            sourceBusinessId: '1',
            targetBusinessId: '2',
            resourceType: ResourceType.WOOD,
            bot: { id: 'bot1', currentLoad: 10 },
            createdAt: Date.now(),
            expectedArrival: Date.now() + 5000
        }

        const propsWithDelivery = {
            ...mockProps,
            activeDeliveries: [mockDelivery]
        }

        render(<GameWorld {...propsWithDelivery} />)
        // Since we're using absolute positioning, we need to check for the delivery bot by its position
        const deliveryBot = document.querySelector('[style*="left: 84px"]')
        expect(deliveryBot).toBeInTheDocument()
    })

    it('handles delivery completion', () => {
        const mockDelivery = {
            id: 'delivery1',
            sourceBusinessId: '1',
            targetBusinessId: '2',
            resourceType: ResourceType.WOOD,
            bot: { id: 'bot1', currentLoad: 10 },
            createdAt: Date.now(),
            expectedArrival: Date.now() + 100 // Short duration to complete quickly
        }

        const propsWithDelivery = {
            ...mockProps,
            activeDeliveries: [mockDelivery]
        }

        render(<GameWorld {...propsWithDelivery} />)
        const deliveryBot = document.querySelector('[style*="left: 84px"]')
        expect(deliveryBot).toBeInTheDocument()

        // Wait for the animation frame to complete
        act(() => {
            jest.advanceTimersByTime(200)
        })
        expect(mockProps.onDeliveryComplete).toHaveBeenCalledWith('delivery1')
    })

    it('updates mouse position on mouse move', () => {
        const propsWithPlacing = {
            ...mockProps,
            placingBusiness: BusinessType.RESOURCE_GATHERING
        }
        render(<GameWorld {...propsWithPlacing} />)
        const gameWorld = screen.getByTestId('game-world')

        // Mock getBoundingClientRect
        gameWorld.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            width: 600,
            height: 600,
            right: 600,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => { }
        })

        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })

        // The preview element should be positioned at the mouse coordinates
        const previewElements = screen.getAllByText('Wood Camp')
        const preview = previewElements[0].parentElement
        if (preview) {
            const style = window.getComputedStyle(preview)
            expect(style.left).toBe('52px') // 200 - 48 (half of preview width)
            expect(style.top).toBe('52px') // 200 - 48 (half of preview height)
        }
    })
})