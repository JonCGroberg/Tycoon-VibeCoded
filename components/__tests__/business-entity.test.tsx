import { render, screen, fireEvent, act } from '@testing-library/react'
import BusinessEntity from '../business-entity'
import { BusinessType, ResourceType } from '@/lib/game-types'
import userEvent from '@testing-library/user-event'

describe('BusinessEntity', () => {
    const baseBusiness = {
        id: 'b1',
        type: BusinessType.RESOURCE_GATHERING,
        level: 1,
        position: { x: 100, y: 100 },
        inputResource: ResourceType.WOOD,
        outputResource: ResourceType.WOOD,
        incomingStorage: { current: 0, capacity: 10 },
        outgoingStorage: { current: 0, capacity: 10 },
        productionProgress: 0,
        workers: [],
        shippingTypes: [
            { type: 'truck', bots: [] },
        ],
        recentProfit: 0,
        profitDisplayTime: 0,
        processingTime: 1000,
        totalInvested: 0
    }

    const baseProps = {
        business: baseBusiness,
        onClick: jest.fn()
    }

    it('renders the business entity with correct level', () => {
        render(<BusinessEntity {...baseProps} />)
        expect(screen.getByText('Lvl 1')).toBeInTheDocument()
    })

    it('renders the correct business name for resource gathering', () => {
        render(<BusinessEntity {...baseProps} />)
        expect(screen.getByText('Wood Camp')).toBeInTheDocument()
    })

    it('renders the correct business name for processing', () => {
        const processingBusiness = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS
        }
        render(<BusinessEntity business={processingBusiness} onClick={baseProps.onClick} />)
        expect(screen.getByText('Plank Mill')).toBeInTheDocument()
    })

    it('calls onClick when clicked', () => {
        render(<BusinessEntity {...baseProps} />)
        fireEvent.click(screen.getByText('Wood Camp'))
        expect(baseProps.onClick).toHaveBeenCalled()
    })

    it('shows starvation indicator when input buffer is empty for processing business', () => {
        const processingBusiness = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            incomingStorage: { current: 0, capacity: 10 }
        }
        const { container } = render(<BusinessEntity business={processingBusiness} onClick={baseProps.onClick} />)
        expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
    })

    it('applies correct color classes based on business type', () => {
        const { container } = render(<BusinessEntity {...baseProps} />)
        expect(container.querySelector('.bg-green-200')).toBeInTheDocument()
        expect(container.querySelector('.border-green-600')).toBeInTheDocument()
    })

    it('shows tooltip with business name and instructions on hover', async () => {
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={baseBusiness} onClick={() => { }} />
            </div>
        )
        const entity = screen.getByTestId('business-entity')
        await act(async () => {
            userEvent.hover(entity)
        })
        // Tooltip should appear with business name and instructions
        expect(await screen.findByText('Wood Camp')).toBeInTheDocument()
        const tooltips = await screen.findAllByText((content) => content.includes('Click to manage, hold to move'))
        expect(tooltips.length).toBeGreaterThan(0)
    })

    it('shows starvation message in tooltip when input buffer is empty', async () => {
        const starvingBusiness = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            incomingStorage: { current: 0, capacity: 2 }
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={starvingBusiness} onClick={() => { }} />
            </div>
        )
        const entity = screen.getByTestId('business-entity')
        await act(async () => {
            userEvent.hover(entity)
        })
        // Should show colored dot and 'Needs Wood!' in the tooltip
        expect(document.querySelector('.bg-green-700')).toBeInTheDocument()
        const needsWood = await screen.findAllByText((content) => content.replace(/\s+/g, ' ').trim() === 'Needs Wood!')
        expect(needsWood.length).toBeGreaterThan(0)
        const instructions = await screen.findAllByText((content) => content.includes('Click to manage, hold to move'))
        expect(instructions.length).toBeGreaterThan(0)
    })

    it('shows warning message in tooltip when input buffer is low', async () => {
        const warningBusiness = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            incomingStorage: { current: 0.9, capacity: 2 }
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={warningBusiness} onClick={() => { }} />
            </div>
        )
        const entity = screen.getByTestId('business-entity')
        await act(async () => {
            userEvent.hover(entity)
        })
        // Wait for the tooltip to appear
        await new Promise(r => setTimeout(r, 600))
        // Find the tooltip container
        const tooltip = document.querySelector('[role="tooltip"]')?.parentElement || document.body
        expect(tooltip.textContent).toContain('Looking for')
        expect(tooltip.textContent).toContain('Wood')
        const instructions2 = await screen.findAllByText((content) => content.includes('Click to manage, hold to move'))
        expect(instructions2.length).toBeGreaterThan(0)
    })

    it('does not render resource indicators or tooltips for Market', () => {
        const marketBusiness = {
            ...baseBusiness,
            type: BusinessType.MARKET,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            incomingStorage: { current: 0, capacity: 10 },
            outgoingStorage: { current: 0, capacity: 10 }
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={marketBusiness} onClick={() => { }} />
            </div>
        )
        // Should not render resource indicators or buffer bars
        expect(document.querySelector('.border-yellow-400')).not.toBeInTheDocument()
        expect(document.querySelector('.border-blue-400')).not.toBeInTheDocument()
        expect(document.querySelector('.bg-green-700')).not.toBeInTheDocument()
        // Should not show warning/starvation tooltip
        fireEvent.mouseOver(screen.getByTestId('business-entity'))
        expect(screen.queryByText(/Needs|Looking for/)).not.toBeInTheDocument()
    })
})

describe('BusinessEntity advanced', () => {
    const baseBusiness = {
        id: 'b1',
        type: BusinessType.RESOURCE_GATHERING,
        level: 1,
        position: { x: 100, y: 100 },
        inputResource: ResourceType.WOOD,
        outputResource: ResourceType.WOOD,
        incomingStorage: { current: 0, capacity: 10 },
        outgoingStorage: { current: 0, capacity: 10 },
        productionProgress: 0,
        workers: [],
        shippingTypes: [],
        recentProfit: 0,
        profitDisplayTime: 0,
        processingTime: 1000,
        totalInvested: 0
    }

    it('calls onMove when drag is performed', () => {
        jest.useFakeTimers()
        const onMove = jest.fn()
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={baseBusiness} onClick={() => { }} onMove={onMove} />
            </div>
        )
        const entity = screen.getByTestId('business-entity')
        // Simulate mouse down and hold for 250ms before moving
        fireEvent.mouseDown(entity, { clientX: 110, clientY: 110 })
        act(() => {
            jest.advanceTimersByTime(250)
        })
        fireEvent.mouseMove(entity, { clientX: 120, clientY: 120 })
        fireEvent.mouseUp(entity)
        act(() => {
            jest.runOnlyPendingTimers()
        })
        expect(onMove).toHaveBeenCalled()
        jest.useRealTimers()
    })

    it('renders correct icon and color for all business types', () => {
        const types = [BusinessType.RESOURCE_GATHERING, BusinessType.PROCESSING, BusinessType.SHOP, BusinessType.MARKET]
        types.forEach(type => {
            render(<BusinessEntity business={{ ...baseBusiness, type }} onClick={() => { }} />)
        })
        // Just check that all icons and color classes are present
        expect(document.querySelector('.text-green-800')).toBeInTheDocument()
        expect(document.querySelector('.text-amber-700')).toBeInTheDocument()
        expect(document.querySelector('.text-blue-700')).toBeInTheDocument()
        expect(document.querySelector('.text-yellow-500')).toBeInTheDocument()
    })

    it('renders correct resource color and icon for all resource types', () => {
        Object.values(ResourceType).forEach(resourceType => {
            render(<BusinessEntity business={{ ...baseBusiness, inputResource: resourceType, outputResource: resourceType }} onClick={() => { }} />)
        })
        // Check for at least one icon and color
        expect(document.querySelector('svg')).toBeInTheDocument()
    })

    it('renders buffer status colors for edge cases', () => {
        // 0% (should be green), 50% (should be green), 85% (should be red)
        const cases = [
            { current: 0, capacity: 10, expected: 'bg-green-500' },
            { current: 5, capacity: 10, expected: 'bg-green-500' },
            { current: 9, capacity: 10, expected: 'bg-red-500' }
        ]
        cases.forEach(({ current, capacity, expected }) => {
            render(<BusinessEntity business={{ ...baseBusiness, type: BusinessType.PROCESSING, incomingStorage: { current, capacity }, outgoingStorage: { current, capacity } }} onClick={() => { }} />)
            expect(document.querySelector(`.${expected}`)).toBeInTheDocument()
        })
    })

    it('renders shipping type icons for TRUCK, BOAT, PLANE', () => {
        const shippingTypes = [
            { type: 'truck', bots: [{ id: '1', maxLoad: 1, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 }] },
            { type: 'ship', bots: [{ id: '2', maxLoad: 1, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 }] },
            { type: 'plane', bots: [{ id: '3', maxLoad: 1, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 }] },
            { type: 'cargo_plane', bots: [{ id: '4', maxLoad: 1, speed: 1, isDelivering: false, targetBusinessId: null, currentLoad: 0 }] }
        ]
        render(<BusinessEntity business={{ ...baseBusiness, shippingTypes }} onClick={() => { }} />)
        // Use case-insensitive selectors and check for at least one matching element for each icon
        expect(document.querySelectorAll('[class*="lucide-truck"]').length).toBeGreaterThan(0)
        expect(document.querySelectorAll('[class*="lucide-ship"]').length).toBeGreaterThan(0)
        expect(document.querySelectorAll('[class*="lucide-plane"]').length).toBeGreaterThan(0)
    })
})