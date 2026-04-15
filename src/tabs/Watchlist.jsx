// src/tabs/Watchlist.jsx
// Portfolio / Watchlist tab — shows starred cards with aggregate stats.

import { useState, useMemo } from 'react'
import { T }         from '../theme.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import DeltaBadge    from '../components/DeltaBadge.jsx'
import MiniBar       from '../components/MiniBar.jsx'
import RarityBadge   from '../components/RarityBadge.jsx'
import CardDetail    from '../components/CardDetail.jsx'
import CardImage     from '../components/CardImage.jsx'

const SORT_OPTS = [
  { value: 'undervalued',  label: 'Most Undervalued'  },
  { value: 'overvalued',   label: 'Most Overvalued'   },
  { value: 'price',        label: 'Highest Price'     },
  { value: 'desirability', label: 'Desirability'      },
  { value: 'name',         label: 'Alphabetical'      },
]

const INP = {
  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 6,
  color: '#f1f5f9', padding: '8px 11px', fontSize: 14, outline: 'none',
  fontFamily: "'Outfit', system-ui, sans-serif",
}

export default function Watchlist({ cards, watchedCodes, onToggleWatch, onClear }) {
  const [sort,     setSort]     = useState('undervalued')
  const [selected, setSelected] = useState(null)
  const isMobile = useIsMobile()

  const watched = useMemo(() => {
    const wCards = cards.filter(c => watchedCodes.has(c.cardCode))
    return wCards.slice().sort((a, b) => {
      switch (sort) {
        case 'undervalued':  return a.delta - b.delta
        case 'overvalued':   return b.delta - a.delta
        case 'price':        return b.marketPrice - a.marketPrice
        case 'desirability': return b.desirability - a.desirability
        case 'name':         return a.name.localeCompare(b.name)
        default: return 0
      }
    })
  }, [cards, watchedCodes, sort])

  const selCard = selected != null ? cards.find(c => c.id === selected) : null

  const totalMarket = watched.reduce((s, c) => s + c.marketPrice,   0)
  const totalModel  = watched.reduce((s, c) => s + c.predictedPrice, 0)
  const avgDelta    = watched.length ? watched.reduce((s, c) => s + c.delta, 0) / watched.length : 0
  const buySignals  = watched.filter(c => c.delta < -15).length

  // ── Empty state ───────────────────────────────────────────────────────────
  if (watchedCodes.size === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>☆</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.muted, marginBottom: 10 }}>
            Your watchlist is empty
          </div>
          <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>
            Tap the <span style={{ color: T.yellow }}>☆</span> star next to any card in
            the <strong style={{ color: T.text }}>Value Scanner</strong> to add it here.
            Your watchlist is saved automatically and persists across sessions.
          </div>
        </div>
      </div>
    )
  }

  const gridCols = '2fr 1fr 1fr 1fr 1fr 36px'
  const tableMinWidth = isMobile ? 640 : 'auto'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 16,
      height: isMobile ? 'auto' : 'calc(100vh - 136px)',
    }}>

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div style={{
        flex: isMobile ? '1 1 auto' : (selCard ? '0 0 58%' : '1'),
        display: 'flex', flexDirection: 'column', minWidth: 0,
        minHeight: isMobile ? 'calc(100vh - 160px)' : 0,
      }}>

        {/* Portfolio summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: 10, marginBottom: 14,
        }}>
          {[
            { label: 'Watching',     value: watched.length,                                    color: T.text   },
            { label: 'Market Value', value: `$${totalMarket.toFixed(2)}`,                      color: T.orange },
            { label: 'Model Value',  value: `$${totalModel.toFixed(2)}`,                       color: T.muted  },
            { label: 'Avg Delta',    value: `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}%`, color: avgDelta < 0 ? T.green : T.red },
            { label: 'Buy Signals',  value: buySignals,                                        color: T.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px' }}>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color, fontFamily: T.mono }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={{ ...INP, cursor: 'pointer', flex: isMobile ? '1 1 auto' : '0 0 auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {!isMobile && <div style={{ flex: 1 }} />}
          <button
            onClick={onClear}
            style={{
              background: 'none', border: `1px solid ${T.border}`, color: T.dim,
              cursor: 'pointer', borderRadius: 6, padding: '8px 14px', fontSize: 13,
              fontFamily: T.display, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim }}
          >
            ✕ Clear all
          </button>
        </div>

        {/* Table */}
        <div style={{ overflow: 'auto', flex: 1, borderRadius: 8, border: `1px solid ${T.border}`, WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: tableMinWidth }}>

            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: gridCols,
              gap: 8, padding: '8px 14px', fontSize: 10, color: T.dim,
              borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase',
              letterSpacing: '0.06em', position: 'sticky', top: 0, background: T.bg, zIndex: 1,
            }}>
              <span>Card</span>
              <span style={{ textAlign: 'right' }}>Market $</span>
              <span style={{ textAlign: 'right' }}>Model $</span>
              <span style={{ textAlign: 'right' }}>Delta</span>
              <span style={{ textAlign: 'center' }}>Demand</span>
              <span />
            </div>

            {watched.map(card => {
              const active = selected === card.id
              const dpCol  = card.demandPressure > 0.7 ? T.red : card.demandPressure > 0.4 ? T.orange : T.green

              return (
                <div
                  key={card.id}
                  onClick={() => setSelected(active ? null : card.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: gridCols,
                    gap: 8, padding: '10px 14px', cursor: 'pointer', alignItems: 'center',
                    borderBottom: `1px solid ${T.border}`, transition: 'background .12s',
                    background: active ? T.s2 : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.s1 }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Card cell */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {card.image
                      ? <CardImage src={card.image} cardCode={card.cardCode} alt={card.name} width={34} height={48} radius={3} />
                      : <span style={{ fontSize: 22, flexShrink: 0 }}>{card.icon}</span>
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <RarityBadge rarity={card.rarity} color={card.rarityColor} />
                        <span style={{ fontSize: 10, color: T.dim, fontFamily: T.mono }}>{card.cardCode}</span>
                        {card.hasLivePrice && (
                          <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700 }}>LIVE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.text }}>
                    ${card.marketPrice.toFixed(2)}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, color: T.muted }}>
                    ${card.predictedPrice.toFixed(2)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <DeltaBadge delta={card.delta} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <MiniBar value={card.demandPressure} max={1} color={dpCol} w={60} />
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: T.dim }}>
                      {(card.demandPressure * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Unwatch button */}
                  <button
                    onClick={e => { e.stopPropagation(); onToggleWatch(card.cardCode) }}
                    title="Remove from watchlist"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: T.yellow, fontSize: 20, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.85, transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.85' }}
                  >
                    ★
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Right detail panel ────────────────────────────────────────── */}
      {selCard && isMobile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: T.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          <CardDetail
            card={selCard}
            onClose={() => setSelected(null)}
            watched={watchedCodes.has(selCard.cardCode)}
            onToggleWatch={() => onToggleWatch(selCard.cardCode)}
          />
        </div>
      )}

      {selCard && !isMobile && (
        <div style={{ flex: '0 0 42%', minWidth: 0, overflowY: 'auto' }}>
          <CardDetail
            card={selCard}
            onClose={() => setSelected(null)}
            watched={watchedCodes.has(selCard.cardCode)}
            onToggleWatch={() => onToggleWatch(selCard.cardCode)}
          />
        </div>
      )}

      {!selCard && !isMobile && (
        <div style={{
          flex: '0 0 300px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12,
          color: T.dim, fontSize: 13, textAlign: 'center', padding: 24,
        }}>
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div>Click any card to view<br />detailed analytics</div>
          </div>
        </div>
      )}
    </div>
  )
}
