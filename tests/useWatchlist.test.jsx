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

  test('coerces editable quantity and entry price fields', () => {
    const { result } = renderHook(() => useWatchlist(cards))

    act(() => {
      result.current.updateItem('FB01-001', { quantity: '2.7', entryPrice: '1.239' })
    })
    expect(result.current.watchlistItems['FB01-001'].quantity).toBe(2)
    expect(result.current.watchlistItems['FB01-001'].entryPrice).toBe(1.24)

    act(() => {
      result.current.updateItem('FB01-001', { quantity: -3, entryPrice: -2 })
    })
    expect(result.current.watchlistItems['FB01-001'].quantity).toBe(1)
    expect(result.current.watchlistItems['FB01-001'].entryPrice).toBe(0)
  })

  test('partial updates preserve entry price and added timestamp', () => {
    const { result } = renderHook(() => useWatchlist(cards))

    act(() => {
      result.current.toggle('FB01-001')
    })
    const before = result.current.watchlistItems['FB01-001']

    act(() => {
      result.current.updateItem('FB01-001', { quantity: 5 })
    })

    expect(result.current.watchlistItems['FB01-001']).toMatchObject({
      quantity: 5,
      entryPrice: before.entryPrice,
      addedAt: before.addedAt,
    })
  })

  test('clear removes both v1 and v2 storage keys', () => {
    localStorage.setItem('fw-watchlist-v1', JSON.stringify(['FB01-001']))
    localStorage.setItem('fw-watchlist-v2', JSON.stringify({
      version: 2,
      items: { 'FB01-001': { cardCode: 'FB01-001', quantity: 1, entryPrice: 0.42, addedAt: new Date().toISOString() } },
    }))

    const { result } = renderHook(() => useWatchlist(cards))

    act(() => {
      result.current.clear()
    })

    expect(result.current.watchedCodes.size).toBe(0)
    expect(localStorage.getItem('fw-watchlist-v1')).toBeNull()
    expect(localStorage.getItem('fw-watchlist-v2')).toBeNull()
  })
})
