import { useState } from 'react'
import { T }        from '../theme.js'
import DeltaBadge   from '../components/DeltaBadge.jsx'

// ── Scatter Plot ──────────────────────────────────────────────────────────────
function ScatterPlot({ cards }) {
  const [tooltip, setTooltip] = useState(null)

  const W  = 560, H  = 360
  const ml = 65,  mr = 20, mt = 20, mb = 50
  const pw = W - ml - mr
  const ph = H - mt - mb

  const prices = cards.map(c => c.marketPrice)
  const logMin = Math.log(Math.min(...prices) * 0.9)
  const logMax = Math.log(Math.max(...prices) * 1.1)

  const xS = d  => ml + ((d - 1) / 9) * pw
  const yS = p  => mt + ph - ((Math.log(p) - logMin) / (logMax - logMin)) * ph
  const rS = pc => 4 + ((pc - 1) / 9) * 12
  const dotColor = c => c.delta < -15 ? T.green : c.delta > 15 ? T.red : T.yellow

  // Reference trend line at avg pull cost (~5.5)
  const refPts = []
  for (let d = 1; d <= 10; d += 0.5)
    refPts.push([xS(d), yS(Math.exp(0.80 + 0.17 * 5.5 + 0.38 * d))])
  const refPath = refPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  const yTicks = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500]
    .filter(v => Math.log(v) >= logMin && Math.log(v) <= logMax)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={W} height={H} style={{ background: T.s2, borderRadius: 10, display: 'block' }}>
        {/* Grid lines */}
        {[2,4,6,8,10].map(d => (
          <line key={d} x1={xS(d)} x2={xS(d)} y1={mt} y2={mt+ph} stroke={T.border} strokeWidth={1} />
        ))}
        {yTicks.map(v => (
          <line key={v} x1={ml} x2={ml+pw} y1={yS(v)} y2={yS(v)} stroke={T.border} strokeWidth={1} />
        ))}

        {/* Regression reference line */}
        <path d={refPath} fill="none" stroke={T.orange} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.65} />

        {/* Data dots */}
        {cards.map(c => (
          <circle
            key={c.id}
            cx={xS(c.desirability)} cy={yS(c.marketPrice)} r={rS(c.pullCost)}
            fill={dotColor(c)} fillOpacity={0.75}
            stroke={dotColor(c)} strokeWidth={1}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => setTooltip({ card: c, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* X axis */}
        <line x1={ml} x2={ml+pw} y1={mt+ph} y2={mt+ph} stroke={T.dim} strokeWidth={1} />
        {[1,2,3,4,5,6,7,8,9,10].map(d => (
          <g key={d}>
            <line x1={xS(d)} x2={xS(d)} y1={mt+ph} y2={mt+ph+4} stroke={T.dim} />
            <text x={xS(d)} y={mt+ph+16} textAnchor="middle" fill={T.dim} fontSize={10} fontFamily={T.mono}>{d}</text>
          </g>
        ))}
        <text x={ml+pw/2} y={H-6} textAnchor="middle" fill={T.muted} fontSize={11} fontFamily={T.display}>
          Desirability Index
        </text>

        {/* Y axis */}
        <line x1={ml} x2={ml} y1={mt} y2={mt+ph} stroke={T.dim} strokeWidth={1} />
        {yTicks.map(v => (
          <g key={v}>
            <line x1={ml-4} x2={ml} y1={yS(v)} y2={yS(v)} stroke={T.dim} />
            <text x={ml-8} y={yS(v)} textAnchor="end" dominantBaseline="middle" fill={T.dim} fontSize={9} fontFamily={T.mono}>
              ${v}
            </text>
          </g>
        ))}
        <text x={14} y={mt+ph/2} textAnchor="middle" fill={T.muted} fontSize={11} fontFamily={T.display}
          transform={`rotate(-90 14 ${mt+ph/2})`}>
          Market Price (log scale)
        </text>
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 72, zIndex: 999,
            background: T.s1, border: `1px solid ${T.border2}`, borderRadius: 8,
            padding: '10px 14px', pointerEvents: 'none', minWidth: 195,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            {tooltip.card.name}
          </div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
            Market: ${tooltip.card.marketPrice.toFixed(2)} · Model: ${tooltip.card.predictedPrice.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>
            Desirability: {tooltip.card.desirability.toFixed(2)} · Pull Cost: {tooltip.card.pullCost.toFixed(2)}
          </div>
          <div style={{ marginTop: 7 }}>
            <DeltaBadge delta={tooltip.card.delta} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Price Predictor calculator ────────────────────────────────────────────────
function PricePredictor() {
  const [pullCost,     setPullCost]     = useState(5)
  const [desirability, setDesirability] = useState(5)
  const predicted = Math.exp(0.80 + 0.17 * pullCost + 0.38 * desirability)

  return (
    <div style={{ background: T.s2, borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: T.display }}>
        Price Predictor
      </div>
      {[
        { label: 'Pull Cost',    val: pullCost,     setVal: setPullCost,     color: T.orange },
        { label: 'Desirability', val: desirability, setVal: setDesirability, color: T.purple },
      ].map(({ label, val, setVal, color }) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: T.muted }}>{label}</label>
            <span style={{ fontSize: 12, fontFamily: T.mono, color }}>{val.toFixed(1)}/10</span>
          </div>
          <input
            type="range" min={1} max={10} step={0.1} value={val}
            style={{ width: '100%', accentColor: color }}
            onChange={e => setVal(+e.target.value)}
          />
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: T.muted }}>Predicted Price</span>
        <span style={{ fontSize: 28, fontFamily: T.mono, fontWeight: 800, color: T.orange }}>
          ${predicted.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ── Pricing Model Tab ─────────────────────────────────────────────────────────
export default function PricingModel({ cards }) {
  // R² over log(price)
  const yMean = cards.reduce((s, c) => s + Math.log(c.marketPrice), 0) / cards.length
  const ssTot = cards.reduce((s, c) => s + (Math.log(c.marketPrice) - yMean) ** 2, 0)
  const ssRes = cards.reduce((s, c) => s + (Math.log(c.marketPrice) - Math.log(c.predictedPrice)) ** 2, 0)
  const r2    = Math.max(0, 1 - ssRes / ssTot)

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

      {/* ─── Left: methodology + scatter ─── */}
      <div style={{ flex: '1 1 560px', minWidth: 0 }}>
        <div style={{ marginBottom: 14, padding: 16, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.muted, lineHeight: 1.75 }}>
          The FusionMetrics model uses two independent variables —{' '}
          <strong style={{ color: T.text }}>Pull Cost</strong> (rarity-derived scarcity, 1–10) and{' '}
          <strong style={{ color: T.text }}>Desirability Index</strong> (character premium 45%, art/hype 45%,
          universal appeal 10%) — to predict expected market price via exponential regression.
          Cards trading below the model may represent value; cards above may be overbought.
        </div>

        <ScatterPlot cards={cards} />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: T.green,  label: 'Undervalued (<−15%)'  },
            { color: T.yellow, label: 'Fair (±15%)'          },
            { color: T.red,    label: 'Overvalued (>+15%)'   },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 11, color: T.dim, marginLeft: 'auto' }}>
            Dot size = Pull Cost &nbsp;|&nbsp;
            <span style={{ color: T.orange }}>--- Regression line (avg pull cost)</span>
          </span>
        </div>
      </div>

      {/* ─── Right: formula + coefficients + predictor ─── */}
      <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Formula card */}
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Regression Formula
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 12, lineHeight: 2.1, background: T.s2, padding: 12, borderRadius: 8 }}>
            <div style={{ color: T.muted }}>price = exp(</div>
            <div style={{ paddingLeft: 14, color: T.text }}>0.80</div>
            <div style={{ paddingLeft: 14 }}>
              + <span style={{ color: T.orange }}>0.17</span>
              <span style={{ color: T.muted }}> × pullCost</span>
            </div>
            <div style={{ paddingLeft: 14 }}>
              + <span style={{ color: T.purple }}>0.38</span>
              <span style={{ color: T.muted }}> × desirability</span>
            </div>
            <div style={{ color: T.muted }}>)</div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
            <span style={{ fontSize: 12, color: T.dim }}>R² Confidence</span>
            <span style={{ fontSize: 20, fontFamily: T.mono, fontWeight: 700, color: T.green }}>
              {r2.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Coefficient cards */}
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Coefficients
          </div>
          {[
            { label: 'Pull Cost',    coef: '+0.17', sub: '+17% price impact per point', color: T.orange },
            { label: 'Desirability', coef: '+0.38', sub: '+38% price impact per point', color: T.purple },
            { label: 'Intercept',    coef: '0.80',  sub: `base price $${Math.exp(0.80).toFixed(2)}`, color: T.muted },
          ].map(({ label, coef, sub, color }) => (
            <div key={label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 13, color: T.text }}>{label}</span>
                <span style={{ fontFamily: T.mono, fontWeight: 700, color, fontSize: 14 }}>{coef}</span>
              </div>
              <div style={{ fontSize: 11, color: T.dim }}>{sub}</div>
            </div>
          ))}
        </div>

        <PricePredictor />
      </div>
    </div>
  )
}
