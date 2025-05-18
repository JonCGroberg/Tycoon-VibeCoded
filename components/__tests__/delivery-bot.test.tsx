import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import DeliveryBotEntity from '../delivery-bot'
import { ResourceType, DeliveryBot } from '@/lib/game-types'

describe('DeliveryBotEntity', () => {
    const baseBot: DeliveryBot = {
        id: 'bot1',
        capacity: 10,
        speed: 1,
        isDelivering: true,
        targetBusinessId: 'b2',
        carryingAmount: 5,
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

    it('renders the delivery bot icon', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} />)
        expect(container.querySelector('.lucide-truck')).toBeInTheDocument()
    })

    it('shows the correct carrying amount', () => {
        render(<DeliveryBotEntity {...baseProps} />)
        expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('shows no carrying amount if zero', () => {
        render(<DeliveryBotEntity {...baseProps} bot={{ ...baseBot, carryingAmount: 0 }} />)
        expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('applies the correct resource color', () => {
        const { container } = render(<DeliveryBotEntity {...baseProps} resourceType={ResourceType.PLANKS} />)
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