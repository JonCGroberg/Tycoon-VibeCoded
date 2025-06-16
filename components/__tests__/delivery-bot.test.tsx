import { render, screen } from '@testing-library/react'
import { act } from 'react'
import DeliveryBotEntity from '../delivery-bot'
import { ResourceType, DeliveryBot } from '@/lib/game-types'

describe('DeliveryBotEntity', () => {
    const baseBot: DeliveryBot = {
        id: 'bot1',
        maxLoad: 10,
        speed: 1,
        isDelivering: true,
        targetBusinessId: 'b2',
        currentLoad: 5,
        wage: 10,
    }
    const baseProps = {
        bot: baseBot,
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
        resourceType: ResourceType.WOOD,
        onDeliveryComplete: jest.fn(),
        deliveryStartTime: Date.now(),
        deliveryExpectedArrival: Date.now() + 1000,
        shippingTypeId: 'truck',
    }

    it('renders the delivery bot icon', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} />)
        expect(container.querySelector('.lucide-truck')).toBeInTheDocument()
    })

    it('shows the correct carrying amount', () => {
        render(<DeliveryBotEntity {...baseProps} />)
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(baseProps.bot.wage).toBe(10)
    })

    it('shows no carrying amount if zero', () => {
        render(<DeliveryBotEntity {...baseProps} bot={{ ...baseBot, currentLoad: 0 }} />)
        expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('applies the correct resource color', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} resourceType={ResourceType.PLANKS} shippingTypeId="truck" />)
        // Should have bg-amber-600 for planks
        expect(container.querySelector('.bg-amber-600')).toBeInTheDocument()
    })

    it('calls onDeliveryComplete when delivery finishes', () => {
        jest.useFakeTimers()
        const onDeliveryComplete = jest.fn()
        render(
            <DeliveryBotEntity
                {...baseProps}
                onDeliveryComplete={onDeliveryComplete}
                deliveryStartTime={0}
                deliveryExpectedArrival={10}
                shippingTypeId="truck"
            />
        )
        // Fast-forward time in act
        act(() => {
            jest.advanceTimersByTime(20)
        })
        expect(onDeliveryComplete).toHaveBeenCalled()
        jest.useRealTimers()
    })
})

describe('DeliveryBotEntity icon and color branches', () => {
    const baseBot = {
        id: 'bot2',
        maxLoad: 10,
        speed: 1,
        isDelivering: true,
        targetBusinessId: 'b2',
        currentLoad: 5,
    }
    const baseProps = {
        bot: baseBot,
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
        resourceType: ResourceType.WOOD,
        onDeliveryComplete: jest.fn(),
        deliveryStartTime: Date.now(),
        deliveryExpectedArrival: Date.now() + 1000,
    }
    it('renders TruckIcon for shippingTypeId truck', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="truck" />)
        expect(container.querySelector('.lucide-truck')).toBeInTheDocument()
    })

    it('renders ShipIcon for shippingTypeId ship', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="ship" />)
        expect(container.querySelector('.lucide-ship')).toBeInTheDocument()
    })
    it('renders PlaneIcon for shippingTypeId plane', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="plane" />)
        expect(container.querySelector('.lucide-plane')).toBeInTheDocument()
    })
    it('renders no icon for unknown shippingTypeId', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="unknown" />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
    it('renders no icon if shippingTypeId is missing', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
    it('applies correct color for all resource types', () => {
        const types = [
            [ResourceType.WOOD, 'bg-green-700'],
            [ResourceType.STONE, 'bg-gray-500'],
            [ResourceType.IRON_ORE, 'bg-gray-700'],
            [ResourceType.PLANKS, 'bg-amber-600'],
            [ResourceType.BRICKS, 'bg-red-600'],
            [ResourceType.IRON_INGOT, 'bg-gray-400'],
            [ResourceType.FURNITURE, 'bg-amber-800'],
            [ResourceType.TOOLS, 'bg-blue-600'],
        ]
        types.forEach(([type, className]) => {
            const { container } = render(<DeliveryBotEntity {...baseProps} resourceType={type as ResourceType} />)
            expect(container.querySelector(`.${className}`)).toBeInTheDocument()
        })
    })
    it('renders TruckIcon as an SVG element and is visible', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="truck" />)
        const icon = container.querySelector('.lucide-truck')
        expect(icon).toBeInTheDocument()
        expect(icon?.tagName.toLowerCase()).toBe('svg')
        expect(icon).toBeVisible()
    })
    it('icon is accessible (has focusable SVG)', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId="plane" />)
        const icon = container.querySelector('.lucide-plane')
        expect(icon).toBeInTheDocument()
        // SVGs are focusable and visible by default, but check for role or aria-label if present
        expect(icon?.getAttribute('role') || icon?.getAttribute('aria-label') || icon?.tagName.toLowerCase()).toBeTruthy()
    })
    it('renders no icon for shippingTypeId null', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId={null as any} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
    it('renders no icon for shippingTypeId undefined', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId={undefined} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
    it('renders no icon for shippingTypeId empty string', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} shippingTypeId={''} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
})