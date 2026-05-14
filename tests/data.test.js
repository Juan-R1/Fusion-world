import { describe, expect, test, vi } from 'vitest'
import { CARDS, HAS_LIVE_PRICES, historyStateOf, normalizeHistory } from '../src/data.js'

describe('data model smoke checks', () => {
  test('ships the expected live dataset without non-finite prices', () => {
    expect(CARDS).toHaveLength(1258)
    expect(HAS_LIVE_PRICES).toBe(true)

    for (const card of CARDS) {
      expect(Number.isFinite(card.predictedPrice)).toBe(true)
      expect(Number.isFinite(card.marketPrice)).toBe(true)
    }
  })

  test('classifies history point counts into real, limited, and none', () => {
    expect(historyStateOf(7)).toBe('real')
    expect(historyStateOf(6)).toBe('limited')
    expect(historyStateOf(1)).toBe('limited')
    expect(historyStateOf(0)).toBe('none')
  })

  test('normalizes history points oldest to newest and drops malformed rows', () => {
    expect(normalizeHistory([
      { p: 1, t: 200 },
      { p: 'a', t: 1 },
      { p: 2, t: 100 },
      { p: -1, t: 1 },
      { p: 1, t: 'bad' },
    ])).toEqual([
      { price: 2, ts: 100 },
      { price: 1, ts: 200 },
    ])
  })

  test('estimated cards use the model price without delta noise', () => {
    const estimated = CARDS.find(card => card.priceStatus === 'estimated')

    expect(estimated).toBeTruthy()
    expect(estimated.marketPrice).toBe(estimated.predictedPrice)
    expect(estimated.delta).toBe(0)
    expect(estimated.priceTimestamp).toBeNull()
  })

  test('lazy price-history loader single-flights concurrent calls', async () => {
    vi.resetModules()
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ 'FB01-001': [{ p: 1, t: 1 }] }),
    }))

    const { loadPriceHistory30d } = await import('../src/data.js')
    const [a, b] = await Promise.all([loadPriceHistory30d(), loadPriceHistory30d()])

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
    expect(a).toEqual({ 'FB01-001': [{ p: 1, t: 1 }] })
  })
})
