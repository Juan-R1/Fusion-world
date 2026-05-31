import { describe, expect, test } from 'vitest'
import {
  median,
  coverageStatus,
  oldestFreshnessDays,
  computeSetAggregates,
  computeChaseRadar,
} from '../src/lib/setAggregates.js'

// Minimal card factory — only the fields the aggregates read.
function card(over = {}) {
  return {
    set: 'FB01',
    setName: 'Awakened Pulse',
    rarity: 'C',
    name: 'Test',
    cardCode: 'FB01-001',
    marketPrice: 1,
    delta: 0,
    priceStatus: 'live',
    priceTimestamp: '2026-05-01T00:00:00.000Z',
    ...over,
  }
}

describe('median', () => {
  test('odd and even length', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
  test('empty array → 0', () => {
    expect(median([])).toBe(0)
  })
})

describe('coverageStatus (spec § 5 thresholds)', () => {
  test('>=95% green, 90-94% yellow, <90% red', () => {
    expect(coverageStatus(95, 100).tier).toBe('green')
    expect(coverageStatus(92, 100).tier).toBe('yellow')
    expect(coverageStatus(80, 100).tier).toBe('red')
  })
  test('zero cards → red', () => {
    expect(coverageStatus(0, 0).tier).toBe('red')
  })
})

describe('oldestFreshnessDays', () => {
  test('uses the OLDEST live timestamp (honest worst-case)', () => {
    const now = Date.parse('2026-05-11T00:00:00.000Z')
    const cards = [
      card({ priceTimestamp: '2026-05-10T00:00:00.000Z' }), // 1 day
      card({ priceTimestamp: '2026-05-01T00:00:00.000Z' }), // 10 days
    ]
    expect(oldestFreshnessDays(cards, now)).toBe(10)
  })
  test('null when no live card carries a timestamp', () => {
    const cards = [card({ priceStatus: 'estimated', priceTimestamp: null })]
    expect(oldestFreshnessDays(cards)).toBeNull()
  })
})

describe('computeSetAggregates', () => {
  test('excludes estimated cards from price aggregates (D-009)', () => {
    const cards = [
      card({ set: 'FB01', marketPrice: 10, delta: -20, priceStatus: 'live' }),
      card({ set: 'FB01', marketPrice: 0, delta: 0, priceStatus: 'estimated', priceTimestamp: null }),
    ]
    const [row] = computeSetAggregates(cards)
    expect(row.totalCount).toBe(2)
    expect(row.liveCount).toBe(1)
    expect(row.aggregateLiveValue).toBe(10)   // estimated card NOT summed
    expect(row.avgDelta).toBe(-20)            // estimated delta (0) NOT averaged
  })

  test('picks the highest-priced live card as topCard', () => {
    const cards = [
      card({ set: 'FB02', cardCode: 'FB02-001', marketPrice: 5 }),
      card({ set: 'FB02', cardCode: 'FB02-002', marketPrice: 50 }),
    ]
    const [row] = computeSetAggregates(cards)
    expect(row.topCard.cardCode).toBe('FB02-002')
    expect(row.topCard.marketPrice).toBe(50)
  })

  test('sorts sets by aggregate live value descending', () => {
    const cards = [
      card({ set: 'FB01', marketPrice: 1 }),
      card({ set: 'FB02', marketPrice: 100 }),
    ]
    const rows = computeSetAggregates(cards)
    expect(rows[0].set).toBe('FB02')
  })

  test('set with zero live cards yields red coverage and null topCard', () => {
    const cards = [card({ set: 'FB03', priceStatus: 'estimated', priceTimestamp: null })]
    const [row] = computeSetAggregates(cards)
    expect(row.coverage.tier).toBe('red')
    expect(row.topCard).toBeNull()
    expect(row.aggregateLiveValue).toBe(0)
  })
})

describe('computeChaseRadar', () => {
  const cards = [
    card({ cardCode: 'A', delta: -50, marketPrice: 5, priceStatus: 'live' }),
    card({ cardCode: 'B', delta: 30, marketPrice: 100, priceStatus: 'live' }),
    card({ cardCode: 'C', delta: 0, marketPrice: 1, priceStatus: 'estimated', priceTimestamp: null }),
    card({ cardCode: 'D', delta: -10, marketPrice: 20, priceStatus: 'live', set: 'FB09' }),
  ]

  test('default sort = most undervalued first; estimated excluded', () => {
    const out = computeChaseRadar(cards)
    expect(out.map(c => c.cardCode)).toEqual(['A', 'D', 'B'])  // C (estimated) excluded
  })

  test('overvalued sort flips order', () => {
    const out = computeChaseRadar(cards, { sort: 'delta-overvalued' })
    expect(out[0].cardCode).toBe('B')
  })

  test('largest-market sort', () => {
    const out = computeChaseRadar(cards, { sort: 'largest-market' })
    expect(out[0].cardCode).toBe('B')
  })

  test('set filter restricts the pool', () => {
    const out = computeChaseRadar(cards, { sets: ['FB09'] })
    expect(out.map(c => c.cardCode)).toEqual(['D'])
  })

  test('limit caps the result count', () => {
    const out = computeChaseRadar(cards, { limit: 1 })
    expect(out).toHaveLength(1)
  })
})
