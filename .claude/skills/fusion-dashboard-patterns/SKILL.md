---
name: fusion-dashboard-patterns
description: Canonical React/Vite patterns for FusionMetrics tabs, components, and hooks — split panel, CardDetail overlay, sticky-header table, theme tokens, localStorage persistence, mobile responsiveness. Use when implementing any UI feature.
version: 1.0.0
category: Feature Implementation
triggers:
  - new tab
  - new component
  - CardDetail
  - useIsMobile
  - watchlist-style
  - split panel
---

# FusionMetrics Dashboard Patterns

## Theme tokens (src/theme.js)
`T.bg` `T.text` `T.muted` `T.dim` `T.border` `T.s1` `T.s2` `T.s3` `T.orange` `T.green` `T.red` `T.yellow` `T.cyan` `T.purple` `T.mono` `T.display`.
Never hardcode colors except in one-off accents (`rgba(234,179,8,0.2)` for yellow-chip backgrounds etc.).

## Standard tab skeleton
```jsx
import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import CardDetail from '../components/CardDetail.jsx'

export default function MyTab({ cards, watchedCodes, onToggleWatch }) {
  const [selected, setSelected] = useState(null)
  const isMobile = useIsMobile()
  const selCard = selected != null ? cards.find(c => c.id === selected) : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 16,
      height: isMobile ? 'auto' : 'calc(100vh - 136px)',
    }}>
      {/* left: table/summary */}
      {/* right: CardDetail — fullscreen overlay on mobile */}
    </div>
  )
}
```

## CardDetail overlay pattern
- Desktop: `flex: '0 0 42%'` side panel
- Mobile: `position: fixed, inset: 0, zIndex: 200, background: T.bg`
- Always passes `watched` + `onToggleWatch` props

## Sticky-header table
```jsx
<div style={{ overflow: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
  <div style={{ minWidth: isMobile ? 640 : 'auto' }}>
    <div style={{ position: 'sticky', top: 0, background: T.bg, zIndex: 1, ... }}>
      {/* header row */}
    </div>
    {rows.map(...)}
  </div>
</div>
```
On mobile, always set `minWidth` on the inner container so columns don't collapse — horizontal scroll is correct UX.

## Summary card grid
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${n}, 1fr)`,
  gap: 10, marginBottom: 14,
}}>
```

## localStorage hook template
```js
const KEY = 'fw-<feature>-v1'
function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) }
  catch { return new Set() }
}
function save(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])) } catch {}
}
```

## Filter row
- `<input style={{ ...INP, flex: isMobile ? '1 1 100%' : '1 1 150px' }}>`
- `<select flex: isMobile ? '1 1 48%' : '0 0 auto'>`

## Never do
- Inline event handlers that recreate functions passed to memoized children (wrap in `useCallback`)
- Hardcoded card arrays or rarities — always source from `src/data.js`
- Omit `key` on mapped rows (use `card.id`, not array index)
- Use `100vh` on mobile without `minHeight` fallback — iOS Safari URL bar kills it
