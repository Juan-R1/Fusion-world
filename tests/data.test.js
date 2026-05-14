import { describe, expect, test } from 'vitest'
import { CARDS, HAS_LIVE_PRICES } from '../src/data.js'

describe('data model smoke checks', () => {
  test('ships the expected live dataset without non-finite prices', () => {
    expect(CARDS).toHaveLength(1258)
    expect(HAS_LIVE_PRICES).toBe(true)

    for (const card of CARDS) {
      expect(Number.isFinite(card.predictedPrice)).toBe(true)
      expect(Number.isFinite(card.marketPrice)).toBe(true)
    }
  })
})
