import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import SetRankings from '../src/tabs/SetRankings.jsx'

// ChaseRadar reads SETS/RARITIES off data.js; mock to the codes only.
vi.mock('../src/data.js', () => ({
  SETS: [{ code: 'FB01' }],
  RARITIES: [{ code: 'SCR' }],
}))
import ChaseRadar from '../src/tabs/ChaseRadar.jsx'

function setViewport(width) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
}

function card(over = {}) {
  return {
    id: Math.random(),
    set: 'FB01', setName: 'Awakened Pulse', rarity: 'SCR', rarityColor: '#f59e0b',
    name: 'Test Card', cardCode: 'FB01-001',
    marketPrice: 5, predictedPrice: 10, delta: -50,
    priceStatus: 'live', priceTimestamp: '2026-05-01T00:00:00.000Z',
    ...over,
  }
}

afterEach(() => {
  cleanup()
  setViewport(1024) // restore jsdom default
})

describe('mobile layout (≤375px)', () => {
  test('SetRankings renders the stacked card variant (no table) on mobile', () => {
    setViewport(375)
    render(<SetRankings cards={[card()]} />)
    expect(screen.queryByRole('table')).toBeNull()
    // The set code still shows in the stacked card.
    expect(screen.getAllByText('FB01').length).toBeGreaterThan(0)
  })

  test('SetRankings renders the full table on desktop', () => {
    setViewport(1280)
    render(<SetRankings cards={[card()]} />)
    expect(screen.getByRole('table')).toBeTruthy()
  })

  test('ChaseRadar omits the FRESH column on mobile', () => {
    setViewport(375)
    render(<ChaseRadar cards={[card()]} />)
    expect(screen.queryByText('FRESH')).toBeNull()
  })

  test('ChaseRadar shows the FRESH column on desktop', () => {
    setViewport(1280)
    render(<ChaseRadar cards={[card()]} />)
    expect(screen.getByText('FRESH')).toBeTruthy()
  })

  test('ChaseRadar still renders the card on mobile (table present, fewer columns)', () => {
    setViewport(375)
    render(<ChaseRadar cards={[card({ name: 'Mobile Card' })]} />)
    expect(screen.getByText('Mobile Card')).toBeTruthy()
  })
})
