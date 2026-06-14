import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import App from '../src/App.jsx'

// The tab modules are code-split via React.lazy in App.jsx. The shell
// (header + tab nav + footer) must render synchronously without the
// active tab's module having resolved yet — proving tabs are lazy, not
// eager. We assert the shell chrome is present immediately after mount;
// the lazy tab resolves asynchronously behind the Suspense fallback.

describe('App shell (code-split)', () => {
  test('renders header + tab nav synchronously without eager tab load', () => {
    render(<App />)

    // Brand + live badge are part of the always-eager shell.
    expect(screen.getByText('Fusion')).toBeTruthy()
    expect(screen.getByText('Metrics')).toBeTruthy()
    expect(screen.getByText('● LIVE')).toBeTruthy()

    // All seven tab buttons render in the nav (shell, not tab modules).
    for (const label of ['🔍 Value Scanner', '📈 Pricing Model', '📦 Box EV', '🏆 Set Rankings', '🎯 Chase Radar', '⭐ Watchlist', '📘 Methodology']) {
      expect(screen.getByRole('button', { name: new RegExp(label.split(' ').slice(1).join(' '), 'i') })).toBeTruthy()
    }
  })

  test('shows the Suspense fallback before the lazy tab resolves', () => {
    render(<App />)
    // Immediately after mount the active tab (ValueScanner) is still
    // loading its chunk, so the fallback text is on screen.
    expect(screen.getByText('Loading…')).toBeTruthy()
  })
})
