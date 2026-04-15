// src/tabs/BoxEV.jsx
// Set ROI / Box EV Calculator
// Answers: "Should I open a box or buy singles?"
// Formula: EV per box = Σ (pullRate × CARDS_PER_PACK / rarityCount) × PACKS_PER_BOX × marketPrice

import { useState, useMemo } from 'react'
import { T }         from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import RarityBadge   from '../components/RarityBadge.jsx'
import CardImage     from '../components/CardImage.jsx'

const PACKS_PER_BOX  = 24
const CARDS_PER_PACK = 12

// ── Shared input style ────────────────────────────────────────────────────────
const INP = {
  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 6,
  color: '#f1f5f9', padding: '7px 11px', fontSize: 13, outline: 'none',
  fontFamily: "'Outfit', system-ui, sans-serif",
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, color = T.text, highlight = false }) {
  return (
    <div style={{
      background: highlight ? 'rgba(249,115,22,0.08)' : T.s1,
      border: `1px solid ${highlight ? 'rgba(249,115,22,0.35)' : T.border}`,
      borderRadius: 8, padding: '12px 18px', flex: 1,
    }}>
      <div style={{ fontSize: 10, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: T.mono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function Bar({ pct, color }) {
  return (
    <div style={{ background: '#1e1e1e', borderRadius: 3, height: 6, flex: 1, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .3s' }} />
    </div>
  )
}

export default function BoxEV({ cards }) {
  const [setCode, setSetCode] = useState('FB01')
  const [boxCost, setBoxCost] = useState(80)

  const result = useMemo(() => {
    const setCards = cards.filter(c => c.set === setCode)

    // ── Data quality check ────────────────────────────────────────────────────
    const verifiedCount  = setCards.filter(c => c.verified).length
    const distinctRars   = new Set(setCards.map(c => c.rarity)).size
    // Low rarity diversity → scraper defaulted most cards to 'C'; warn user
    const dataQuality    = distinctRars >= 4 ? 'good' : distinctRars >= 2 ? 'partial' : 'low'

    // ── Count cards per rarity in this set ────────────────────────────────────
    const rarityCounts = {}
    for (const c of setCards) rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1

    // ── Per-rarity pull metadata ──────────────────────────────────────────────
    // copiesPerCardPerPack = pullRate × CARDS_PER_PACK / count_of_that_rarity
    const rarMeta = {}
    for (const r of RARITIES) {
      const n = rarityCounts[r.code] || 0
      if (!n) continue
      rarMeta[r.code] = {
        ...r,
        count:              n,
        copiesPerCardPerPack: (r.pullRate * CARDS_PER_PACK) / n,
        copiesPerCardPerBox:  (r.pullRate * CARDS_PER_PACK * PACKS_PER_BOX) / n,
        packsToHit:           n / (r.pullRate * CARDS_PER_PACK),   // expected packs for 1 copy of a specific card
      }
    }

    // ── Per-card EV rows ──────────────────────────────────────────────────────
    const cardRows = setCards
      .map(c => {
        const m = rarMeta[c.rarity]
        if (!m) return { ...c, boxCopies: 0, boxEV: 0, packsToHit: Infinity }
        return {
          ...c,
          boxCopies:  +m.copiesPerCardPerBox.toFixed(3),
          boxEV:      +(m.copiesPerCardPerBox * c.marketPrice).toFixed(2),
          packsToHit: +m.packsToHit.toFixed(1),
        }
      })
      .sort((a, b) => b.boxEV - a.boxEV)

    // ── Box-level totals ──────────────────────────────────────────────────────
    const evPerBox  = +cardRows.reduce((s, c) => s + c.boxEV, 0).toFixed(2)
    const evPerPack = +(evPerBox / PACKS_PER_BOX).toFixed(2)
    const roi       = +((evPerBox - boxCost) / boxCost * 100).toFixed(1)

    // ── Rarity breakdown ──────────────────────────────────────────────────────
    const rarEV = {}
    for (const c of cardRows) rarEV[c.rarity] = +((rarEV[c.rarity] || 0) + c.boxEV).toFixed(2)

    const rarityRows = RARITIES
      .filter(r => rarEV[r.code])
      .map(r => ({
        ...r,
        count: rarityCounts[r.code] || 0,
        ev:    rarEV[r.code] || 0,
        pct:   evPerBox > 0 ? (rarEV[r.code] / evPerBox) * 100 : 0,
      }))
      .sort((a, b) => b.ev - a.ev)

    // ── Singles comparison ────────────────────────────────────────────────────
    // Top N singles cost vs portion of box EV they represent
    const top5  = cardRows.slice(0, 5)
    const top10 = cardRows.slice(0, 10)
    const top5Cost   = +top5.reduce((s, c) => s + c.marketPrice, 0).toFixed(2)
    const top10Cost  = +top10.reduce((s, c) => s + c.marketPrice, 0).toFixed(2)
    const top5EVShare  = evPerBox > 0 ? top5.reduce((s, c) => s + c.boxEV, 0) / evPerBox * 100 : 0
    const top10EVShare = evPerBox > 0 ? top10.reduce((s, c) => s + c.boxEV, 0) / evPerBox * 100 : 0

    return {
      setCards, cardRows, evPerBox, evPerPack, roi, rarityRows,
      top5Cost, top10Cost, top5EVShare, top10EVShare,
      verifiedCount, distinctRars, dataQuality,
    }
  }, [cards, setCode, boxCost])

  const {
    cardRows, evPerBox, evPerPack, roi, rarityRows,
    top5Cost, top10Cost, top5EVShare, top10EVShare,
    verifiedCount, distinctRars, dataQuality,
  } = result

  const roiColor = roi >= 0 ? T.green : T.red
  const verdict  = roi >= 0 ? 'Opening is +EV' : 'Buy singles'
  const verdictColor = roi >= 0 ? T.green : T.orange

  return (
    <div style={{ height: 'calc(100vh - 136px)', overflowY: 'auto', paddingBottom: 32 }}>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...INP, cursor: 'pointer', minWidth: 230 }} value={setCode} onChange={e => setSetCode(e.target.value)}>
          {SETS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: T.dim, whiteSpace: 'nowrap' }}>Box price $</label>
          <input
            type="number" min={1} max={999} step={5}
            value={boxCost}
            onChange={e => setBoxCost(Number(e.target.value) || 0)}
            style={{ ...INP, width: 76 }}
          />
        </div>

        <div style={{ fontSize: 11, color: T.dim }}>
          {result.setCards.length} cards · {PACKS_PER_BOX} packs/box · {CARDS_PER_PACK} cards/pack
        </div>

        {/* Data quality badge */}
        {dataQuality !== 'good' && (
          <div style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 5,
            background: dataQuality === 'partial' ? 'rgba(234,179,8,0.12)' : 'rgba(220,38,38,0.12)',
            border: `1px solid ${dataQuality === 'partial' ? 'rgba(234,179,8,0.35)' : 'rgba(220,38,38,0.35)'}`,
            color: dataQuality === 'partial' ? T.yellow : T.red,
          }}>
            ⚠ {distinctRars} rarities detected · {verifiedCount} verified cards · rarity breakdown may be approximate
          </div>
        )}
        {dataQuality === 'good' && (
          <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', color: T.green }}>
            ✓ {distinctRars} rarities · {verifiedCount} verified
          </div>
        )}
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Stat label="EV per Pack"   value={`$${evPerPack.toFixed(2)}`}  sub={`of ${CARDS_PER_PACK} cards`} />
        <Stat label="EV per Box"    value={`$${evPerBox.toFixed(2)}`}   sub={`${PACKS_PER_BOX} packs`} />
        <Stat label="Box ROI"       value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}  sub={`at $${boxCost} box price`} color={roiColor} />
        <Stat label="Break-even"    value={`$${evPerBox.toFixed(0)}`}   sub="max box price to be +EV" color={T.orange} highlight />
        <Stat label="Verdict"       value={verdict}                     sub={roi >= 0 ? `$${(evPerBox - boxCost).toFixed(2)} expected profit` : `save $${(boxCost - evPerBox).toFixed(2)} vs opening`} color={verdictColor} />
      </div>

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14 }}>

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Rarity EV breakdown */}
          <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              EV by Rarity — per box
            </div>
            {rarityRows.map(r => (
              <div key={r.code} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, flexShrink: 0 }}>
                  <RarityBadge rarity={r.code} color={r.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: T.dim }}>{r.count} cards</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: T.mono }}>
                      ${r.ev.toFixed(2)}
                    </span>
                  </div>
                  <Bar pct={r.pct} color={r.color} />
                </div>
                <div style={{ width: 34, textAlign: 'right', fontSize: 11, color: T.dim, flexShrink: 0 }}>
                  {r.pct.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          {/* Buy singles vs open */}
          <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Buy Singles vs Open Box
            </div>

            {[
              {
                label: 'Top 5 singles',
                cost:  top5Cost,
                share: top5EVShare,
                desc:  'guaranteed',
              },
              {
                label: 'Top 10 singles',
                cost:  top10Cost,
                share: top10EVShare,
                desc:  'guaranteed',
              },
              {
                label: `Open a box ($${boxCost})`,
                cost:  boxCost,
                share: 100,
                desc:  'expected',
                isBox: true,
              },
            ].map(({ label, cost, share, desc, isBox }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: isBox ? 700 : 400 }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>
                    {share.toFixed(0)}% of box EV · {desc}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: T.text }}>${cost.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                    ${(cost / share * 100).toFixed(2)} / 1% EV
                  </div>
                </div>
              </div>
            ))}

            {/* Verdict summary */}
            <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: roi >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${roi >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)'}` }}>
              <div style={{ fontSize: 11, color: roi >= 0 ? T.green : T.orange, lineHeight: 1.6 }}>
                {roi >= 0
                  ? `Opening is +EV at $${boxCost}. Each box yields ~$${(evPerBox - boxCost).toFixed(2)} expected profit.`
                  : `Top 5 singles ($${top5Cost.toFixed(2)}) capture ${top5EVShare.toFixed(0)}% of box EV at ${((top5Cost / boxCost) * 100).toFixed(0)}% of box cost. Buy singles.`
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: top cards by box EV ────────────────────────────── */}
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Top Cards by Box EV
            </span>
            <span style={{ fontSize: 11, color: T.dim }}>
              expected value from one full box
            </span>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 0.65fr 0.75fr 0.75fr 0.75fr',
            gap: 8, padding: '6px 14px', fontSize: 10, color: T.dim,
            borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase', letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            <span>Card</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'right' }}>Copies/Box</span>
            <span style={{ textAlign: 'right' }}>Packs to Hit</span>
            <span style={{ textAlign: 'right' }}>Box EV</span>
          </div>

          {/* Card rows */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {cardRows.slice(0, 40).map((card, i) => (
              <div
                key={card.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 0.65fr 0.75fr 0.75fr 0.75fr',
                  gap: 8, padding: '8px 14px', alignItems: 'center',
                  borderBottom: `1px solid ${T.border}`,
                  background: i < 5 ? 'rgba(249,115,22,0.04)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {card.image
                    ? <CardImage src={card.image} cardCode={card.cardCode} alt={card.name} width={28} height={40} radius={2} />
                    : <span style={{ fontSize: 18, flexShrink: 0 }}>{card.icon}</span>
                  }
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.name}
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2 }}>
                      <RarityBadge rarity={card.rarity} color={card.rarityColor} />
                      <span style={{ fontSize: 10, color: T.dim, fontFamily: T.mono }}>{card.cardCode}</span>
                      {card.hasLivePrice && (
                        <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700 }}>LIVE</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.text }}>
                  ${card.marketPrice.toFixed(2)}
                </div>

                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.dim }}>
                  {card.boxCopies.toFixed(2)}×
                </div>

                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.dim }}>
                  {card.packsToHit < 1000 ? `~${Math.round(card.packsToHit)}` : '—'}
                </div>

                <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: card.boxEV >= 1 ? T.orange : card.boxEV >= 0.1 ? T.text : T.dim }}>
                  ${card.boxEV.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
