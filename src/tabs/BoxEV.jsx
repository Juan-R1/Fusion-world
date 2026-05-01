// src/tabs/BoxEV.jsx
// Set ROI / Box EV Calculator
// Answers: "Should I open a box or buy singles?"
// Formula: EV per box = Σ (pullRate × CARDS_PER_PACK / rarityCount) × PACKS_PER_BOX × marketPrice

import { useState, useMemo } from 'react'
import { T }         from '../theme.js'
import { SETS, RARITIES } from '../data.js'
import RarityBadge   from '../components/RarityBadge.jsx'
import CardImage     from '../components/CardImage.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

const PACKS_PER_BOX  = 24
const CARDS_PER_PACK = 12
const DAY_MS         = 24 * 60 * 60 * 1000
const CHASE_EV_WARN  = 45

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
      borderRadius: 8, padding: '12px 18px', flex: '1 1 150px', minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: T.mono, overflowWrap: 'anywhere' }}>{value}</div>
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

function pctText(value) {
  return `${Math.round(value * 100)}%`
}

function ageText(days) {
  if (days == null) return 'Unknown'
  if (days < 1) return '<1d avg'
  return `${Math.round(days)}d avg`
}

function timestampMs(value, now) {
  const ms = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Date.parse(value)
      : NaN
  return Number.isFinite(ms) && ms > 0 && ms <= now ? ms : null
}

function freshnessMeta(avgAgeDays, stale7Share, stale21Share, missingTimestampCount, liveCount) {
  if (!liveCount) return { label: 'Unknown', color: T.dim, sub: 'No live prices' }
  if (missingTimestampCount === liveCount) return { label: 'Unknown', color: T.dim, sub: 'No live timestamps' }
  if (stale21Share > 0) return { label: 'Stale', color: T.red, sub: `${ageText(avgAgeDays)} · ${pctText(stale21Share)} >21d` }
  if (stale7Share > 0) return { label: 'Aging', color: T.yellow, sub: `${ageText(avgAgeDays)} · ${pctText(stale7Share)} >7d` }
  if (missingTimestampCount > 0) return { label: 'Mixed', color: T.yellow, sub: `${missingTimestampCount} missing timestamp${missingTimestampCount === 1 ? '' : 's'}` }
  return { label: 'Fresh', color: T.green, sub: ageText(avgAgeDays) }
}

function inputQualityMeta({ liveCoverage, estimatedCount, stale7Share, stale21Share, missingTimestampCount, dataQuality }) {
  const low =
    liveCoverage < 0.8 ||
    dataQuality === 'low' ||
    stale21Share > 0.25 ||
    missingTimestampCount > 20
  const medium =
    liveCoverage < 0.95 ||
    estimatedCount > 0 ||
    dataQuality === 'partial' ||
    stale7Share > 0 ||
    missingTimestampCount > 0

  if (low) return { label: 'Low confidence', color: T.red }
  if (medium) return { label: 'Medium confidence', color: T.yellow }
  return { label: 'High confidence', color: T.green }
}

function MiniMetric({ label, value, sub, color = T.text }) {
  return (
    <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '9px 11px', minWidth: 0 }}>
      <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color, fontFamily: T.mono, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SourceChip({ live }) {
  return live ? (
    <span title="Live JustTCG market price" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
      LIVE
    </span>
  ) : (
    <span title="Model-estimated price included in approximate EV" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)', color: T.yellow, borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
      EST
    </span>
  )
}

function TopCardIdentity({ card, mobile = false }) {
  return (
    <div style={{ display: 'flex', alignItems: mobile ? 'flex-start' : 'center', gap: mobile ? 10 : 8, minWidth: 0 }}>
      {card.image
        ? <CardImage src={card.image} cardCode={card.cardCode} alt={card.name} width={mobile ? 38 : 28} height={mobile ? 54 : 40} radius={2} />
        : <span style={{ fontSize: mobile ? 22 : 18, flexShrink: 0 }}>{card.icon}</span>
      }
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: mobile ? 13 : 12,
          fontWeight: 700,
          color: T.text,
          overflow: mobile ? 'visible' : 'hidden',
          textOverflow: mobile ? 'clip' : 'ellipsis',
          whiteSpace: mobile ? 'normal' : 'nowrap',
          lineHeight: 1.25,
        }}>
          {card.name}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
          <RarityBadge rarity={card.rarity} color={card.rarityColor} />
          <span style={{ fontSize: 10, color: T.dim, fontFamily: T.mono }}>{card.cardCode}</span>
          <SourceChip live={card.hasLivePrice} />
        </div>
      </div>
    </div>
  )
}

function MobileTopCard({ card, index }) {
  const metrics = [
    { label: 'Price', value: `$${card.marketPrice.toFixed(2)}`, color: T.text },
    { label: 'Copies/Box', value: `${card.boxCopies.toFixed(2)}x`, color: T.dim },
    { label: 'Packs to Hit', value: card.packsToHit < 1000 ? `~${Math.round(card.packsToHit)}` : '—', color: T.dim },
    { label: 'Box EV', value: `$${card.boxEV.toFixed(2)}`, color: card.boxEV >= 1 ? T.orange : card.boxEV >= 0.1 ? T.text : T.dim },
  ]

  return (
    <div style={{
      padding: 12,
      borderBottom: `1px solid ${T.border}`,
      background: index < 5 ? 'rgba(249,115,22,0.04)' : 'transparent',
    }}>
      <TopCardIdentity card={card} mobile />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
        {metrics.map(metric => (
          <div key={metric.label} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 9px', minWidth: 0 }}>
            <div style={{ fontSize: 9, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              {metric.label}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color: metric.color, overflowWrap: 'anywhere' }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BoxEV({ cards }) {
  const [setCode, setSetCode] = useState('FB01')
  const [boxCost, setBoxCost] = useState(80)
  const isMobile = useIsMobile()
  const isNarrowLayout = useIsMobile(1120)

  const result = useMemo(() => {
    const setCards = cards.filter(c => c.set === setCode)
    const liveCards = setCards.filter(c => c.hasLivePrice)
    const liveCount = liveCards.length
    const estimatedCount = setCards.length - liveCount
    const liveCoverage = setCards.length ? liveCount / setCards.length : 0

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
    const top3  = cardRows.slice(0, 3)
    const top10 = cardRows.slice(0, 10)
    const top5Cost   = +top5.reduce((s, c) => s + c.marketPrice, 0).toFixed(2)
    const top10Cost  = +top10.reduce((s, c) => s + c.marketPrice, 0).toFixed(2)
    const top3EVShare  = evPerBox > 0 ? top3.reduce((s, c) => s + c.boxEV, 0) / evPerBox * 100 : 0
    const top5EVShare  = evPerBox > 0 ? top5.reduce((s, c) => s + c.boxEV, 0) / evPerBox * 100 : 0
    const top10EVShare = evPerBox > 0 ? top10.reduce((s, c) => s + c.boxEV, 0) / evPerBox * 100 : 0

    // ── Input confidence metadata ─────────────────────────────────────────────
    const now = Date.now()
    const validTimestamps = liveCards
      .map(c => timestampMs(c.priceTimestamp, now))
      .filter(Boolean)
    const ageDays = validTimestamps.map(ts => (now - ts) / DAY_MS)
    const avgFreshnessDays = ageDays.length ? ageDays.reduce((s, d) => s + d, 0) / ageDays.length : null
    const stale7Share = liveCount ? ageDays.filter(d => d > 7).length / liveCount : 0
    const stale21Share = liveCount ? ageDays.filter(d => d > 21).length / liveCount : 0
    const missingTimestampCount = liveCount - validTimestamps.length
    const freshness = freshnessMeta(avgFreshnessDays, stale7Share, stale21Share, missingTimestampCount, liveCount)
    const inputQuality = inputQualityMeta({
      liveCoverage,
      estimatedCount,
      stale7Share,
      stale21Share,
      missingTimestampCount,
      dataQuality,
    })

    return {
      setCards, cardRows, evPerBox, evPerPack, roi, rarityRows,
      top3EVShare, top5Cost, top10Cost, top5EVShare, top10EVShare,
      verifiedCount, distinctRars, dataQuality,
      liveCount, estimatedCount, liveCoverage,
      stale7Share, stale21Share, freshness, inputQuality,
    }
  }, [cards, setCode, boxCost])

  const {
    cardRows, evPerBox, evPerPack, roi, rarityRows,
    top3EVShare, top5Cost, top10Cost, top5EVShare, top10EVShare,
    verifiedCount, distinctRars, dataQuality,
    liveCount, estimatedCount, liveCoverage,
    stale7Share, stale21Share, freshness, inputQuality,
  } = result

  const nearBreakEven = Math.abs(roi) < 5
  const roiColor = nearBreakEven ? T.yellow : roi >= 0 ? T.green : T.red
  const verdict  = nearBreakEven ? 'Near break-even' : roi >= 0 ? 'Model leans open' : 'Model leans singles'
  const verdictColor = nearBreakEven ? T.yellow : roi >= 0 ? T.green : T.orange

  return (
    <div style={{ height: isMobile ? 'auto' : 'calc(100vh - 136px)', overflowY: 'auto', paddingBottom: 32 }}>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...INP, cursor: 'pointer', minWidth: isNarrowLayout ? 0 : 230, flex: isNarrowLayout ? '1 1 100%' : '0 0 auto' }} value={setCode} onChange={e => setSetCode(e.target.value)}>
          {SETS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
            fontSize: 11, padding: '4px 10px', borderRadius: 5, lineHeight: 1.45, maxWidth: '100%',
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

      {/* ── Assumptions and input confidence ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginBottom: 14 }}>
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Approximate assumptions
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>
            Uses simplified rarity pull assumptions, {PACKS_PER_BOX} packs per box, {CARDS_PER_PACK} cards per pack,
            current card prices, and model-estimated prices when live JustTCG prices are missing. Variant-specific
            odds, fees, taxes, shipping, liquidity, and sealed variance are not modeled.
          </div>
        </div>

        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Input quality
            </div>
            <span style={{
              background: `${inputQuality.color}22`, border: `1px solid ${inputQuality.color}66`,
              color: inputQuality.color, borderRadius: 6, padding: '3px 8px',
              fontSize: 10, fontWeight: 800, fontFamily: T.mono, whiteSpace: 'nowrap',
            }}>
              {inputQuality.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8 }}>
            <MiniMetric label="Live prices" value={pctText(liveCoverage)} sub={`${liveCount}/${result.setCards.length}`} color={liveCoverage >= 0.95 ? T.green : liveCoverage >= 0.8 ? T.yellow : T.red} />
            <MiniMetric label="Estimates" value={estimatedCount} sub="included" color={estimatedCount > 0 ? T.yellow : T.green} />
            <MiniMetric label="Freshness" value={freshness.label} sub={freshness.sub} color={freshness.color} />
            <MiniMetric label=">7d stale" value={pctText(stale7Share)} sub="of live" color={stale7Share > 0 ? T.yellow : T.green} />
            <MiniMetric label=">21d stale" value={pctText(stale21Share)} sub="of live" color={stale21Share > 0 ? T.red : T.green} />
            <MiniMetric label="Rarity data" value={dataQuality} sub={`${distinctRars} rarities`} color={dataQuality === 'good' ? T.green : dataQuality === 'partial' ? T.yellow : T.red} />
          </div>
        </div>
      </div>

      {top3EVShare >= CHASE_EV_WARN && (
        <div style={{
          marginBottom: 14, background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.28)', borderRadius: 8,
          padding: '10px 14px', fontSize: 12, color: T.orange, lineHeight: 1.6,
        }}>
          Chase-driven EV: the top 3 cards contribute {top3EVShare.toFixed(0)}% of modeled box EV. Actual outcomes may vary heavily if those cards are missed or their prices move.
        </div>
      )}

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Stat label="Approx. EV per Pack" value={`$${evPerPack.toFixed(2)}`} sub={`of ${CARDS_PER_PACK} cards`} />
        <Stat label="Approx. EV per Box"  value={`$${evPerBox.toFixed(2)}`}  sub={`${PACKS_PER_BOX} packs`} />
        <Stat label="Model ROI"           value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`} sub={`at $${boxCost} box price`} color={roiColor} />
        <Stat label="Model Break-even"    value={`$${evPerBox.toFixed(0)}`}  sub="box price where model is even" color={T.orange} highlight />
        <Stat
          label="Model Verdict"
          value={verdict}
          sub={nearBreakEven ? `within ${Math.abs(roi).toFixed(1)}% at this price` : roi >= 0 ? `$${(evPerBox - boxCost).toFixed(2)} modeled edge before costs` : `$${(boxCost - evPerBox).toFixed(2)} below box price before costs`}
          color={verdictColor}
        />
      </div>

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrowLayout ? '1fr' : '320px minmax(0, 1fr)', gap: 14 }}>

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

          {/* Singles vs open */}
          <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Singles vs Open Box
            </div>

            {[
              {
                label: 'Top 5 singles',
                cost:  top5Cost,
                share: top5EVShare,
                desc:  'direct purchase',
              },
              {
                label: 'Top 10 singles',
                cost:  top10Cost,
                share: top10EVShare,
                desc:  'direct purchase',
              },
              {
                label: `Open a box ($${boxCost})`,
                cost:  boxCost,
                share: 100,
                desc:  'modeled outcome',
                isBox: true,
              },
            ].map(({ label, cost, share, desc, isBox }) => (
              <div key={label} style={{ display: 'flex', flexDirection: isNarrowLayout ? 'column' : 'row', justifyContent: 'space-between', alignItems: isNarrowLayout ? 'stretch' : 'flex-start', gap: isNarrowLayout ? 6 : 12, padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: isBox ? 700 : 400 }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>
                    {share.toFixed(0)}% of box EV · {desc}
                  </div>
                </div>
                <div style={{ textAlign: isNarrowLayout ? 'left' : 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: T.text }}>${cost.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                    ${(cost / share * 100).toFixed(2)} / 1% EV
                  </div>
                </div>
              </div>
            ))}

            {/* Verdict summary */}
            <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: `${verdictColor}14`, border: `1px solid ${verdictColor}44` }}>
              <div style={{ fontSize: 11, color: verdictColor, lineHeight: 1.6 }}>
                {nearBreakEven
                  ? `Model is near break-even at $${boxCost}. Small price or input changes could flip the conclusion.`
                  : roi >= 0
                    ? `Model leans open at $${boxCost}. The modeled edge is ~$${(evPerBox - boxCost).toFixed(2)} before fees, taxes, shipping, liquidity, and variance.`
                    : `Model leans singles at $${boxCost}. Top 5 singles ($${top5Cost.toFixed(2)}) capture ${top5EVShare.toFixed(0)}% of modeled box EV; opening remains variance-heavy.`
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: top cards by box EV ────────────────────────────── */}
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: isNarrowLayout ? 'flex-start' : 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Top Cards by Box EV
            </span>
            <span style={{ fontSize: 11, color: T.dim, lineHeight: 1.4 }}>
              expected value from one full box
            </span>
          </div>

          {/* Table header */}
          {!isNarrowLayout && (
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
          )}

          {/* Card rows */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {cardRows.slice(0, 40).map((card, i) => (
              isNarrowLayout ? (
                <MobileTopCard key={card.id} card={card} index={i} />
              ) : (
                <div
                  key={card.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 0.65fr 0.75fr 0.75fr 0.75fr',
                    gap: 8, padding: '8px 14px', alignItems: 'center',
                    borderBottom: `1px solid ${T.border}`,
                    background: i < 5 ? 'rgba(249,115,22,0.04)' : 'transparent',
                  }}
                >
                  <TopCardIdentity card={card} />

                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.text }}>
                    ${card.marketPrice.toFixed(2)}
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.dim }}>
                    {card.boxCopies.toFixed(2)}x
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.dim }}>
                    {card.packsToHit < 1000 ? `~${Math.round(card.packsToHit)}` : '—'}
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: card.boxEV >= 1 ? T.orange : card.boxEV >= 0.1 ? T.text : T.dim }}>
                    ${card.boxEV.toFixed(2)}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
