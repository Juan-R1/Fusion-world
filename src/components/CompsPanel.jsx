import { useEffect, useMemo, useState } from 'react'
import { T } from '../theme.js'
import { loadEbayComps } from '../lib/ebayComps.js'

const fmtMoney = value => Number.isFinite(value) ? `$${value.toFixed(2)}` : '--'
const fmtDate = value => typeof value === 'string' && value ? value : '--'
const label = value => value ? String(value) : 'unknown'

const isEligible = row =>
  row &&
  row.outlierFlag !== true &&
  row.itemType !== 'lot' &&
  row.itemType !== 'bundle' &&
  row.variantMatch !== 'excluded' &&
  row.confidence !== 'excluded'

const withinDays = (row, days) => {
  const soldAt = Date.parse(row?.soldDate)
  if (!Number.isFinite(soldAt)) return false
  const ageMs = Date.now() - soldAt
  return ageMs >= 0 && ageMs <= days * 86_400_000
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function quantile(sorted, q) {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

function aggregates(rows) {
  const prices = rows
    .map(row => Number(row.totalPrice ?? row.soldPrice))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!prices.length) return null

  const trim = prices.length >= 5 ? Math.floor(prices.length * 0.1) : 0
  const trimmed = trim > 0 ? prices.slice(trim, prices.length - trim) : prices
  const q1 = quantile(prices, 0.25)
  const q3 = quantile(prices, 0.75)

  return {
    count: prices.length,
    median: median(prices),
    trimmedMean: trimmed.reduce((sum, price) => sum + price, 0) / trimmed.length,
    iqr: Number.isFinite(q1) && Number.isFinite(q3) ? q3 - q1 : null,
  }
}

function Chip({ children, tone = 'muted' }) {
  const style = tone === 'ambiguous'
    ? { color: T.yellow, background: `${T.yellow}18`, border: `${T.yellow}44` }
    : tone === 'confidence'
      ? { color: T.green, background: `${T.green}18`, border: `${T.green}44` }
      : { color: T.dim, background: T.s2, border: T.border2 }

  return (
    <span
      style={{
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        padding: '2px 6px',
        fontSize: 9,
        lineHeight: 1.35,
        fontFamily: T.mono,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function Summary({ stats, eligible30d }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
      {[
        ['Median', fmtMoney(stats?.median)],
        ['Trimmed mean', fmtMoney(stats?.trimmedMean)],
        ['Count', stats?.count ?? 0],
        ['IQR', fmtMoney(stats?.iqr)],
      ].map(([name, value]) => (
        <div key={name} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 9, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{name}</div>
          <div style={{ fontSize: 13, color: T.text, fontFamily: T.mono, fontWeight: 700, marginTop: 3 }}>{value}</div>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', fontSize: 10, color: T.dim, lineHeight: 1.5 }}>
        {eligible30d >= 10
          ? `Manipulation-risk review available from ${eligible30d} eligible 30d comps.`
          : 'Insufficient eligible comps for manipulation-risk labeling.'}
      </div>
    </div>
  )
}

function Rows({ rows }) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Date', 'Price', 'Variant match', 'Confidence', 'Grade', 'Source'].map(head => (
              <th
                key={head}
                style={{
                  textAlign: head === 'Price' ? 'right' : 'left',
                  color: T.dim,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 4px',
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.listingId || `${row.soldDate}-${row.totalPrice}-${row.title}`}>
              <td style={cellStyle()}>{fmtDate(row.soldDate)}</td>
              <td style={cellStyle('right')}>{fmtMoney(Number(row.totalPrice ?? row.soldPrice))}</td>
              <td style={cellStyle()}>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>{label(row.variantMatch)}</span>
                  {row.variantMatch === 'ambiguous' && <Chip tone="ambiguous">ambiguous</Chip>}
                </div>
              </td>
              <td style={cellStyle()}><Chip tone={row.confidence === 'high' ? 'confidence' : 'muted'}>{label(row.confidence)}</Chip></td>
              <td style={cellStyle()}>{row.rawOrGraded === 'graded' ? `${label(row.gradeCompany)} ${label(row.grade)}` : 'raw'}</td>
              <td style={cellStyle()}>
                {row.sourceUrl ? (
                  <a href={row.sourceUrl} target="_blank" rel="noreferrer" style={{ color: T.orange, textDecoration: 'none', fontSize: 11 }}>
                    source
                  </a>
                ) : (
                  <span style={{ color: T.dim }}>--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cellStyle(align = 'left') {
  return {
    textAlign: align,
    color: T.muted,
    fontSize: 11,
    padding: '8px 4px',
    borderBottom: `1px solid ${T.border}`,
    verticalAlign: 'top',
  }
}

function CompSection({ title, rows }) {
  const eligibleRows = rows.filter(isEligible)
  const eligible30d = eligibleRows.filter(row => withinDays(row, 30)).length
  const stats = aggregates(eligibleRows)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 12, color: T.text, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 10, color: T.dim, fontFamily: T.mono }}>
          {eligibleRows.length} eligible / {rows.length} reviewed
        </div>
      </div>
      {eligibleRows.length > 0 ? <Summary stats={stats} eligible30d={eligible30d} /> : (
        <div style={{ color: T.dim, fontSize: 11, lineHeight: 1.5 }}>
          No eligible reviewed rows for this subsection.
        </div>
      )}
      {rows.length > 0 && <Rows rows={rows} />}
    </div>
  )
}

export default function CompsPanel({ cardCode }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadEbayComps()
      .then(data => {
        if (cancelled) return
        const nextRows = data.byCardCode && Array.isArray(data.byCardCode[cardCode])
          ? data.byCardCode[cardCode]
          : []
        setRows(nextRows)
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
      })
    return () => { cancelled = true }
  }, [cardCode])

  const grouped = useMemo(() => {
    const list = Array.isArray(rows) ? rows : []
    return {
      raw: list.filter(row => row.rawOrGraded === 'raw'),
      graded: list.filter(row => row.rawOrGraded === 'graded'),
    }
  }, [rows])

  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: T.dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        eBay sold comps
      </div>
      <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
        <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 12 }}>
          Reviewed comps are historical observations. Raw and graded rows stay separate; variant ambiguity and excluded rows remain visible.
        </div>
        {rows === null && (
          <div style={{ color: T.dim, fontSize: 11, fontFamily: T.mono }}>Loading reviewed comps...</div>
        )}
        {rows !== null && rows.length === 0 && (
          <div style={{ color: T.dim, fontSize: 11, lineHeight: 1.5 }}>
            Awaiting production eBay comps fixture for this card.
          </div>
        )}
        {rows !== null && rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <CompSection title="Raw reviewed comps" rows={grouped.raw} />
            <CompSection title="Graded reviewed comps" rows={grouped.graded} />
          </div>
        )}
      </div>
    </section>
  )
}
