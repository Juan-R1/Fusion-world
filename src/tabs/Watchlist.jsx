// src/tabs/Watchlist.jsx
// Local-only portfolio / Watchlist tab.

import { useState, useMemo } from 'react'
import { T }         from '../theme.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import RarityBadge   from '../components/RarityBadge.jsx'
import CardDetail    from '../components/CardDetail.jsx'
import CardImage     from '../components/CardImage.jsx'

const SORT_OPTS = [
  { value: 'pl',           label: 'Highest P/L'      },
  { value: 'value',        label: 'Current Value'     },
  { value: 'undervalued',  label: 'Most Undervalued'  },
  { value: 'overvalued',   label: 'Most Overvalued'   },
  { value: 'price',        label: 'Highest Price'     },
  { value: 'name',         label: 'Alphabetical'      },
]

const INP = {
  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 6,
  color: '#f1f5f9', padding: '8px 11px', fontSize: 14, outline: 'none',
  fontFamily: "'Outfit', system-ui, sans-serif",
}

const FIELD = {
  ...INP,
  width: '100%',
  minWidth: 0,
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: T.mono,
}

const DAY_MS = 24 * 60 * 60 * 1000

function money(value) {
  const n = Number(value)
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`
}

function signedMoney(value) {
  const n = Number(value)
  const safe = Number.isFinite(n) ? n : 0
  return `${safe >= 0 ? '+' : '-'}$${Math.abs(safe).toFixed(2)}`
}

function plColor(value) {
  if (value > 0) return T.green
  if (value < 0) return T.red
  return T.muted
}

function csvCell(value) {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function exportWatchlistCsv(positions) {
  const header = ['cardCode', 'name', 'set', 'rarity', 'quantity', 'entryPrice', 'currentValue', 'pl']
  const rows = positions.map(row => [
    row.card.cardCode,
    row.card.name,
    row.card.set || row.card.setCode || row.card.cardCode?.split('-')[0] || '',
    row.card.rarity,
    row.quantity,
    row.entryPrice.toFixed(2),
    row.currentValue.toFixed(2),
    row.pl.toFixed(2),
  ])
  const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fusion-watchlist-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function priceFreshness(card, now) {
  if (!card?.hasLivePrice || !card.priceTimestamp) {
    return { label: 'Unknown', detail: card?.hasLivePrice ? 'No timestamp' : 'EST price', color: T.dim, border: 'rgba(100,116,139,0.35)', bg: 'rgba(100,116,139,0.12)' }
  }

  const ts = new Date(card.priceTimestamp).getTime()
  if (!Number.isFinite(ts) || ts > now) {
    return { label: 'Unknown', detail: 'Bad timestamp', color: T.dim, border: 'rgba(100,116,139,0.35)', bg: 'rgba(100,116,139,0.12)' }
  }

  const ageDays = (now - ts) / DAY_MS
  if (ageDays < 7) return { label: 'Fresh', detail: '<7 days', color: T.green, border: 'rgba(34,197,94,0.38)', bg: 'rgba(34,197,94,0.12)' }
  if (ageDays <= 21) return { label: 'Aging', detail: '7-21 days', color: T.yellow, border: 'rgba(234,179,8,0.38)', bg: 'rgba(234,179,8,0.12)' }
  return { label: 'Stale', detail: '>21 days', color: T.red, border: 'rgba(220,38,38,0.38)', bg: 'rgba(220,38,38,0.12)' }
}

function SourceChip({ live }) {
  return (
    <span style={{
      background: live ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.12)',
      border: live ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(148,163,184,0.35)',
      color: live ? '#10b981' : T.muted,
      borderRadius: 3,
      padding: '0px 4px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {live ? 'LIVE' : 'EST'}
    </span>
  )
}

export default function Watchlist({
  cards,
  watchedCodes,
  watchlistItems = {},
  onToggleWatch,
  onUpdateItem = () => {},
  onRemove,
  onClear,
}) {
  const [sort,     setSort]     = useState('pl')
  const [selected, setSelected] = useState(null)
  const isMobile = useIsMobile()
  const now = Date.now()

  const positions = useMemo(() => {
    const rows = cards
      .filter(c => watchedCodes.has(c.cardCode))
      .map(card => {
        const item = watchlistItems[card.cardCode] ?? {}
        const quantity = Number.isFinite(Number(item.quantity)) && Number(item.quantity) >= 1
          ? Math.floor(Number(item.quantity))
          : 1
        const entryPrice = Number.isFinite(Number(item.entryPrice)) && Number(item.entryPrice) >= 0
          ? Number(item.entryPrice)
          : 0
        const currentValue = quantity * card.marketPrice
        const costBasis = quantity * entryPrice
        const pl = currentValue - costBasis
        const plPct = costBasis > 0 ? (pl / costBasis) * 100 : null

        return {
          card,
          quantity,
          entryPrice,
          currentValue,
          costBasis,
          pl,
          plPct,
          freshness: priceFreshness(card, now),
        }
      })

    return rows.sort((a, b) => {
      switch (sort) {
        case 'pl':           return b.pl - a.pl
        case 'value':        return b.currentValue - a.currentValue
        case 'undervalued':  return a.card.delta - b.card.delta
        case 'overvalued':   return b.card.delta - a.card.delta
        case 'price':        return b.card.marketPrice - a.card.marketPrice
        case 'name':         return String(a.card.name ?? '').localeCompare(String(b.card.name ?? ''))
        default: return 0
      }
    })
  }, [cards, watchedCodes, watchlistItems, sort, now])

  const selCard = selected != null ? cards.find(c => c.id === selected) : null

  const totalCost = positions.reduce((s, row) => s + row.costBasis, 0)
  const totalCurrent = positions.reduce((s, row) => s + row.currentValue, 0)
  const totalPL = totalCurrent - totalCost
  const liveCount = positions.filter(row => row.card.hasLivePrice).length
  const liveCoverage = positions.length ? (liveCount / positions.length) * 100 : 0

  const handleClear = () => {
    if (window.confirm('Clear all local watchlist positions? This removes saved quantities and entry prices from this browser.')) {
      onClear()
      setSelected(null)
    }
  }

  const removeCard = cardCode => {
    if (onRemove) onRemove(cardCode)
    else onToggleWatch(cardCode)
    setSelected(prev => {
      const card = cards.find(c => c.cardCode === cardCode)
      return card?.id === prev ? null : prev
    })
  }

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
            Your watchlist is saved locally in this browser.
          </div>
          <button
            disabled
            style={{
              marginTop: 18,
              background: T.s2,
              border: `1px solid ${T.border}`,
              color: T.dim,
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 13,
              fontFamily: T.display,
              opacity: 0.55,
            }}
          >
            Export CSV
          </button>
        </div>
      </div>
    )
  }

  const gridCols = '2fr 0.7fr 0.9fr 0.95fr 1fr 0.9fr 36px'
  const tableMinWidth = isMobile ? 860 : 'auto'

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
            { label: 'Positions',      value: positions.length,                 color: T.text },
            { label: 'Total Cost',     value: money(totalCost),                 color: T.muted },
            { label: 'Current Value',  value: money(totalCurrent),              color: T.orange },
            { label: 'Unrealized P/L', value: signedMoney(totalPL),             color: plColor(totalPL) },
            { label: 'Live Coverage',  value: `${liveCoverage.toFixed(0)}%`,    color: liveCoverage >= 80 ? T.green : T.yellow },
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
          <div style={{
            fontSize: 11,
            color: T.dim,
            lineHeight: 1.5,
            flex: '1 1 260px',
          }}>
            Unrealized P/L is based on current FusionMetrics price. EST rows use model-estimated prices.
          </div>
          {!isMobile && <div style={{ flex: 1 }} />}
          <button
            onClick={() => exportWatchlistCsv(positions)}
            disabled={positions.length === 0}
            style={{
              background: positions.length === 0 ? T.s2 : 'rgba(249,115,22,0.12)',
              border: `1px solid ${positions.length === 0 ? T.border : 'rgba(249,115,22,0.42)'}`,
              color: positions.length === 0 ? T.dim : T.orange,
              cursor: positions.length === 0 ? 'not-allowed' : 'pointer',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 13,
              fontFamily: T.display,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Export CSV
          </button>
          <button
            onClick={handleClear}
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
              <span style={{ textAlign: 'right' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Entry $</span>
              <span style={{ textAlign: 'right' }}>Current</span>
              <span style={{ textAlign: 'right' }}>Unrealized P/L</span>
              <span style={{ textAlign: 'center' }}>Freshness</span>
              <span />
            </div>

            {positions.map(row => {
              const { card, freshness } = row
              const active = selected === card.id

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
                        <SourceChip live={card.hasLivePrice} />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onClick={e => e.stopPropagation()}
                      onChange={e => onUpdateItem(card.cardCode, { quantity: e.target.value })}
                      aria-label={`${card.name} quantity`}
                      style={{ ...FIELD, textAlign: 'right' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.entryPrice}
                      onClick={e => e.stopPropagation()}
                      onChange={e => onUpdateItem(card.cardCode, { entryPrice: e.target.value })}
                      aria-label={`${card.name} entry price`}
                      style={{ ...FIELD, textAlign: 'right' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: T.mono }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{money(row.currentValue)}</div>
                    <div style={{ fontSize: 10, color: T.dim }}>now</div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: T.mono }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: plColor(row.pl) }}>{signedMoney(row.pl)}</div>
                    <div style={{ fontSize: 10, color: T.dim }}>
                      {row.plPct == null ? 'No cost basis' : `${row.plPct >= 0 ? '+' : ''}${row.plPct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      border: `1px solid ${freshness.border}`,
                      background: freshness.bg,
                      color: freshness.color,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      {freshness.label}
                    </span>
                    <span style={{ fontSize: 10, color: T.dim }}>{freshness.detail}</span>
                  </div>

                  {/* Unwatch button */}
                  <button
                    onClick={e => { e.stopPropagation(); removeCard(card.cardCode) }}
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
