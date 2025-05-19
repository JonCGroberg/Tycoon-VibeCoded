import { calculateEquity } from '../game-utils'
describe('calculateEquity', () => {
    it('returns 0 for empty businesses', () => {
        expect(calculateEquity([])).toBe(0)
    })
    it('sums totalInvested for all businesses', () => {
        const businesses = [
            { totalInvested: 100 },
            { totalInvested: 200 },
            { totalInvested: 0 },
        ]
        expect(calculateEquity(businesses as any)).toBe(300)
    })
    it('handles missing totalInvested', () => {
        const businesses = [
            {},
            { totalInvested: 50 },
        ]
        expect(calculateEquity(businesses as any)).toBe(50)
    })
})