import { useState }     from 'react'
import { T }            from './theme.js'
import { CARDS, HAS_LIVE_PRICES } from './data.js'
import { useWatchlist } from './hooks/useWatchlist.js'
import { useIsMobile }  from './hooks/useIsMobile.js'
import ValueScanner     from './tabs/ValueScanner.jsx'
import PricingModel     from './tabs/PricingModel.jsx'
import MarketDynamics   from './tabs/MarketDynamics.jsx'
import BoxEV            from './tabs/BoxEV.jsx'
import Watchlist        from './tabs/Watchlist.jsx'
import Methodology      from './tabs/Methodology.jsx'
import ProvenanceFooter from './components/ProvenanceFooter.jsx'

const TABS = [
  { id: 'scanner',   label: '🔍 Value Scanner',   short: '🔍 Scanner'  },
  { id: 'model',     label: '📈 Pricing Model',   short: '📈 Model'    },
  { id: 'dynamics',  label: '🌊 Market Dynamics', short: '🌊 Market'   },
  { id: 'boxev',     label: '📦 Box EV',          short: '📦 Box EV'   },
  { id: 'watchlist', label: '⭐ Watchlist',        short: '⭐ Watch'    },
  { id: 'method',    label: '📘 Methodology',     short: '📘 Method'   },
]

export default function App() {
  const [tab, setTab] = useState('scanner')
  const { watchedCodes, toggle, clear } = useWatchlist()
  const isMobile = useIsMobile()

  const sidePad   = isMobile ? 12 : 32
  const mainPad   = isMobile ? '12px 12px 32px' : '20px 32px'
  const tabBtnPad = isMobile ? '12px 14px' : '14px 20px'
  const tabFs     = isMobile ? 13 : 14

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.display }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: `0 ${sidePad}px` }}>
        <div
          style={{
            maxWidth: 1400, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: isMobile ? 52 : 58, gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0 }}>
            <span style={{ fontSize: isMobile ? 18 : 22 }}>⚡</span>
            <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: T.orange, fontFamily: T.display }}>
              Fusion
            </span>
            <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: T.text, fontFamily: T.display, marginLeft: -6 }}>
              Metrics
            </span>
            {!isMobile && (
              <span
                style={{
                  fontSize: 11, color: T.dim,
                  borderLeft: `1px solid ${T.border}`, paddingLeft: 12, marginLeft: 4,
                }}
              >
                Dragon Ball Fusion World · Market Analytics
              </span>
            )}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: isMobile ? 10 : 11, color: T.dim, fontFamily: T.mono,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {isMobile ? `${CARDS.length}` : `${CARDS.length} cards · FB01–FB09`}
            {HAS_LIVE_PRICES
              ? <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>● LIVE</span>
              : <span style={{ color: T.dim }}>· Simulated</span>
            }
          </div>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: `0 ${sidePad}px`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 2, minWidth: 'max-content' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: tabBtnPad, fontSize: tabFs,
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? T.orange : T.muted,
                borderBottom: tab === t.id ? `2px solid ${T.orange}` : '2px solid transparent',
                fontFamily: T.display, transition: 'color .15s', marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? t.short : t.label}
              {t.id === 'watchlist' && watchedCodes.size > 0 && (
                <span style={{
                  background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)',
                  color: '#eab308', borderRadius: 10, padding: '1px 6px',
                  fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', system-ui, sans-serif",
                }}>
                  {watchedCodes.size}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: mainPad }}>
        {tab === 'scanner'   && <ValueScanner   cards={CARDS} watchedCodes={watchedCodes} onToggleWatch={toggle} />}
        {tab === 'model'     && <PricingModel   cards={CARDS} />}
        {tab === 'dynamics'  && <MarketDynamics cards={CARDS} />}
        {tab === 'boxev'     && <BoxEV          cards={CARDS} />}
        {tab === 'watchlist' && <Watchlist      cards={CARDS} watchedCodes={watchedCodes} onToggleWatch={toggle} onClear={clear} />}
        {tab === 'method'    && <Methodology cards={CARDS} />}
        <ProvenanceFooter />
      </main>
    </div>
  )
}
