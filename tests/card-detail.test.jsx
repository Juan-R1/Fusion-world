import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import CardDetail from '../src/components/CardDetail.jsx'

const mocks = vi.hoisted(() => ({
  loadPriceHistory30d: vi.fn(),
  loadPremiumMetadata: vi.fn(),
}))

vi.mock('../src/data.js', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadPriceHistory30d: mocks.loadPriceHistory30d,
  }
})

vi.mock('../src/lib/premiumMetadata.js', () => ({
  loadPremiumMetadata: mocks.loadPremiumMetadata,
}))

vi.mock('../src/components/CompsPanel.jsx', () => ({
  default: () => <div data-testid="comps-panel" />,
}))

const card = {
  name: 'Test Goku',
  cardCode: 'FB01-001',
  setName: 'Awakened Pulse',
  rarity: 'SR',
  rarityColor: '#f59e0b',
  cardColor: 'Red',
  cardType: 'BATTLE',
  trait: 'Saiyan',
  icon: '🔥',
  image: null,
  verified: true,
  marketPrice: 1.25,
  predictedPrice: 1.5,
  delta: -16.7,
  hasLivePrice: true,
  priceTimestamp: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  charPremium: 7,
  universalAppeal: 5,
  characterPopularityHeuristic: 5,
  pullCost: 5,
}

beforeEach(() => {
  mocks.loadPremiumMetadata.mockResolvedValue({ items: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('CardDetail history and freshness states', () => {
  test('shows a loading state while 30d history is pending', () => {
    mocks.loadPriceHistory30d.mockReturnValue(new Promise(() => {}))

    render(<CardDetail card={card} onClose={() => {}} />)

    expect(screen.getByText('Loading 30d history…')).toBeTruthy()
  })

  test('renders none state distinct from unavailable when history loads empty', async () => {
    mocks.loadPriceHistory30d.mockResolvedValue({ [card.cardCode]: [] })

    render(<CardDetail card={card} onClose={() => {}} />)

    expect(await screen.findByText('Not enough JustTCG history')).toBeTruthy()
    expect(screen.queryByText('Price history unavailable')).toBeNull()
  })

  test('renders unavailable state when history fetch rejects', async () => {
    mocks.loadPriceHistory30d.mockRejectedValue(new Error('offline'))

    render(<CardDetail card={card} onClose={() => {}} />)

    expect(await screen.findByText('Price history unavailable')).toBeTruthy()
    expect(screen.queryByText('Not enough JustTCG history')).toBeNull()
  })

  test('uses aging freshness copy and color for a ten-day-old live timestamp', async () => {
    mocks.loadPriceHistory30d.mockResolvedValue({ [card.cardCode]: [] })

    render(<CardDetail card={card} onClose={() => {}} />)

    const freshness = await screen.findByText(/Source: JustTCG · refreshed 10 days ago/)
    await waitFor(() => expect(freshness.style.color).toBe('rgb(234, 179, 8)'))
  })

  test('shows stored character popularity disclosure instead of synthetic gauges', async () => {
    mocks.loadPriceHistory30d.mockResolvedValue({ [card.cardCode]: [] })

    render(<CardDetail card={card} onClose={() => {}} />)

    expect(await screen.findByText('Character popularity heuristic')).toBeTruthy()
    expect(screen.getByText(/Stored value; last refreshed when card database was last refreshed/)).toBeTruthy()
    expect(screen.queryByText('Desirability Breakdown')).toBeNull()
    expect(screen.queryByText('Demand')).toBeNull()
    expect(screen.queryByText('Sup. Sat.')).toBeNull()
  })
})
