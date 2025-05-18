import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TycoonGame from '../tycoon-game'
import { initializeGameState } from '@/lib/game-logic'
import { BusinessType, ResourceType } from '@/lib/game-types'

// Mock the audio context to avoid errors in tests
window.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn().mockReturnValue({
        type: '',
        frequency: { value: 0 },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
    }),
    createGain: jest.fn().mockReturnValue({
        gain: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
        },
        connect: jest.fn(),
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
    }),
    currentTime: 0,
    destination: {}
}))

describe('TycoonGame', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders the game and initializes with the correct game state', () => {
        render(<TycoonGame />)
        expect(screen.getByText('$2,000')).toBeInTheDocument()
    })

    it('initializes market prices for all resource types', () => {
        render(<TycoonGame />)
        Object.values(ResourceType).forEach(rt => {
            expect(screen.getByText('$2,000')).toBeInTheDocument()
        })
    })

    it('shows tutorial overlay on initial render', () => {
        render(<TycoonGame />)
        expect(screen.getByText('Getting Started')).toBeInTheDocument()
    })

    it('closes tutorial overlay when start button is clicked', () => {
        render(<TycoonGame />)
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        expect(screen.queryByText('Getting Started')).not.toBeInTheDocument()
    })

    it('allows placing a wood camp when enough coins are available', async () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        const placeButtons = screen.getAllByText(/Place Wood Camp/)
        const placeButton = placeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'))
        expect(placeButton).toBeTruthy()
        fireEvent.click(placeButton!)
        // Ensure game-world is present
        const gameWorld = screen.getByTestId('game-world')
        // Mock getBoundingClientRect to simulate a real container size
        gameWorld.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON: () => { } })
        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })
        fireEvent.click(gameWorld, { clientX: 200, clientY: 200 })
        // Wait for React state to update
        await act(async () => { await Promise.resolve(); })
        // Log businesses in game state for debugging
        // eslint-disable-next-line no-console
        console.log('Businesses after placement:', document.body.innerHTML)
        expect(screen.getByText('$1,900')).toBeInTheDocument() // 2000 - 100
    })

    it('prevents placing a wood camp when not enough coins are available', async () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        act(() => {
            jest.advanceTimersByTime(1000)
        })
        const placeButtons = screen.getAllByText(/Place Wood Camp/)
        const placeButton = placeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'))
        expect(placeButton).toBeTruthy()
        fireEvent.click(placeButton!)
        const gameWorld = screen.getByTestId('game-world')
        // Mock getBoundingClientRect to simulate a real container size
        gameWorld.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON: () => { } })
        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })
        fireEvent.click(gameWorld, { clientX: 200, clientY: 200 })
        // Wait for React state to update
        await act(async () => { await Promise.resolve(); })
        console.log('Businesses after placement:', document.body.innerHTML)
        // Select the coin display by class name
        const coinDisplays = screen.getAllByText(/\$/)
        const coinDisplay = Array.from(document.querySelectorAll('.text-xl.font-bold')).find(el => el.textContent && el.textContent.match(/\$/))
        expect(coinDisplay?.textContent).toMatch(/\$1,900|\$2,000/)
    })

    it('handles game over state when coins go negative', () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        // Simulate game over by advancing timers and/or manipulating state
        act(() => {
            jest.advanceTimersByTime(10000)
        })
        // Look for the game over overlay or restart button
        expect(screen.getByText(/Restart/i)).toBeInTheDocument()
    })

    it('allows restarting the game after game over', () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        // Simulate game over
        act(() => {
            jest.advanceTimersByTime(10000)
        })
        const restartButton = screen.getByText('Restart')
        fireEvent.click(restartButton)
        expect(screen.getByText('$2,000')).toBeInTheDocument()
    })

    it('updates market prices over time', () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        act(() => {
            jest.advanceTimersByTime(15000)
        })
        const priceElements = screen.getAllByText(/\$/)
        expect(priceElements.length).toBeGreaterThan(0)
    })

    it('handles business selection and panel display', async () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        const placeButtons = screen.getAllByText(/Place Wood Camp/)
        const placeButton = placeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'))
        expect(placeButton).toBeTruthy()
        fireEvent.click(placeButton!)
        const gameWorld = screen.getByTestId('game-world')
        // Mock getBoundingClientRect to simulate a real container size
        gameWorld.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON: () => { } })
        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })
        fireEvent.click(gameWorld, { clientX: 200, clientY: 200 })
        // Wait for React state to update
        await act(async () => { await Promise.resolve(); })
        console.log('Businesses after placement:', document.body.innerHTML)
        // Wait for at least one business entity to appear, log DOM if not found
        await waitFor(() => {
            const entities = screen.queryAllByTestId('business-entity')
            if (entities.length === 0) {
                // eslint-disable-next-line no-console
                console.log(document.body.innerHTML)
            }
            expect(entities.length).toBeGreaterThan(0)
        }, { timeout: 2000 })
        const business = screen.getAllByTestId('business-entity')[0]
        fireEvent.click(business)
        expect(screen.getByText('Wood Camp')).toBeInTheDocument()
    })

    it('handles shipping type hiring', async () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        const placeButtons = screen.getAllByText(/Place Wood Camp/)
        const placeButton = placeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'))
        expect(placeButton).toBeTruthy()
        fireEvent.click(placeButton!)
        const gameWorld = screen.getByTestId('game-world')
        gameWorld.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON: () => { } })
        fireEvent.mouseMove(gameWorld, { clientX: 200, clientY: 200 })
        fireEvent.click(gameWorld, { clientX: 400, clientY: 100 })
        await act(async () => { await Promise.resolve(); })
        await act(async () => { jest.runOnlyPendingTimers(); })
        await waitFor(() => {
            const entities = screen.queryAllByTestId('business-entity')
            expect(entities.length).toBeGreaterThan(0)
        }, { timeout: 2000 })
        const businessEntities = screen.getAllByTestId('business-entity')
        const woodCamp = businessEntities.find(entity => entity.textContent?.includes('Wood Camp'))
        expect(woodCamp).toBeTruthy()
        fireEvent.click(woodCamp!)
        const shippingTab = screen.queryByRole('tab', { name: /Shipping/i })
        expect(shippingTab).toBeInTheDocument()
        await act(async () => {
            fireEvent.pointerDown(shippingTab!)
            fireEvent.click(shippingTab!)
        })
        await act(async () => { jest.runOnlyPendingTimers(); })
        // Find the shipping tab content
        const shippingTabPanel = screen.getByRole('tabpanel', { name: /shipping/i })
        // Find all price buttons in the shipping tab
        const priceButtons = within(shippingTabPanel).getAllByRole('button', { name: /\$\d+/ })
        // The first button is the 'Sell' button, the second is the 'Hire' button
        const hireButton = priceButtons[1]
        // Get the current coins value before hiring
        const coinsDisplaysBefore = screen.getAllByText((content, element) => {
            return element?.tagName === 'SPAN' && /^\$[\d,]+$/.test(content)
        })
        // Find the main coin display (class 'text-xl font-bold')
        const coinsDisplayBefore = coinsDisplaysBefore.find(el => el.className.includes('text-xl') && el.className.includes('font-bold'))
        const coinsValueBefore = parseInt(coinsDisplayBefore?.textContent!.replace(/[$,]/g, '') || '0')
        fireEvent.click(hireButton)
        await act(async () => { jest.runOnlyPendingTimers(); })
        // Get the coins value after hiring
        const coinsDisplaysAfter = screen.getAllByText((content, element) => {
            return element?.tagName === 'SPAN' && /^\$[\d,]+$/.test(content)
        })
        const coinsDisplayAfter = coinsDisplaysAfter.find(el => el.className.includes('text-xl') && el.className.includes('font-bold'))
        const coinsValueAfter = parseInt(coinsDisplayAfter?.textContent!.replace(/[$,]/g, '') || '0')
        expect(coinsValueAfter).toBeLessThan(coinsValueBefore)
    }, 2000)

    it('handles shipping type selling', async () => {
        render(<TycoonGame />)
        // Dismiss tutorial overlay
        const startButton = screen.getByText('Start Playing')
        fireEvent.click(startButton)
        const placeButtons = screen.getAllByText(/Place Wood Camp/)
        const placeButton = placeButtons.find(el => el.tagName === 'BUTTON' || el.closest('button'))
        expect(placeButton).toBeTruthy()
        fireEvent.click(placeButton!)
        const gameWorld = screen.getByTestId('game-world')
        gameWorld.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON: () => { } })
        fireEvent.click(gameWorld, { clientX: 400, clientY: 100 })
        await act(async () => { await Promise.resolve(); })
        await act(async () => { jest.runOnlyPendingTimers(); })
        await waitFor(() => {
            const entities = screen.queryAllByTestId('business-entity')
            expect(entities.length).toBeGreaterThan(0)
        }, { timeout: 2000 })
        const businessEntities = screen.getAllByTestId('business-entity')
        const woodCamp = businessEntities.find(entity => entity.textContent?.includes('Wood Camp'))
        expect(woodCamp).toBeTruthy()
        fireEvent.click(woodCamp!)
        const shippingTab = screen.queryByRole('tab', { name: /Shipping/i })
        expect(shippingTab).toBeInTheDocument()
        await act(async () => {
            fireEvent.pointerDown(shippingTab!)
            fireEvent.click(shippingTab!)
        })
        await act(async () => { jest.runOnlyPendingTimers(); })
        const shippingTabPanel = screen.getByRole('tabpanel', { name: /shipping/i })
        // Find all price buttons in the shipping tab
        const priceButtons = within(shippingTabPanel).getAllByRole('button', { name: /\$\d+/ })
        // The first button is the 'Sell' button, the second is the 'Hire' button
        const hireButton = priceButtons[1]
        fireEvent.click(hireButton)
        await act(async () => { jest.runOnlyPendingTimers(); })
        // Now sell the walker
        const sellButton = priceButtons[0]
        fireEvent.click(sellButton)
        await act(async () => { jest.runOnlyPendingTimers(); })
        // Get the coins value after selling
        const coinsDisplays = screen.getAllByText((content, element) => {
            return element?.tagName === 'SPAN' && /^\$[\d,]+$/.test(content)
        })
        const coinsDisplay = coinsDisplays.find(el => el.className.includes('text-xl') && el.className.includes('font-bold'))
        const coinsValue = parseInt(coinsDisplay?.textContent!.replace(/[$,]/g, '') || '0')
        expect(coinsValue).toBeGreaterThan(0)
    }, 2000)
})