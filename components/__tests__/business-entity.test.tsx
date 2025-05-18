import { render, screen, fireEvent } from '@testing-library/react'
import BusinessEntity from '../business-entity'
import { BusinessType, ResourceType, DeliveryBot } from '@/lib/game-types'

describe('BusinessEntity', () => {
    const baseBusiness = {
        id: 'b1',
        type: BusinessType.RESOURCE_GATHERING,
        level: 1,
        position: { x: 100, y: 100 },
        inputResource: ResourceType.WOOD,
        outputResource: ResourceType.WOOD,
        incomingBuffer: { current: 0, capacity: 10 },
        outgoingBuffer: { current: 0, capacity: 10 },
        productionProgress: 0,
        workers: [],
        deliveryBots: [],
        recentProfit: 0,
        profitDisplayTime: 0,
        processingTime: 1000
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
        expect(screen.getByText('Wood Cutter Camp')).toBeInTheDocument()
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
        fireEvent.click(screen.getByText('Wood Cutter Camp'))
        expect(baseProps.onClick).toHaveBeenCalled()
    })

    it('shows delivery bot count when present', () => {
        const mockDeliveryBots: DeliveryBot[] = [
            {
                id: 'bot1',
                capacity: 10,
                speed: 1,
                isDelivering: false,
                targetBusinessId: '',
                carryingAmount: 0
            },
            {
                id: 'bot2',
                capacity: 10,
                speed: 1,
                isDelivering: false,
                targetBusinessId: '',
                carryingAmount: 0
            }
        ]
        const businessWithBots = {
            ...baseBusiness,
            deliveryBots: mockDeliveryBots
        }
        render(<BusinessEntity business={businessWithBots} onClick={baseProps.onClick} />)
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('drivers')).toBeInTheDocument()
    })

    it('shows starvation indicator when input buffer is empty for processing business', () => {
        const processingBusiness = {
            ...baseBusiness,
            type: BusinessType.PROCESSING,
            inputResource: ResourceType.WOOD,
            outputResource: ResourceType.PLANKS,
            incomingBuffer: { current: 0, capacity: 10 }
        }
        render(<BusinessEntity business={processingBusiness} onClick={baseProps.onClick} />)
        expect(screen.getByText('Needs Wood')).toBeInTheDocument()
    })

    it('shows profit indicator when there is recent profit', () => {
        const businessWithProfit = {
            ...baseBusiness,
            recentProfit: 10.5,
            profitDisplayTime: 1000
        }
        render(<BusinessEntity business={businessWithProfit} onClick={baseProps.onClick} />)
        expect(screen.getByText('+10.5')).toBeInTheDocument()
    })

    it('applies correct color classes based on business type', () => {
        const { container } = render(<BusinessEntity {...baseProps} />)
        expect(container.querySelector('.bg-green-200')).toBeInTheDocument()
        expect(container.querySelector('.border-green-600')).toBeInTheDocument()
    })
})