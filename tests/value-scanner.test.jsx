import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import ValueScanner from '../src/tabs/ValueScanner.jsx'

vi.mock('../src/lib/premiumMetadata.js', () => ({
  loadPremiumMetadata: vi.fn(async () => ({ items: {} })),
}))

const cards = [
  {
    id: 1,
    name: 'Live Deal',
    character: 'Goku',
    cardCode: 'FB01-001',
    set: 'FB01',
    setName: 'Awakened Pulse',
    rarity: 'SR',
    rarityColor: '#f59e0b',
    icon: '🔥',
    marketPrice: 1,
    predictedPrice: 2,
    delta: -50,
    demandPressure: 0.5,
    supplySaturation: 0.8,
    priceStatus: 'live',
  },
  {
    id: 2,
    name: 'Estimated Mirage',
    character: 'Vegeta',
    cardCode: 'FB02-002',
    set: 'FB02',
    setName: 'Blazing Aura',
    rarity: 'R',
    rarityColor: '#a855f7',
    icon: '⚡',
    marketPrice: 99,
    predictedPrice: 99,
    delta: 0,
    demandPressure: 0.9,
    supplySaturation: 1.2,
    priceStatus: 'estimated',
  },
]

describe('ValueScanner ranking trust rules', () => {
  test('undervalued ranking excludes estimated cards', () => {
    render(<ValueScanner cards={cards} />)

    expect(screen.getByText('Live Deal')).toBeTruthy()
    expect(screen.queryByText('Estimated Mirage')).toBeNull()
  })

  test('non-ranking price sort includes live and estimated cards', async () => {
    render(<ValueScanner cards={cards} />)

    fireEvent.change(screen.getByDisplayValue('Most Undervalued'), {
      target: { value: 'price' },
    })

    await waitFor(() => {
      expect(screen.getByText('Live Deal')).toBeTruthy()
      expect(screen.getByText('Estimated Mirage')).toBeTruthy()
    })
  })
})
