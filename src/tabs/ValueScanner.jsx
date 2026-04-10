import { useState, useMemo } from 'react'
import { T }         from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import DeltaBadge    from '../components/DeltaBadge.jsx'
import MiniBar       from '../components/MiniBar.jsx'
import RarityBadge   from '../components/RarityBadge.jsx'
import CardDetail    from '../components/CardDetail.jsx'
import CardImage     from '../components/CardImage.jsx'

const PAGE_SIZE = 100

const SORT_OPTS = [
  { value: 'undervalued',  label: 'Most Undervalued'  },
  { value: 'overvalued',   label: 'Most Overvalued'   },
  { value: 'demand',       label: 'Highest Demand'    },
  { value: 'price',        label: 'Highest Price'     },
  { value: 'desirability', label: 'Desirability'      },
]

const INP = {
  background: '#1e1e1e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#f1f5f9',
  padding: '7px 11px',
  fontSize: 13,
  outline: 'none',
  fontFamily: "'Outfit', system-ui, sans-serif",
}

export default function ValueScanner({ cards }) {
  const [search,    setSearch]    = useState('')
  const [setFilter, setSetFilter] = useState('ALL')
  const [rarFilter, setRarFilter] = useState('ALL')
  const [sort,      setSort]      = useState('undervalued')
  const [selected,  setSelected]  = useState(null)
  const [page,      setPage]      = useState(0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let r = cards
    if (q)               r = r.filter(c => c.character.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    if (setFilter !== 'ALL') r = r.filter(c => c.set === setFilter)
    if (rarFilter !== 'ALL') r = r.filter(c => c.rarity === rarFilter)
    return r.slice().sort((a, b) => {
      switch (sort) {
        case 'undervalued':  return a.delta - b.delta
        case 'overvalued':   return b.delta - a.delta
        case 'demand':       return b.demandPressure - a.demandPressure
        case 'price':        return b.marketPrice - a.marketPrice
        case 'desirability': return b.desirability - a.desirability
        default: return 0
      }
    })
  }, [cards, search, setFilter, rarFilter, sort])

  // Reset page when filters change
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const clampedPage = Math.min(page, Math.max(0, totalPages - 1))
  const pageSlice   = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE)

  const undervalued = filtered.filter(c => c.delta < -15).length
  const overvalued  = filtered.filter(c => c.delta >  15).length
  const avgDP       = filtered.length
    ? filtered.reduce((s, c) => s + c.demandPressure, 0) / filtered.length
    : 0

  const selCard = selected != null ? cards.find(c => c.id === selected) : null

  // Empty-state context
  const isSprFilter  = rarFilter === 'SPR'
  const isLateSet    = ['FB06','FB07','FB08','FB09'].includes(setFilter)
  const selectedSetName = SETS.find(s => s.code === setFilter)?.name ?? ''
  const resetFilters = () => {
    setSearch('')
    setSetFilter('ALL')
    setRarFilter('ALL')
    setSort('undervalued')
    setSelected(null)
    setPage(0)
  }
  const handleFilterChange = (fn) => { fn(); setPage(0) }

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 136px)' }}>

      {/* ─── Left panel ─── */}
      <div style={{ flex: selCard ? '0 0 58%' : '1', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Cards',       value: filtered.length,                color: T.text    },
            { label: 'Undervalued', value: undervalued,                    color: T.green   },
            { label: 'Overvalued',  value: overvalued,                     color: T.red     },
            { label: 'Avg Demand',  value: `${(avgDP*100).toFixed(0)}%`,   color: T.orange  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', flex: 1 }}>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: T.mono }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...INP, flex: '1 1 150px' }}
            placeholder="Search character or card…"
            value={search}
            onChange={e => handleFilterChange(() => setSearch(e.target.value))}
          />
          <select style={{ ...INP, cursor: 'pointer' }} value={setFilter} onChange={e => handleFilterChange(() => setSetFilter(e.target.value))}>
            <option value="ALL">All Sets</option>
            {SETS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
          <select style={{ ...INP, cursor: 'pointer' }} value={rarFilter} onChange={e => handleFilterChange(() => setRarFilter(e.target.value))}>
            <option value="ALL">All Rarities</option>
            {RARITIES.map(r => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
          </select>
          <select style={{ ...INP, cursor: 'pointer' }} value={sort} onChange={e => handleFilterChange(() => setSort(e.target.value))}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1, borderRadius: 8, border: `1px solid ${T.border}` }}>
          {/* Header row */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              gap: 8, padding: '8px 14px', fontSize: 10, color: T.dim,
              borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase',
              letterSpacing: '0.06em', position: 'sticky', top: 0, background: T.bg,
            }}
          >
            <span>Card</span>
            <span style={{ textAlign: 'right' }}>Market $</span>
            <span style={{ textAlign: 'right' }}>Model $</span>
            <span style={{ textAlign: 'right' }}>Delta</span>
            <span style={{ textAlign: 'center' }}>Demand</span>
            <span style={{ textAlign: 'right' }}>Sup. Sat.</span>
          </div>

          {pageSlice.map(card => {
            const active = selected === card.id
            const dpCol  = card.demandPressure > 0.7 ? T.red : card.demandPressure > 0.4 ? T.orange : T.green

            return (
              <div
                key={card.id}
                onClick={() => setSelected(active ? null : card.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
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
                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: card.supplySaturation > 1 ? T.red : T.green }}>
                  {card.supplySaturation.toFixed(2)}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>
                {isSprFilter && isLateSet ? '🚫' : '🔍'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
                {isSprFilter && isLateSet
                  ? `No Special Rares in ${selectedSetName}`
                  : 'No cards match the current filters'}
              </div>
              <div style={{ fontSize: 12, color: T.dim, marginBottom: 20, lineHeight: 1.6 }}>
                {isSprFilter && isLateSet
                  ? 'SPR cards were discontinued after FB05. Try selecting All Sets or a different rarity.'
                  : 'Try adjusting your search terms, set, or rarity filters.'}
              </div>
              <button
                onClick={resetFilters}
                style={{
                  background: T.orange, border: 'none', color: '#fff',
                  cursor: 'pointer', borderRadius: 6, padding: '8px 20px',
                  fontSize: 13, fontWeight: 600, fontFamily: T.display,
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 10 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              style={{
                background: T.s2, border: `1px solid ${T.border}`, color: clampedPage === 0 ? T.dim : T.text,
                cursor: clampedPage === 0 ? 'default' : 'pointer', borderRadius: 6,
                padding: '5px 12px', fontSize: 12, fontFamily: T.mono,
              }}
            >
              ‹ Prev
            </button>
            <span style={{ fontSize: 12, color: T.muted, fontFamily: T.mono }}>
              Page {clampedPage + 1} / {totalPages}
              <span style={{ color: T.dim, marginLeft: 8 }}>
                ({clampedPage * PAGE_SIZE + 1}–{Math.min((clampedPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length})
              </span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              style={{
                background: T.s2, border: `1px solid ${T.border}`,
                color: clampedPage >= totalPages - 1 ? T.dim : T.text,
                cursor: clampedPage >= totalPages - 1 ? 'default' : 'pointer', borderRadius: 6,
                padding: '5px 12px', fontSize: 12, fontFamily: T.mono,
              }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      {/* ─── Right detail panel ─── */}
      {selCard ? (
        <div style={{ flex: '0 0 42%', minWidth: 0, overflowY: 'auto' }}>
          <CardDetail card={selCard} onClose={() => setSelected(null)} />
        </div>
      ) : (
        <div
          style={{
            flex: '0 0 300px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12,
            color: T.dim, fontSize: 13, textAlign: 'center', padding: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div>Click any card to view<br />detailed analytics</div>
          </div>
        </div>
      )}
    </div>
  )
}
