import { generateUniqueId, initializeGameState } from '../game-logic'
import { BusinessType, ResourceType } from '../game-types'

describe('generateUniqueId', () => {
  it('generates unique IDs with the given prefix', () => {
    const id1 = generateUniqueId('test')
    const id2 = generateUniqueId('test')
    expect(id1).not.toEqual(id2)
    expect(id1.startsWith('test-')).toBe(true)
    expect(id2.startsWith('test-')).toBe(true)
  })

  it('IDs contain a random string', () => {
    const id = generateUniqueId('foo')
    // Should have a dash and a random string after the prefix and counter
    expect(id).toMatch(/^foo-\d+-[a-z0-9]+$/)
  })
})

describe('initializeGameState', () => {
  it('returns a valid initial game state', () => {
    const state = initializeGameState()
    expect(state.coins).toBe(2000)
    expect(Array.isArray(state.businesses)).toBe(true)
    expect(state.businesses.length).toBeGreaterThan(0)
    expect(state.activeDeliveries).toEqual([])
  })

  it('initializes a market business with correct properties', () => {
    const state = initializeGameState()
    const market = state.businesses.find(b => b.type === BusinessType.MARKET)
    expect(market).toBeDefined()
    if (!market) throw new Error('Market business not found')
    expect(market.position).toEqual({ x: 400, y: 100 })
    expect(market.incomingBuffer).toEqual({ current: 0, capacity: Number.POSITIVE_INFINITY })
    expect(market.outgoingBuffer).toEqual({ current: 0, capacity: 0 })
    expect(market.processingTime).toBe(0)
    expect(market.productionProgress).toBe(0)
    expect(market.workers).toEqual([])
    expect(market.deliveryBots).toEqual([])
    expect(market.level).toBe(1)
    expect(market.inputResource).toBe(ResourceType.NONE)
    expect(market.outputResource).toBe(ResourceType.NONE)
  })
})