// src/components/ProvenanceFooter.jsx
// Subtle footer chip showing the most recent price-refresh metadata.
// Reads /priceUpdateLog.json once per session (module-scope cache).
// Click → modal listing the last 12 refresh runs.
//
// Trust contract: this component is read-only. It must never block the
// rest of the UI on slow / failed fetches; it just renders a muted
// "Refresh metadata unavailable" pill on failure.

import { useState, useEffect } from 'react'
import { T } from '../theme.js'

// ── Module-scope cache ──────────────────────────────────────────────────────
// Single-flight: tab navigation does not re-fetch.
let cached   = null
let inFlight = null

async function loadPriceUpdateLog() {
  if (cached)   return cached
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const res = await fetch('/priceUpdateLog.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid log shape')
      }
      cached = data
      return cached
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

// ── Time helpers ────────────────────────────────────────────────────────────
function relTime(iso) {
  if (!iso) return 'unknown'
  const ms = Date.now() - Date.parse(iso)
  if (!Number.isFinite(ms) || ms < 0) return 'Just now'
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1)  return 'Just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(ms / 86_400_000)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function fmtRunAt(iso) {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  // Compact UTC: "2026-04-30 00:33Z"
  return new Date(ms).toISOString().replace('T', ' ').replace(/:\d\d\.\d+Z$/, 'Z')
}

// ── Chip + modal ────────────────────────────────────────────────────────────
export default function ProvenanceFooter() {
  const [log,   setLog]   = useState(null)
  const [error, setError] = useState(false)
  const [open,  setOpen]  = useState(false)

  useEffect(() => {
    let cancelled = false
    loadPriceUpdateLog()
      .then(d => { if (!cancelled) setLog(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [])

  // Loading: render nothing the first frame to avoid layout shift. The
  // module-scope cache means this only happens once per session.
  if (!log && !error) return null

  const wrap = {
    display: 'flex', justifyContent: 'center',
    padding: '14px 12px 8px',
    marginTop: 8,
  }

  if (error) {
    return (
      <div style={wrap}>
        <span style={{
          background: T.s1, border: `1px solid ${T.border}`,
          color: T.dim, opacity: 0.6,
          fontSize: 11, fontFamily: T.mono,
          padding: '6px 12px', borderRadius: 14,
        }}>
          Refresh metadata unavailable
        </span>
      </div>
    )
  }

  const text =
    `Prices: ${relTime(log.lastRunAt)} · ` +
    `${log.lastMergedCount ?? '—'} / 1,258 priced · ` +
    `last group: ${log.lastGroup ?? '—'}`

  return (
    <>
      <div style={wrap}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show refresh history"
          title="Show refresh history"
          style={{
            background: T.s1, border: `1px solid ${T.border}`,
            color: T.dim,
            fontSize: 11, fontFamily: T.mono,
            padding: '6px 12px', borderRadius: 14,
            cursor: 'pointer',
            maxWidth: 'min(640px, calc(100vw - 24px))',
            textAlign: 'center', lineHeight: 1.5,
            transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2 }}
          onMouseLeave={e => { e.currentTarget.style.color = T.dim;   e.currentTarget.style.borderColor = T.border  }}
        >
          {text}
        </button>
      </div>

      {open && <RefreshHistoryModal log={log} onClose={() => setOpen(false)} />}
    </>
  )
}

function RefreshHistoryModal({ log, onClose }) {
  const rows = Array.isArray(log.history) ? log.history.slice(0, 12) : []
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.s1, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 20,
          width: '100%', maxWidth: 720, maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.display }}>
            Refresh history
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.s2, border: 'none', color: T.muted,
              cursor: 'pointer', borderRadius: 6, padding: '4px 10px',
              fontSize: 12, fontWeight: 600,
            }}
          >
            ✕ close
          </button>
        </div>

        {rows.length === 0 ? (
          <div style={{ fontSize: 12, color: T.dim }}>
            No refresh history recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: 11, fontFamily: T.mono,
            }}>
              <thead>
                <tr>
                  {['Run at (UTC)', 'Mode', 'Group', 'Sets', 'Fetched', 'Merged'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', color: T.dim,
                      padding: '8px 10px',
                      borderBottom: `1px solid ${T.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.runAt}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', color: T.text, whiteSpace: 'nowrap' }}>{fmtRunAt(row.runAt)}</td>
                    <td style={{ padding: '8px 10px', color: T.muted }}>{row.mode ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: T.muted }}>{row.group ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: T.muted, whiteSpace: 'nowrap' }}>
                      {Array.isArray(row.sets) ? row.sets.join(', ') : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: T.text, textAlign: 'right' }}>{row.fetched ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: T.text, textAlign: 'right' }}>{row.merged ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
