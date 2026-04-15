import { useState }  from 'react'
import { T }         from '../theme.js'
import Sparkline     from './Sparkline.jsx'
import GaugeRing     from './GaugeRing.jsx'
import MiniBar       from './MiniBar.jsx'
import DeltaBadge    from './DeltaBadge.jsx'
import RarityBadge   from './RarityBadge.jsx'
import CardImage     from './CardImage.jsx'

// Small tab-button group for choosing sparkline time window
function RangeToggle({ range, setRange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[7, 14, 30].map(r => (
        <button
          key={r}
          onClick={() => setRange(r)}
          style={{
            padding: '2px 9px',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: T.mono,
            fontWeight: 600,
            background: range === r ? T.orange : T.s3,
            color:      range === r ? '#fff'    : T.dim,
            transition: 'background .15s, color .15s',
          }}
        >
          {r}d
        </button>
      ))}
    </div>
  )
}

export default function CardDetail({ card, onClose, watched = false, onToggleWatch = null }) {
  const [range, setRange] = useState(30)

  const dpColor = card.demandPressure > 0.7 ? T.red : card.demandPressure > 0.4 ? T.orange : T.green
  const ssColor = card.supplySaturation > 1 ? T.red : T.green

  return (
    <div
      style={{
        background: T.s1,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 24,
        overflowY: 'auto',
        position: 'relative',
        height: '100%',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: T.s2, border: 'none', color: T.muted,
          cursor: 'pointer', borderRadius: 6, padding: '4px 10px', fontSize: 12,
        }}
      >
        ✕ close
      </button>

      {/* Watch toggle */}
      {onToggleWatch && (
        <button
          onClick={onToggleWatch}
          style={{
            position: 'absolute', top: 16, right: 80,
            background: watched ? 'rgba(234,179,8,0.12)' : T.s2,
            border: `1px solid ${watched ? 'rgba(234,179,8,0.4)' : T.border}`,
            color: watched ? '#eab308' : T.dim,
            cursor: 'pointer', borderRadius: 6, padding: '4px 10px', fontSize: 12,
            transition: 'background .15s, border-color .15s, color .15s',
          }}
        >
          {watched ? '★ Watching' : '☆ Watch'}
        </button>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        {/* Card image — large, centered, above name */}
        {card.image && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CardImage
              src={card.image}
              cardCode={card.cardCode}
              alt={card.name}
              width={140}
              height={196}
              radius={8}
            />
          </div>
        )}
        {/* Emoji icon only shown when no real image */}
        {!card.image && (
          <div style={{ fontSize: 38, marginBottom: 6 }}>{card.icon}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: T.display, lineHeight: 1.3 }}>
            {card.name}
          </div>
          {card.verified && (
            <span title="Real card name verified from physical card" style={{
              fontSize: 10, fontWeight: 700, color: T.green,
              background: `${T.green}22`, border: `1px solid ${T.green}44`,
              borderRadius: 4, padding: '2px 6px', flexShrink: 0,
            }}>✓ VERIFIED</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          <RarityBadge rarity={card.rarity} color={card.rarityColor} />
          {card.cardColor && (
            <span style={{
              fontSize: 10, fontFamily: T.mono, color: T.muted,
              background: T.s3, borderRadius: 4, padding: '2px 6px',
            }}>{card.cardColor}</span>
          )}
          {card.cardType && card.cardType !== 'BATTLE' && (
            <span style={{
              fontSize: 10, fontFamily: T.mono, color: T.orange,
              background: `${T.orange}22`, borderRadius: 4, padding: '2px 6px',
            }}>{card.cardType}</span>
          )}
          <span style={{ color: T.muted, fontSize: 12, fontFamily: T.mono }}>{card.cardCode}</span>
          <span style={{ color: T.dim, fontSize: 12 }}>{card.setName}</span>
        </div>
        {card.trait && (
          <div style={{ marginTop: 6, fontSize: 11, color: T.dim, fontFamily: T.mono }}>
            {card.trait}
          </div>
        )}
      </div>

      {/* ── Price comparison ── */}
      <div style={{ background: T.s2, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Market Price
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.text, fontFamily: T.mono }}>
              ${card.marketPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Model Price
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.muted, fontFamily: T.mono }}>
              ${card.predictedPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DeltaBadge delta={card.delta} />
          <span style={{ fontSize: 12, color: T.dim }}>
            {card.delta < -15
              ? 'Undervalued — potential buy signal'
              : card.delta > 15
              ? 'Overvalued — exercise caution'
              : 'Fairly priced — near model value'}
          </span>
        </div>
      </div>

      {/* ── Price history sparkline ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Price History
          </div>
          <RangeToggle range={range} setRange={setRange} />
        </div>
        <Sparkline data={card.priceHistory.slice(-range)} color={T.orange} height={60} width={270} fill />
      </div>

      {/* ── Desirability breakdown ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.dim, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Desirability Breakdown
        </div>
        {[
          { label: 'Character Premium (45%)', value: card.charPremium,     color: T.orange },
          { label: 'Art / Hype (45%)',         value: card.artScore,        color: T.purple },
          { label: 'Universal Appeal (10%)',   value: card.universalAppeal, color: T.cyan   },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: T.mono, color }}>{value.toFixed(1)}/10</span>
            </div>
            <MiniBar value={value} max={10} color={color} w={270} />
          </div>
        ))}
        <div
          style={{
            borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Composite Desirability</span>
          <span style={{ fontSize: 18, fontFamily: T.mono, color: T.orange, fontWeight: 700 }}>
            {card.desirability.toFixed(2)}/10
          </span>
        </div>
      </div>

      {/* ── Gauge rings ── */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <GaugeRing value={card.demandPressure} max={1} color={dpColor} size={90} label="Demand" />
          <div style={{ fontSize: 10, color: dpColor, marginTop: 4 }}>
            {card.demandPressure > 0.7 ? 'High Demand' : card.demandPressure > 0.4 ? 'Moderate' : 'Low Demand'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <GaugeRing value={Math.min(card.supplySaturation, 2)} max={2} color={ssColor} size={90} label="Sup. Sat." />
          <div style={{ fontSize: 10, color: ssColor, marginTop: 4 }}>
            {card.supplySaturation > 1 ? 'Loosening' : 'Tightening'}
          </div>
        </div>
      </div>

      {/* ── Supply stats grid ── */}
      <div style={{ background: T.s2, borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Pull Cost',    value: `${card.pullCost.toFixed(1)}/10`  },
            { label: 'Total Supply', value: card.totalSupply.toLocaleString() },
            { label: 'Absorbed',     value: card.absorbed.toLocaleString()    },
            { label: 'Supply Sat.',  value: card.supplySaturation.toFixed(3)  },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontFamily: T.mono, color: T.text, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Demand trend sparkline ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Demand Trend
          </div>
          <RangeToggle range={range} setRange={setRange} />
        </div>
        <Sparkline data={card.demandHistory.slice(-range)} color={dpColor} height={40} width={270} fill />
      </div>
    </div>
  )
}
