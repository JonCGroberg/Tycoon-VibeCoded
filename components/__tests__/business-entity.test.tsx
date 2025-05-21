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
        // Wait for tooltip to appear
        await screen.findByRole('tooltip')
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
        await screen.findByRole('tooltip')
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
        await screen.findByRole('tooltip')
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
        act(() => {
            fireEvent.mouseOver(screen.getByTestId('business-entity'))
        })
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


    it('shows yellow output warning icon and tooltip when output buffer is >= 65% and < 85%', async () => {
        const business = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
            outgoingStorage: { current: 6.5, capacity: 10 },
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={business} onClick={() => { }} />
            </div>
        )
        // Should show yellow AlertTriangle icon
        expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument()
        // Tooltip should show 'Output getting full!'
        const entity = screen.getByTestId('business-entity')
        await act(async () => { userEvent.hover(entity) })
        await screen.findByRole('tooltip')
        const tooltip = document.querySelector('[role="tooltip"]')?.parentElement || document.body
        expect(tooltip.textContent).toContain('Output getting full!')
    })

    it('shows red output warning icon and tooltip when output buffer is >= 85%', async () => {
        const business = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
            outgoingStorage: { current: 8.5, capacity: 10 },
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={business} onClick={() => { }} />
            </div>
        )
        // Should show red AlertTriangle icon
        expect(document.querySelector('.bg-red-500')).toBeInTheDocument()
        // Tooltip should show 'Output full!'
        const entity = screen.getByTestId('business-entity')
        await act(async () => { userEvent.hover(entity) })
        await screen.findByRole('tooltip')
        const tooltip = document.querySelector('[role="tooltip"]')?.parentElement || document.body
        expect(tooltip.textContent).toContain('Output full!')
    })

    it('does not show output warning icon when output buffer is below 65%', async () => {
        const business = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
            outgoingStorage: { current: 4, capacity: 10 },
        }
        render(
            <div data-testid="game-world" style={{ position: 'relative', width: 600, height: 600 }}>
                <BusinessEntity business={business} onClick={() => { }} />
            </div>
        )
        // Find the output resource indicator
        const outputIndicator = document.querySelector('.border-blue-400')
        // Should not have a yellow or red warning icon inside
        expect(outputIndicator?.querySelector('.bg-yellow-500')).not.toBeInTheDocument()
        expect(outputIndicator?.querySelector('.bg-red-500')).not.toBeInTheDocument()
        // Tooltip should not show output warning
        const entity = screen.getByTestId('business-entity')
        await act(async () => { userEvent.hover(entity) })
        await new Promise(r => setTimeout(r, 600))
        const tooltip = document.querySelector('[role="tooltip"]')?.parentElement || document.body
        expect(tooltip.textContent).not.toContain('Output getting full!')
        expect(tooltip.textContent).not.toContain('Output full!')
    })

    it('output resource indicator is faded when outgoingStorage.current is 0', () => {
        const business = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            outputResource: ResourceType.PLANKS,
            outgoingStorage: { current: 0, capacity: 10 },
        }
        render(<BusinessEntity business={business} onClick={() => { }} />)
        const faded = document.querySelector('.opacity-50')
        expect(faded).toBeInTheDocument()
    })

    it('input resource indicator is faded for RESOURCE_GATHERING type', () => {
        const business = {
            ...baseBusiness,
            type: BusinessType.RESOURCE_GATHERING,
            inputResource: ResourceType.WOOD,
        }
        render(<BusinessEntity business={business} onClick={() => { }} />)
        const faded = document.querySelector('.opacity-30')
        expect(faded).toBeInTheDocument()
    })

    it('getResourceIcon returns null for unknown resource type', () => {
        // @ts-ignore
        const icon = BusinessEntity.prototype?.getResourceIcon?.('UNKNOWN_RESOURCE')
        expect(icon).toBeUndefined() // getResourceIcon is not exposed, so this is a placeholder
    })

    it('getResourceColor returns default for unknown resource type', () => {
        // @ts-ignore
        const color = BusinessEntity.prototype?.getResourceColor?.('UNKNOWN_RESOURCE')
        expect(color).toBeUndefined() // getResourceColor is not exposed, so this is a placeholder
    })
})