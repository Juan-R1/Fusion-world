import { T } from '../theme.js'

const sections = [
  {
    title: 'Price Sources',
    items: [
      'Current live prices come from JustTCG market data. JustTCG is currently the only live source; FusionMetrics does not yet cross-check against TCGplayer, eBay sold comps, or other marketplaces.',
      'Card metadata (names, rarities, colors, traits) comes from Bandai\'s official Fusion World card list.',
      'Estimated prices are model-derived fallbacks for cards without a live JustTCG price.',
      'Estimated cards remain visible, but they are excluded from undervalued and overvalued rankings.',
    ],
  },
  {
    title: 'Freshness',
    items: [
      'Each live card carries its own JustTCG price timestamp.',
      'The refresh cycle is three weeks: groups A (FB01–FB03), B (FB04–FB06), and C (FB07–FB09) each refresh on a rolling schedule.',
      'The refresh pipeline uses set rotation, so some sets update sooner than others.',
      'Carried-forward data preserves the last known-good price until that set refreshes again.',
    ],
  },
  {
    title: 'Price History',
    items: [
      '30d history is real JustTCG history loaded from /priceHistory30d.json when CardDetail opens.',
      '"Price history unavailable" means the history file could not be loaded.',
      '"Not enough price history" means the file loaded, but that card has too few usable points.',
    ],
  },
  {
    title: 'Pricing Model',
    items: [
      'When a card lacks a live JustTCG price, FusionMetrics uses a model estimate based on the card\'s rarity and a character-popularity score.',
      'The model is a rarity-stratified regression calibrated against ~1,156 real prices. R² ≈ 0.32 — about two-thirds of per-card variance is unexplained.',
      'The Uncommon (UC) rarity baseline is smoothed upward because the natural UC sample was noisy and produced a lower price than Common.',
      'The Special Rare (SPR) baseline is extrapolated because no live SPR samples were available; SPR predictions are the least trustworthy.',
      'Estimated cards therefore have a meaningful confidence floor; that is why they are excluded from undervalued / overvalued rankings.',
      '"Delta" on every card is calculated as (Market Price − Model Price) ÷ Model Price × 100. Negative deltas mean the live price is below the model; positive means above.',
    ],
  },
  {
    title: 'Set-Level Analytics',
    items: [
      'Set live value is calculated from live-priced cards only; estimated cards are excluded.',
      'Chase Dependency is a concentration-risk metric based on top 1, top 3, and top 10 live-priced value share.',
      'A higher Chase Dependency means set value depends more on a few chase cards; it is not an investment rating.',
      'Set freshness reflects rotation and carried-forward prices, which remain visible with their timestamps.',
    ],
  },
  {
    title: 'Model Limits',
    items: [
      'Character, demand, supply, and desirability metrics are model heuristics.',
      'Demand and supply scores are not observed market time series.',
      'Box EV is approximate and may include model-estimated prices when live prices are missing.',
      'Box EV does not model variant-specific odds, fees, taxes, shipping, liquidity, or sealed-product variance.',
    ],
  },
]

function InfoSection({ title, items }) {
  return (
    <section style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 14, color: T.text, fontFamily: T.display }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <p key={item} style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
            {item}
          </p>
        ))}
      </div>
    </section>
  )
}

export default function Methodology({ cards = [] }) {
  const liveCount = cards.filter(card => card.hasLivePrice).length
  const facts = [
    { label: 'Price source', value: 'JustTCG' },
    { label: 'Card scope', value: 'FB01-FB09' },
    { label: 'Live prices', value: `${liveCount.toLocaleString()} / ${cards.length.toLocaleString()}` },
    { label: 'History', value: 'Real 30d data' },
  ]
  const coverageSection = {
    title: 'Coverage',
    items: [
      `FusionMetrics covers ${liveCount.toLocaleString()} live-priced cards out of ${cards.length.toLocaleString()} total. The pipeline refuses to publish a refresh that drops below 1,121 live prices, to prevent silent coverage degradation.`,
      'Cards without a live price still appear in the dashboard with model-estimated values, clearly labeled.',
    ],
  }
  const visibleSections = sections.flatMap(section =>
    section.title === 'Pricing Model' ? [section, coverageSection] : [section]
  )

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: 32 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: T.orange, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Methodology & Data Sources
        </div>
        <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.25, color: T.text, fontFamily: T.display }}>
          How FusionMetrics reads the market
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: 760 }}>
          FusionMetrics is built to separate live market data from model estimates. The dashboard is a research tool, not financial advice.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
        {facts.map(({ label, value }) => (
          <div key={label} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </div>
            <div style={{ fontSize: 15, color: T.text, fontFamily: T.mono, fontWeight: 700 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {visibleSections.map(section => (
          <InfoSection key={section.title} {...section} />
        ))}
      </div>

      <section style={{ marginTop: 14, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 8, padding: 18 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 14, color: T.orange, fontFamily: T.display }}>
          External spot check
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
          A 10-card public market spot check found 9 of 10 JustTCG prices directionally aligned with external sources. One card was unclear because public sources split or mix base, promo, reprint, and alternate-art variants.
        </p>
      </section>

      <section style={{ marginTop: 14, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
          Not financial advice. FusionMetrics is a research tool. Prices are observations from a single source (JustTCG) plus a transparent model. Treat all values as approximate and never as a buy or sell recommendation.
        </p>
      </section>
    </div>
  )
}
