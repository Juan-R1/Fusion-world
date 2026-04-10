import { useState } from 'react'
import { T }         from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import RarityBadge   from '../components/RarityBadge.jsx'
import Sparkline     from '../components/Sparkline.jsx'

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

// ── Set health cards ──────────────────────────────────────────────────────────
function SetHealthCards({ cards }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
      {SETS.map(set => {
        const sc = cards.filter(c => c.set === set.code)
        if (!sc.length) return null

        const avgDP = sc.reduce((s, c) => s + c.demandPressure, 0) / sc.length
        const avgSS = sc.reduce((s, c) => s + c.supplySaturation, 0) / sc.length

        // 30-day demand trend: average demandHistory[day] across all cards in set
        const DAYS = sc[0].demandHistory.length
        const demandTrend = Array.from({ length: DAYS }, (_, d) =>
          sc.reduce((sum, c) => sum + c.demandHistory[d], 0) / sc.length
        )

        const trend =
          avgDP > 0.65 && avgSS < 1.0  ? 'Heating'    :
          avgDP > 0.55 && avgSS > 1.0  ? 'Overheated' :
          avgDP < 0.40 && avgSS > 1.2  ? 'Cold'       :
          avgSS > 1.1                   ? 'Cooling'    : 'Stable'

        const tCol = {
          Heating: T.orange, Overheated: T.red, Cold: T.dim, Cooling: T.blue, Stable: T.green,
        }[trend]

        return (
          <div
            key={set.code}
            style={{
              background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16,
              borderTop: `3px solid ${tCol}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: T.display }}>
              {set.code}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>{set.name}</div>

            {/* Avg Demand bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: T.dim }}>Avg Demand</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.orange }}>
                  {(avgDP * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ width: '100%', height: 5, background: T.border2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(avgDP * 100, 100)}%`, height: '100%', background: T.orange }} />
              </div>
            </div>

            {/* Supply saturation bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: T.dim }}>Supply Sat.</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: avgSS > 1 ? T.red : T.green }}>
                  {avgSS.toFixed(2)}
                </span>
              </div>
              <div style={{ width: '100%', height: 5, background: T.border2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((avgSS / 2) * 100, 100)}%`, height: '100%', background: avgSS > 1 ? T.red : T.green }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  background: `${tCol}22`, color: tCol,
                  padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                }}
              >
                {trend}
              </span>
              <Sparkline data={demandTrend} color={tCol} height={28} width={80} fill />
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
          Each dot represents a card. <strong style={{ color: T.text }}>X-axis</strong> = supply saturation
          (above 1.0 means supply is outpacing demand — loosening).{' '}
          <strong style={{ color: T.text }}>Y-axis</strong> = demand pressure (% of total supply already
          absorbed by the market). Dots are colored by rarity tier.
        </p>
        <QuadrantMap cards={cards} />

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

      {/* Set health dashboard */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: T.display, marginBottom: 14 }}>
          Set Health Dashboard
        </div>
        <SetHealthCards cards={cards} />
      </div>
    </div>
  )
}
