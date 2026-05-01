import { useState } from 'react'
import { T }         from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import RarityBadge   from '../components/RarityBadge.jsx'

// ── Quadrant scatter map ──────────────────────────────────────────────────────
function QuadrantMap({ cards }) {
  const [tooltip, setTooltip] = useState(null)

  const W  = 560, H  = 380
  const ml = 62,  mr = 20, mt = 32, mb = 50
  const pw = W - ml - mr
  const ph = H - mt - mb

  const xMin = 0.3, xMax = 2.2
  const xS   = v => ml + ((v - xMin) / (xMax - xMin)) * pw
  const yS   = v => mt + ph - (v / 1) * ph
  const midX = xS(1.0)
  const midY = yS(0.5)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={W} height={H} style={{ background: T.s2, borderRadius: 10, display: 'block' }}>

        {/* Quadrant background fills */}
        <rect x={ml}   y={mt}    width={midX - ml}       height={midY - mt}       fill={T.orange} fillOpacity={0.05} />
        <rect x={midX} y={mt}    width={ml + pw - midX}  height={midY - mt}       fill={T.red}    fillOpacity={0.05} />
        <rect x={ml}   y={midY}  width={midX - ml}       height={mt + ph - midY}  fill={T.blue}   fillOpacity={0.05} />
        <rect x={midX} y={midY}  width={ml + pw - midX}  height={mt + ph - midY}  fill={T.dim}    fillOpacity={0.04} />

        {/* Quadrant labels */}
        {[
          { x: (ml + midX) / 2,       y: mt + 17,      label: '🔥 Heating Up',  color: T.orange },
          { x: (midX + ml + pw) / 2,  y: mt + 17,      label: '⚡ Overheated',  color: T.red    },
          { x: (ml + midX) / 2,       y: mt + ph - 10, label: '💠 Stable',      color: T.blue   },
          { x: (midX + ml + pw) / 2,  y: mt + ph - 10, label: '📉 Cooling Off', color: T.dim    },
        ].map(({ x, y, label, color }) => (
          <text key={label} x={x} y={y} textAnchor="middle" fill={color}
            fontSize={11} fontFamily={T.display} fontWeight={600}>
            {label}
          </text>
        ))}

        {/* Midlines */}
        <line x1={midX} x2={midX} y1={mt}   y2={mt + ph} stroke={T.border2} strokeWidth={1.5} strokeDasharray="4,3" />
        <line x1={ml}   x2={ml + pw} y1={midY} y2={midY} stroke={T.border2} strokeWidth={1.5} strokeDasharray="4,3" />

        {/* Card dots */}
        {cards.map(c => (
          <circle
            key={c.id}
            cx={xS(c.supplySaturation)}
            cy={yS(c.demandPressure)}
            r={5}
            fill={c.rarityColor}
            fillOpacity={0.85}
            stroke={c.rarityColor}
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => setTooltip({ card: c, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* X axis */}
        <line x1={ml} x2={ml + pw} y1={mt + ph} y2={mt + ph} stroke={T.dim} strokeWidth={1} />
        {[0.5, 1.0, 1.5, 2.0].map(v => (
          <g key={v}>
            <line x1={xS(v)} x2={xS(v)} y1={mt + ph} y2={mt + ph + 4} stroke={T.dim} />
            <text x={xS(v)} y={mt + ph + 16} textAnchor="middle" fill={T.dim} fontSize={10} fontFamily={T.mono}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={ml + pw / 2} y={H - 6} textAnchor="middle" fill={T.muted} fontSize={11} fontFamily={T.display}>
          Supply Saturation (1.0 = neutral)
        </text>

        {/* Y axis */}
        <line x1={ml} x2={ml} y1={mt} y2={mt + ph} stroke={T.dim} strokeWidth={1} />
        {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
          <g key={v}>
            <line x1={ml - 4} x2={ml} y1={yS(v)} y2={yS(v)} stroke={T.dim} />
            <text x={ml - 8} y={yS(v)} textAnchor="end" dominantBaseline="middle"
              fill={T.dim} fontSize={9} fontFamily={T.mono}>
              {(v * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        <text x={14} y={mt + ph / 2} textAnchor="middle" fill={T.muted} fontSize={11} fontFamily={T.display}
          transform={`rotate(-90 14 ${mt + ph / 2})`}>
          Demand Pressure
        </text>
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 72, zIndex: 999,
            background: T.s1, border: `1px solid ${T.border2}`, borderRadius: 8,
            padding: '10px 14px', pointerEvents: 'none', minWidth: 185,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            {tooltip.card.name}
          </div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.muted }}>
            Supply Sat: {tooltip.card.supplySaturation.toFixed(2)} · Demand: {(tooltip.card.demandPressure * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.muted, marginTop: 2 }}>
            Market: ${tooltip.card.marketPrice.toFixed(2)} · {tooltip.card.setName}
          </div>
          <div style={{ marginTop: 6 }}>
            <RarityBadge rarity={tooltip.card.rarity} color={tooltip.card.rarityColor} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Set-level analytics ───────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000

const money = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct = v => `${(v * 100).toFixed(0)}%`

function median(values) {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function timestampMs(value, now) {
  const ms = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Date.parse(value)
      : NaN
  return Number.isFinite(ms) && ms > 0 && ms <= now ? ms : null
}

function ageText(days) {
  if (days == null) return 'Unknown'
  if (days < 1) return '<1d avg'
  return `${Math.round(days)}d avg`
}

function chaseMeta(score) {
  if (score >= 70) return { label: 'High concentration', color: T.red }
  if (score >= 50) return { label: 'Concentrated', color: T.orange }
  if (score >= 35) return { label: 'Moderate', color: T.yellow }
  return { label: 'Balanced', color: T.green }
}

function freshnessMeta(avgAgeDays, missingCount, liveCount) {
  if (!liveCount || missingCount === liveCount) {
    return { label: 'Unknown', color: T.dim, sub: 'No live timestamps' }
  }
  if (missingCount > 0) {
    return { label: 'Mixed', color: T.yellow, sub: `${missingCount} missing timestamp${missingCount === 1 ? '' : 's'}` }
  }
  if (avgAgeDays < 7) return { label: 'Fresh', color: T.green, sub: ageText(avgAgeDays) }
  if (avgAgeDays <= 21) return { label: 'Aging', color: T.yellow, sub: ageText(avgAgeDays) }
  return { label: 'Stale', color: T.red, sub: ageText(avgAgeDays) }
}

function barColor(value) {
  if (value >= 0.7) return T.red
  if (value >= 0.45) return T.orange
  return T.green
}

function setMetrics(cards) {
  const now = Date.now()

  return SETS.map(set => {
    const setCards = cards.filter(c => c.set === set.code)
    const liveCards = setCards.filter(c => c.hasLivePrice)
    const prices = liveCards
      .map(c => c.marketPrice)
      .filter(p => Number.isFinite(p) && p > 0)
      .sort((a, b) => b - a)

    const totalValue = prices.reduce((s, p) => s + p, 0)
    const top1Value = prices[0] || 0
    const top3Value = prices.slice(0, 3).reduce((s, p) => s + p, 0)
    const top10Value = prices.slice(0, 10).reduce((s, p) => s + p, 0)
    const top1Share = totalValue > 0 ? top1Value / totalValue : 0
    const top3Share = totalValue > 0 ? top3Value / totalValue : 0
    const top10Share = totalValue > 0 ? top10Value / totalValue : 0
    const chaseScore = Math.min(100, (top1Share * 50) + (top3Share * 30) + (top10Share * 20))

    const validTimestamps = liveCards
      .map(c => timestampMs(c.priceTimestamp, now))
      .filter(Boolean)
    const ageDays = validTimestamps.map(ts => (now - ts) / DAY_MS)
    const avgAgeDays = ageDays.length ? ageDays.reduce((s, d) => s + d, 0) / ageDays.length : null
    const stale7Share = liveCards.length ? ageDays.filter(d => d > 7).length / liveCards.length : 0
    const stale21Share = liveCards.length ? ageDays.filter(d => d > 21).length / liveCards.length : 0
    const missingTimestamps = liveCards.length - validTimestamps.length

    const avgDemand = setCards.length
      ? setCards.reduce((s, c) => s + c.demandPressure, 0) / setCards.length
      : 0
    const avgSupply = setCards.length
      ? setCards.reduce((s, c) => s + c.supplySaturation, 0) / setCards.length
      : 0

    return {
      ...set,
      totalCards: setCards.length,
      liveCards: liveCards.length,
      coverage: setCards.length ? liveCards.length / setCards.length : 0,
      totalValue,
      medianPrice: median(prices),
      top1Share,
      top3Share,
      top10Share,
      chaseScore,
      avgAgeDays,
      stale7Share,
      stale21Share,
      missingTimestamps,
      avgDemand,
      avgSupply,
    }
  })
}

function Metric({ label, value, sub, color = T.text }) {
  return (
    <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px', minWidth: 0 }}>
      <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, color, fontFamily: T.mono, fontWeight: 800 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function ShareBar({ label, value }) {
  const color = barColor(value)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 10 }}>
        <span style={{ fontSize: 11, color: T.dim }}>{label}</span>
        <span style={{ fontSize: 11, color, fontFamily: T.mono, fontWeight: 700 }}>{pct(value)}</span>
      </div>
      <div style={{ height: 6, background: T.border2, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value * 100, 100)}%`, height: '100%', background: color }} />
      </div>
    </div>
  )
}

function SetLevelAnalytics({ cards }) {
  const metrics = setMetrics(cards)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
      {metrics.map(set => {
        const chase = chaseMeta(set.chaseScore)
        const fresh = freshnessMeta(set.avgAgeDays, set.missingTimestamps, set.liveCards)

        return (
          <div
            key={set.code}
            style={{
              background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16,
              borderTop: `3px solid ${chase.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: T.display }}>
                  {set.code}
                </div>
                <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{set.name}</div>
              </div>
              <span
                title="Average live price age for this set"
                style={{
                  alignSelf: 'flex-start', background: `${fresh.color}22`, border: `1px solid ${fresh.color}66`,
                  color: fresh.color, borderRadius: 6, padding: '3px 8px', fontSize: 10,
                  fontWeight: 800, fontFamily: T.mono, whiteSpace: 'nowrap',
                }}
              >
                {fresh.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
              <Metric label="Live coverage" value={pct(set.coverage)} sub={`${set.liveCards}/${set.totalCards} cards`} color={set.coverage >= 0.9 ? T.green : set.coverage >= 0.75 ? T.yellow : T.red} />
              <Metric label="Live value" value={money(set.totalValue)} sub="excludes EST" color={T.orange} />
              <Metric label="Median live" value={money(set.medianPrice)} />
              <Metric label="Chase dependency" value={set.chaseScore.toFixed(0)} sub={chase.label} color={chase.color} />
            </div>

            <div style={{ display: 'grid', gap: 9, marginBottom: 12 }}>
              <ShareBar label="Top 1 concentration" value={set.top1Share} />
              <ShareBar label="Top 3 concentration" value={set.top3Share} />
              <ShareBar label="Top 10 concentration" value={set.top10Share} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
              <Metric label="Freshness" value={fresh.label} sub={fresh.sub} color={fresh.color} />
              <Metric label=">7d stale" value={pct(set.stale7Share)} color={set.stale7Share > 0 ? T.yellow : T.green} />
              <Metric label=">21d stale" value={pct(set.stale21Share)} color={set.stale21Share > 0 ? T.red : T.green} />
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model demand</div>
                <div style={{ fontSize: 12, color: T.orange, fontFamily: T.mono, fontWeight: 700 }}>{(set.avgDemand * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model supply sat.</div>
                <div style={{ fontSize: 12, color: set.avgSupply > 1 ? T.red : T.green, fontFamily: T.mono, fontWeight: 700 }}>{set.avgSupply.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Market Dynamics Tab ───────────────────────────────────────────────────────
export default function MarketDynamics({ cards }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Quadrant map section */}
      <div>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.75 }}>
          Each dot represents a card. <strong style={{ color: T.text }}>X-axis</strong> = model supply
          saturation (above 1.0 suggests looser supply in the heuristic).{' '}
          <strong style={{ color: T.text }}>Y-axis</strong> = model demand pressure. These are model
          heuristics, not observed supply or demand time series. Dots are colored by rarity tier.
        </p>
        <div style={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          <QuadrantMap cards={cards} />
        </div>

        {/* Rarity legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
          {RARITIES.map(r => (
            <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.color }} />
              <span style={{ fontSize: 11, color: T.muted }}>{r.code} — {r.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Set-level analytics */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: T.display, marginBottom: 14 }}>
          Set-Level Analytics
        </div>
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, margin: '0 0 14px' }}>
          Live value excludes estimated cards. Demand and supply saturation are model heuristics, not observed
          time series. Chase Dependency measures value concentration risk from the top 1, 3, and 10 live-priced
          cards; it is not expected profit or an investment rating.
        </p>
        <SetLevelAnalytics cards={cards} />
      </div>
    </div>
  )
}
