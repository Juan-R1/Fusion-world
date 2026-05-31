import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import SetRankings from '../src/tabs/SetRankings.jsx'

function card(over = {}) {
  return {
    id: Math.random(),
    set: 'FB01',
    setName: 'Awakened Pulse',
    rarity: 'C',
    name: 'Test Card',
    cardCode: 'FB01-001',
    marketPrice: 1,
    delta: 0,
    priceStatus: 'live',
    priceTimestamp: '2026-05-01T00:00:00.000Z',
    ...over,
  }
}

describe('SetRankings tab', () => {
  test('renders a row per set with the set name', () => {
    const cards = [
      card({ set: 'FB01', setName: 'Awakened Pulse', marketPrice: 10 }),
      card({ set: 'FB02', setName: 'Blazing Aura', marketPrice: 20 }),
    ]
    render(<SetRankings cards={cards} />)
    expect(screen.getAllByText('FB01').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FB02').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Awakened Pulse').length).toBeGreaterThan(0)
  })

  test('renders a coverage chip reflecting live ratio', () => {
    // 1 of 1 live = 100% → "On track"
    const cards = [card({ set: 'FB03', setName: 'Raging Roar', priceStatus: 'live' })]
    render(<SetRankings cards={cards} />)
    expect(screen.getAllByText('On track').length).toBeGreaterThan(0)
  })

  test('changing the sort control does not crash and keeps rows', () => {
    const cards = [
      card({ set: 'FB01', marketPrice: 5 }),
      card({ set: 'FB02', marketPrice: 50 }),
    ]
    render(<SetRankings cards={cards} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'coverage' } })
    expect(screen.getAllByText('FB01').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FB02').length).toBeGreaterThan(0)
  })
})
