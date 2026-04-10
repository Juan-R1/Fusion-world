import { useState }    from 'react'
import { T }           from './theme.js'
import { CARDS }       from './data.js'
import ValueScanner    from './tabs/ValueScanner.jsx'
import PricingModel    from './tabs/PricingModel.jsx'
import MarketDynamics  from './tabs/MarketDynamics.jsx'

const TABS = [
  { id: 'scanner',  label: '🔍 Value Scanner'  },
  { id: 'model',    label: '📈 Pricing Model'   },
  { id: 'dynamics', label: '🌊 Market Dynamics' },
]

export default function App() {
  const [tab, setTab] = useState('scanner')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.display }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
        <div
          style={{
            maxWidth: 1400, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.orange, fontFamily: T.display }}>
              Fusion
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.display, marginLeft: -8 }}>
              Metrics
            </span>
            <span
              style={{
                fontSize: 11, color: T.dim,
                borderLeft: `1px solid ${T.border}`, paddingLeft: 12, marginLeft: 4,
              }}
            >
              Dragon Ball Fusion World · Market Analytics
            </span>
          </div>
          <div style={{ fontSize: 11, color: T.dim, fontFamily: T.mono }}>
            {CARDS.length} cards · FB01–FB09 · Simulated data
          </div>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 20px', fontSize: 14,
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? T.orange : T.muted,
                borderBottom: tab === t.id ? `2px solid ${T.orange}` : '2px solid transparent',
                fontFamily: T.display, transition: 'color .15s', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 32px' }}>
        {tab === 'scanner'  && <ValueScanner   cards={CARDS} />}
        {tab === 'model'    && <PricingModel   cards={CARDS} />}
        {tab === 'dynamics' && <MarketDynamics cards={CARDS} />}
      </main>
    </div>
  )
}
