import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import PricingModel from '../src/tabs/PricingModel.jsx'

const cards = [
  {
    id: 1,
    name: 'Card One',
    marketPrice: 1,
    predictedPrice: 1.1,
    delta: -9,
    pullCost: 4,
    characterPopularityHeuristic: 2,
  },
  {
    id: 2,
    name: 'Card Two',
    marketPrice: 4,
    predictedPrice: 3.8,
    delta: 5,
    pullCost: 7,
    characterPopularityHeuristic: 8,
  },
]

describe('PricingModel trust copy', () => {
  test('labels the X axis as stored character popularity', () => {
    render(<PricingModel cards={cards} />)

    expect(screen.getByText('Character popularity heuristic')).toBeTruthy()
    expect(screen.getByText('X axis: stored character popularity heuristic; not a live signal.')).toBeTruthy()
  })
})
