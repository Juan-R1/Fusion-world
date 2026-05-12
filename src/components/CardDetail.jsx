import { useState, useEffect } from 'react'
import { T }         from '../theme.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { loadPriceHistory30d, normalizeHistory, historyStateOf } from '../data.js'
import { loadPremiumMetadata } from '../lib/premiumMetadata.js'
import Sparkline     from './Sparkline.jsx'
import GaugeRing     from './GaugeRing.jsx'
import MiniBar       from './MiniBar.jsx'
import DeltaBadge    from './DeltaBadge.jsx'
import RarityBadge   from './RarityBadge.jsx'
import CardImage     from './CardImage.jsx'
import PremiumBadges from './PremiumBadges.jsx'
import CompsPanel    from './CompsPanel.jsx'

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

function priceFreshnessOf(card) {
  const fallback = {
    text: 'Source: Model estimate · no live JustTCG timestamp',
    color: T.dim,
  }
  if (!card.hasLivePrice || typeof card.priceTimestamp !== 'string') return fallback

  const refreshedAt = Date.parse(card.priceTimestamp)
  const ageMs = Date.now() - refreshedAt
  if (!Number.isFinite(refreshedAt) || ageMs < 0) return fallback

  const hours = Math.floor(ageMs / 3_600_000)
  const days = Math.floor(ageMs / 86_400_000)
  const relative = hours < 1
    ? 'Just now'
    : hours < 24
      ? `${hours} hour${hours === 1 ? '' : 's'} ago`
      : `${days} day${days === 1 ? '' : 's'} ago`

  const color = days > 21
    ? T.red
    : days >= 7
      ? T.yellow
      : T.muted

  return {
    text: `Source: JustTCG · refreshed ${relative}`,
    color,
  }
}

export default function CardDetail({ card, onClose, watched = false, onToggleWatch = null }) {
  const [range, setRange] = useState(30)
  const isMobile = useIsMobile()

  // Lazy-loaded price history.
  //   historyEntries === null && !historyError  → loading
  //   historyEntries  is array (any length)     → loaded; classify with historyStateOf
  //   historyError    === true                  → fetch failed → 'unavailable'
  const [historyEntries, setHistoryEntries] = useState(null)
  const [historyError,   setHistoryError]   = useState(false)
  const [premiumItems,   setPremiumItems]   = useState({})

  useEffect(() => {
    let cancelled = false
    setHistoryEntries(null)
    setHistoryError(false)
    loadPriceHistory30d()
      .then(map => {
        if (cancelled) return
        setHistoryEntries(normalizeHistory(map[card.cardCode]))
      })
      .catch(() => {
        if (cancelled) return
        setHistoryError(true)
      })
    return () => { cancelled = true }
  }, [card.cardCode])

  useEffect(() => {
    let cancelled = false
    loadPremiumMetadata()
      .then(data => {
        if (cancelled) return
        setPremiumItems(data.items || {})
      })
      .catch(() => {
        if (cancelled) return
        setPremiumItems({})
      })
    return () => { cancelled = true }
  }, [])

  const historyState = historyError
    ? 'unavailable'
    : historyEntries === null
      ? 'loading'
      : historyStateOf(historyEntries.length)
  const historyCount = Array.isArray(historyEntries) ? historyEntries.length : 0
  const priceFreshness = priceFreshnessOf(card)
  const premiumMetadata = premiumItems[card.cardCode] ?? null

  const dpColor = card.demandPressure > 0.7 ? T.red : card.demandPressure > 0.4 ? T.orange : T.green
  const ssColor = card.supplySaturation > 1 ? T.red : T.green

  // Responsive widths for inline charts
  const chartWidth = isMobile
    ? Math.min((typeof window !== 'undefined' ? window.innerWidth : 320) - 64, 320)
    : 270
  const pad   = isMobile ? 16 : 24
  const imgW  = isMobile ? 120 : 140
  const imgH  = isMobile ? 168 : 196

  return (
    <div
      style={{
        background: T.s1,
        border: `1px solid ${T.border}`,
        borderRadius: isMobile ? 0 : 12,
        padding: pad,
        paddingTop: isMobile ? 56 : pad,
        overflowY: 'auto',
        position: 'relative',
        height: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: T.s2, border: 'none', color: T.muted,
          cursor: 'pointer', borderRadius: 6, padding: '6px 12px', fontSize: 13,
          fontWeight: 600, zIndex: 2,
        }}
      >
        ✕ {isMobile ? 'Close' : 'close'}
      </button>

      {/* Watch toggle */}
      {onToggleWatch && (
        <button
          onClick={onToggleWatch}
          style={{
            position: 'absolute', top: 16, right: isMobile ? 92 : 80,
            background: watched ? 'rgba(234,179,8,0.12)' : T.s2,
            border: `1px solid ${watched ? 'rgba(234,179,8,0.4)' : T.border}`,
            color: watched ? '#eab308' : T.dim,
            cursor: 'pointer', borderRadius: 6, padding: '6px 12px', fontSize: 13,
            fontWeight: 600, zIndex: 2,
            transition: 'background .15s, border-color .15s, color .15s',
          }}
        >
          {watched ? '★ Watching' : '☆ Watch'}
        </button>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        {card.image && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CardImage
              src={card.image}
              cardCode={card.cardCode}
              alt={card.name}
              width={imgW}
              height={imgH}
              radius={8}
            />
          </div>
        )}
        {!card.image && (
          <div style={{ fontSize: 38, marginBottom: 6, textAlign: 'center' }}>{card.icon}</div>
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
        <PremiumBadges metadata={premiumMetadata} />
        {card.trait && (
          <div style={{ marginTop: 6, fontSize: 11, color: T.dim, fontFamily: T.mono }}>
            {card.trait}
          </div>
        )}
      </div>

      {/* ── Price comparison ── */}
      <div style={{ background: T.s2, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Market Price
            </div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: T.text, fontFamily: T.mono }}>
              ${card.marketPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Model Price
            </div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: T.muted, fontFamily: T.mono }}>
              ${card.predictedPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DeltaBadge delta={card.delta} />
          <span style={{ fontSize: 12, color: T.dim }}>
            {card.delta < -15
              ? 'Below model — possible value signal'
              : card.delta > 15
              ? 'Above model — review assumptions'
              : 'Near model value'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: priceFreshness.color, marginTop: 10, fontFamily: T.mono }}>
          {priceFreshness.text}
        </div>
      </div>

      {/* ── Price history sparkline (lazy-loaded from /priceHistory30d.json) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Price History
          </div>
          {historyState === 'real' && (
            <RangeToggle range={range} setRange={setRange} />
          )}
        </div>

        {(historyState === 'real' || historyState === 'limited') && historyCount >= 2 && (
          <>
            <Sparkline
              data={historyEntries.slice(-range).map(p => p.price)}
              color={T.orange}
              height={60}
              width={chartWidth}
              fill
            />
            <div style={{ fontSize: 10, color: T.dim, marginTop: 6, fontFamily: T.mono }}>
              {historyState === 'real'
                ? `30d JustTCG history · ${historyCount} points`
                : `Limited history · ${historyCount} points`}
            </div>
          </>
        )}

        {historyState === 'limited' && historyCount < 2 && (
          <div
            style={{
              background: T.s2, borderRadius: 8, padding: '18px 16px',
              height: 60, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${T.border}`,
            }}
          >
            <span style={{ fontSize: 11, color: T.dim, fontFamily: T.mono }}>
              Limited history · 1 point
            </span>
          </div>
        )}

        {historyState === 'loading' && (
          <div
            style={{
              background: T.s2, borderRadius: 8, padding: '18px 16px',
              height: 60, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${T.border}`,
            }}
          >
            <span style={{ fontSize: 11, color: T.dim, fontFamily: T.mono }}>
              Loading 30d history…
            </span>
          </div>
        )}

        {historyState === 'none' && (
          <div
            style={{
              background: T.s2, borderRadius: 8, padding: '18px 16px',
              height: 60, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${T.border}`,
            }}
          >
            <span style={{ fontSize: 11, color: T.dim, fontFamily: T.mono }}>
              Not enough JustTCG history
            </span>
          </div>
        )}

        {historyState === 'unavailable' && (
          <div
            style={{
              background: T.s2, borderRadius: 8, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
              border: `1px dashed ${T.border}`,
            }}
          >
            <span style={{ fontSize: 12, color: T.text, fontFamily: T.mono, fontWeight: 600 }}>
              Price history unavailable
            </span>
            <span style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>
              Unable to load JustTCG history right now. Current price is still available.
            </span>
          </div>
        )}
      </div>

      <CompsPanel cardCode={card.cardCode} />

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
            <MiniBar value={value} max={10} color={color} w={chartWidth} />
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
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
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

      {/* Demand-trend sparkline removed: there is no real time series for
          demand pressure. The gauge ring above already conveys the static
          score; rule 4 of the trust fix forbids synthetic movement. */}
    </div>
  )
}
