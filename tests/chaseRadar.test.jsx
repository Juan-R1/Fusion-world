import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

// SETS/RARITIES come from data.js; the tab only reads .code off them.
vi.mock('../src/data.js', () => ({
  SETS: [{ code: 'FB01' }, { code: 'FB09' }],
  RARITIES: [{ code: 'SCR' }, { code: 'C' }],
}))

import ChaseRadar from '../src/tabs/ChaseRadar.jsx'

function card(over = {}) {
  return {
    id: Math.random(),
    set: 'FB01',
    setName: 'Awakened Pulse',
    rarity: 'SCR',
    rarityColor: '#f59e0b',
    name: 'Test Card',
    cardCode: 'FB01-001',
    marketPrice: 5,
    predictedPrice: 10,
    delta: -50,
    priceStatus: 'live',
    priceTimestamp: '2026-05-01T00:00:00.000Z',
    ...over,
  }
}

describe('ChaseRadar tab', () => {
  test('renders live-priced cards and excludes estimated', () => {
    const cards = [
      card({ cardCode: 'FB01-001', name: 'Live One', priceStatus: 'live' }),
      card({ cardCode: 'FB01-002', name: 'Estimated One', priceStatus: 'estimated', delta: 0, priceTimestamp: null }),
    ]
    render(<ChaseRadar cards={cards} />)
    expect(screen.getByText('Live One')).toBeTruthy()
    expect(screen.queryByText('Estimated One')).toBeNull()
  })

  test('set filter restricts the rows', () => {
    const cards = [
      card({ cardCode: 'FB01-001', name: 'In FB01', set: 'FB01' }),
      card({ cardCode: 'FB09-001', name: 'In FB09', set: 'FB09' }),
    ]
    render(<ChaseRadar cards={cards} />)
    const selects = screen.getAllByRole('combobox')
    // selects: [sort, set, rarity]
    fireEvent.change(selects[1], { target: { value: 'FB09' } })
    expect(screen.getByText('In FB09')).toBeTruthy()
    expect(screen.queryByText('In FB01')).toBeNull()
  })

  test('empty state when no live cards match', () => {
    const cards = [card({ priceStatus: 'estimated', delta: 0, priceTimestamp: null })]
    render(<ChaseRadar cards={cards} />)
    expect(screen.getByText(/No live-priced cards match/i)).toBeTruthy()
  })
})
