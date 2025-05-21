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

    // Test each property individually for better error messages
    expect(market.type).toBe(BusinessType.MARKET)
    expect(market.position).toEqual({ x: 400, y: 100 })
    expect(market.incomingStorage).toBeDefined()
    expect(market.incomingStorage.current).toBe(0)
    expect(market.incomingStorage.capacity).toBe(10)
    expect(market.outgoingStorage).toBeDefined()
    expect(market.outgoingStorage.current).toBe(0)
    expect(market.outgoingStorage.capacity).toBe(10)
    expect(market.productionProgress).toBe(0)
    expect(market.workers).toEqual([])
    expect(market.shippingTypes).toHaveLength(0)
    expect(market.level).toBe(1)
    expect(market.inputResource).toBe(ResourceType.NONE)
    expect(market.outputResource).toBe(ResourceType.NONE)
  })

  it('initializes achievements with all keys set to false', () => {
    const state = initializeGameState()
    expect(state.achievements).toBeDefined()
    expect(state.achievements.firstBusiness).toBe(false)
    expect(state.achievements.tycoon).toBe(false)
    expect(state.achievements.industrialist).toBe(false)
    expect(state.achievements.masterUpgrader).toBe(false)
    expect(state.achievements.logisticsPro).toBe(false)
    expect(state.achievements.marketMogul).toBe(false)
    expect(state.achievements.shippingMaster).toBe(false)
    expect(state.achievements.relocator).toBe(false)
    expect(state.achievements.maxedOut).toBe(false)
    expect(state.achievements.fastTycoon).toBe(false)
  })
})