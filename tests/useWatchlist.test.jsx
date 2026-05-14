import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useWatchlist } from '../src/hooks/useWatchlist.js'

const cards = [
  { cardCode: 'FB01-001', marketPrice: 0.42 },
  { cardCode: 'FB02-002', marketPrice: 1.23 },
]

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useWatchlist smoke checks', () => {
  test('migrates v1 string-array storage into v2 portfolio items', () => {
    localStorage.setItem('fw-watchlist-v1', JSON.stringify(['FB01-001', 'FB02-002']))

    const { result } = renderHook(() => useWatchlist(cards))

    expect([...result.current.watchedCodes].sort()).toEqual(['FB01-001', 'FB02-002'])
    expect(result.current.watchlistItems['FB01-001']).toMatchObject({
      cardCode: 'FB01-001',
      quantity: 1,
      entryPrice: 0.42,
    })
    expect(result.current.watchlistItems['FB02-002']).toMatchObject({
      cardCode: 'FB02-002',
      quantity: 1,
      entryPrice: 1.23,
    })

    const migrated = JSON.parse(localStorage.getItem('fw-watchlist-v2'))
    expect(migrated.version).toBe(2)
    expect(Object.keys(migrated.items).sort()).toEqual(['FB01-001', 'FB02-002'])
  })

  test('continues to work when localStorage reads and writes throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { result } = renderHook(() => useWatchlist(cards))

    expect(result.current.watchedCodes.size).toBe(0)

    act(() => {
      result.current.toggle('FB01-001')
    })

    expect(result.current.watchedCodes.has('FB01-001')).toBe(true)
    expect(result.current.watchlistItems['FB01-001'].entryPrice).toBe(0.42)
  })
})
