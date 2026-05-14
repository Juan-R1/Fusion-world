import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

async function renderFooter() {
  const { default: ProvenanceFooter } = await import('../src/components/ProvenanceFooter.jsx')
  return render(<ProvenanceFooter />)
}

describe('ProvenanceFooter behavior', () => {
  test('renders an unavailable pill when refresh metadata cannot load', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline')
    })

    await renderFooter()

    expect(await screen.findByText('Refresh metadata unavailable')).toBeTruthy()
  })

  test('opens refresh-history modal and caps rows at twelve', async () => {
    const history = Array.from({ length: 13 }, (_, i) => ({
      runAt: `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      mode: 'rotation',
      group: `G${i}`,
      sets: [`FB${String(i).padStart(2, '0')}`],
      fetched: i,
      merged: 1156,
    }))
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        lastRunAt: '2026-05-12T00:00:00.000Z',
        lastMergedCount: 1156,
        lastGroup: 'manual',
        history,
      }),
    }))

    await renderFooter()
    fireEvent.click(await screen.findByLabelText('Show refresh history'))

    expect(await screen.findByText('Refresh history')).toBeTruthy()
    expect(screen.getByText('G11')).toBeTruthy()
    expect(screen.queryByText('G12')).toBeNull()
  })
})
