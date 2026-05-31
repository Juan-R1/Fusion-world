// src/tabs/ChaseRadar.jsx
// Top cards by the most pronounced observed market signal right now.
// Live-priced cards only (estimated have delta 0, no real signal — D-009).
// No demand/supply columns (eBay-gated). Spec: docs/set-rankings-spec.md § 4.

import { useMemo, useState } from 'react'
import { T } from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { computeChaseRadar } from '../lib/setAggregates.js'
import RarityBadge from '../components/RarityBadge.jsx'
import DeltaBadge  from '../components/DeltaBadge.jsx'

const SORTS = [
  { value: 'delta-undervalued',  label: 'Most below model' },
  { value: 'delta-overvalued',   label: 'Most above model' },
  { value: 'recently-refreshed', label: 'Recently refreshed' },
  { value: 'largest-market',     label: 'Highest price' },
]

export default function ChaseRadar({ cards }) {
  const isMobile = useIsMobile()
  const [sort, setSort] = useState('delta-undervalued')
  const [setFilter, setSetFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')

  const rows = useMemo(() => computeChaseRadar(cards, {
    sort,
    limit: 20,
    sets: setFilter ? [setFilter] : null,
    rarities: rarityFilter ? [rarityFilter] : null,
  }), [cards, sort, setFilter, rarityFilter])

  const INP = {
    background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.text, padding: '8px 11px', fontSize: 14, outline: 'none',
    fontFamily: T.display, cursor: 'pointer',
  }

  return (
    <div>
      <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 16px' }}>
        The 20 cards showing the most pronounced gap between live market price and
        the model's expectation, right now. <strong style={{ color: T.text }}>
        Live-priced cards only</strong> — estimated cards have no real market
        signal and are excluded. A large gap is an <em>observation</em> that the
        market and the model disagree; it is not a buy or sell recommendation.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <select style={INP} value={sort} onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
        <select style={INP} value={setFilter} onChange={e => setSetFilter(e.target.value)}>
          <option value="">All sets</option>
          {SETS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
        </select>
        <select style={INP} value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
          <option value="">All rarities</option>
          {RARITIES.map(r => <option key={r.code} value={r.code}>{r.code}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: T.dim, fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
          No live-priced cards match these filters.
        </p>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.s1, color: T.dim, textAlign: 'left', fontSize: 11, fontFamily: T.mono }}>
                <th style={{ padding: '12px 14px' }}>#</th>
                <th style={{ padding: '12px 14px' }}>CARD</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>MARKET</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>MODEL</th>
                <th style={{ padding: '12px 14px' }}>DELTA</th>
                {!isMobile && <th style={{ padding: '12px 14px' }}>FRESH</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.cardCode} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '12px 14px', fontFamily: T.mono, color: T.dim }}>#{i + 1}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: T.text }}>{c.name}</strong>
                      <RarityBadge rarity={c.rarity} color={c.rarityColor} />
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>{c.cardCode}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: T.mono, color: T.text }}>${c.marketPrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: T.mono, color: T.muted }}>${c.predictedPrice}</td>
                  <td style={{ padding: '12px 14px' }}><DeltaBadge delta={c.delta} /></td>
                  {!isMobile && (
                    <td style={{ padding: '12px 14px', fontFamily: T.mono, color: T.dim, fontSize: 12 }}>
                      {freshLabel(c.priceTimestamp)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: T.dim, fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
        "Delta" is (market − model) ÷ model. Green = market is below the model's
        expectation; red = above. The model (R² ≈ 0.32) carries meaningful per-card
        error — see the Methodology tab. This is a research surface, not advice.
      </p>
    </div>
  )
}

function freshLabel(ts) {
  if (!ts) return '—'
  const days = Math.floor((Date.now() - Date.parse(ts)) / 86_400_000)
  if (!Number.isFinite(days)) return '—'
  return `${days}d`
}
