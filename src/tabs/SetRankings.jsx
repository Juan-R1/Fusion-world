// src/tabs/SetRankings.jsx
// Per-set analytics: which set is most active / valuable / fresh right now.
// Every column is derived from live-priced cards only (D-009). No
// demand/supply heuristics (eBay-gated). Spec: docs/set-rankings-spec.md.

import { useMemo, useState } from 'react'
import { T } from '../theme.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { computeSetAggregates } from '../lib/setAggregates.js'

const COVERAGE_COLOR = {
  green:  T.green,
  yellow: T.yellow,
  red:    T.red,
}

function deltaColor(d) {
  if (d <= -15) return T.green
  if (d >= 15) return T.red
  return T.yellow
}

function Chip({ label, color }) {
  return (
    <span style={{
      color, background: `${color}1a`, border: `1px solid ${color}55`,
      borderRadius: 999, padding: '2px 8px', fontSize: 11,
      fontFamily: T.mono, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

const SORTS = [
  { value: 'value',     label: 'Live Value' },
  { value: 'median',    label: 'Median Price' },
  { value: 'coverage',  label: 'Coverage' },
  { value: 'freshness', label: 'Freshness' },
  { value: 'delta',     label: 'Avg Delta' },
]

export default function SetRankings({ cards }) {
  const isMobile = useIsMobile()
  const [sort, setSort] = useState('value')

  const rows = useMemo(() => {
    const base = computeSetAggregates(cards)
    const sorted = [...base]
    switch (sort) {
      case 'value':     sorted.sort((a, b) => b.aggregateLiveValue - a.aggregateLiveValue); break
      case 'median':    sorted.sort((a, b) => b.medianLivePrice - a.medianLivePrice); break
      case 'coverage':  sorted.sort((a, b) => b.coverageRatio - a.coverageRatio); break
      case 'freshness': sorted.sort((a, b) => (a.freshnessDays ?? 1e9) - (b.freshnessDays ?? 1e9)); break
      case 'delta':     sorted.sort((a, b) => a.avgDelta - b.avgDelta); break
      default: break
    }
    return sorted
  }, [cards, sort])

  const INP = {
    background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.text, padding: '8px 11px', fontSize: 14, outline: 'none',
    fontFamily: T.display, cursor: 'pointer',
  }

  return (
    <div>
      <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 16px' }}>
        Per-set analytics across FB01–FB09. Every figure below is computed from{' '}
        <strong style={{ color: T.text }}>live-priced cards only</strong> — estimated
        cards are excluded so the numbers reflect observed market data, not model
        guesses. Coverage = live-priced ÷ total cards in the set. These are
        observations, not buy/sell signals.
      </p>

      <div style={{ marginBottom: 14 }}>
        <select style={{ ...INP, flex: isMobile ? '1 1 auto' : '0 0 auto' }} value={sort} onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => (
            <div key={r.set} style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.orange }}>{r.set}</span>
                  <span style={{ color: T.dim, fontSize: 12, marginLeft: 8 }}>{r.setName}</span>
                </div>
                <Chip label={r.coverage.label} color={COVERAGE_COLOR[r.coverage.tier]} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.muted }}>
                <span>Live value <strong style={{ color: T.text }}>${r.aggregateLiveValue.toLocaleString()}</strong></span>
                <span>Avg Δ <strong style={{ color: deltaColor(r.avgDelta) }}>{r.avgDelta > 0 ? '+' : ''}{r.avgDelta}%</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.dim, marginTop: 6 }}>
                <span>{r.liveCount}/{r.totalCount} priced</span>
                <span>{r.freshnessDays == null ? 'no data' : `${r.freshnessDays}d ago`}</span>
              </div>
              {r.topCard && (
                <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>
                  Top: <strong style={{ color: T.text }}>{r.topCard.name}</strong> · {r.topCard.rarity} · ${r.topCard.marketPrice}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.s1, color: T.dim, textAlign: 'left', fontSize: 11, fontFamily: T.mono }}>
                <th style={{ padding: '12px 14px' }}>SET</th>
                <th style={{ padding: '12px 14px' }}>PRICED</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>LIVE VALUE</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>MEDIAN</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>AVG Δ</th>
                <th style={{ padding: '12px 14px' }}>COVERAGE</th>
                <th style={{ padding: '12px 14px' }}>FRESH</th>
                <th style={{ padding: '12px 14px' }}>TOP CARD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.set} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.orange }}>{r.set}</span>
                    <div style={{ color: T.dim, fontSize: 11 }}>{r.setName}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: T.mono, color: T.muted }}>{r.liveCount}/{r.totalCount}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: T.mono, color: T.text }}>${r.aggregateLiveValue.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: T.mono, color: T.muted }}>${r.medianLivePrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: T.mono, color: deltaColor(r.avgDelta) }}>{r.avgDelta > 0 ? '+' : ''}{r.avgDelta}%</td>
                  <td style={{ padding: '12px 14px' }}><Chip label={r.coverage.label} color={COVERAGE_COLOR[r.coverage.tier]} /></td>
                  <td style={{ padding: '12px 14px', fontFamily: T.mono, color: T.dim, fontSize: 12 }}>{r.freshnessDays == null ? '—' : `${r.freshnessDays}d`}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: T.muted }}>
                    {r.topCard ? <><strong style={{ color: T.text }}>{r.topCard.name}</strong> · {r.topCard.rarity} · ${r.topCard.marketPrice}</> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: T.dim, fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
        Freshness shows the age of the <em>oldest</em> live price in each set, so a
        single stale card lowers the figure rather than the most recent one. Estimated
        cards are not included in any aggregate above.
      </p>
    </div>
  )
}
