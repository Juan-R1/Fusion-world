# FusionMetrics

FusionMetrics is a Dragon Ball Super: Fusion World TCG market analytics dashboard built around live price provenance and conservative model labeling.

It is designed as a portfolio/public-demo project that shows how to build an analytics UI without hiding where the data comes from or overstating what the model knows.

## What It Does

FusionMetrics helps compare cards and sets across FB01-FB09 using current JustTCG market prices, model-derived estimates where live prices are missing, and real 30-day JustTCG price history.

## Current Features

- **Value Scanner:** filter, sort, and inspect cards by market price, model price, delta, demand heuristic, and supply-saturation heuristic.
- **Pricing Model:** visualize modeled price expectations against live market prices.
- **Market Dynamics:** inspect card-level demand/supply heuristics and set-level live value, coverage, freshness, and Chase Dependency concentration risk.
- **Box EV:** approximate open-vs-singles comparison based on simplified rarity and pack assumptions.
- **Watchlist:** local browser portfolio tracker with quantity, entry price, current value, cautious Unrealized P/L, LIVE/EST chips, and freshness labels.
- **Methodology:** in-app explanation of data sources, estimates, history states, and model limits.
- **Real 30d history:** `CardDetail` lazy-loads real JustTCG history from `/priceHistory30d.json`.
- **Provenance footer:** shows refresh metadata from `/priceUpdateLog.json`.
- **Per-card freshness:** shows each live card's JustTCG price timestamp.

## Screenshots

Screenshots are not committed yet. Before a public portfolio post, capture:

- Value Scanner with CardDetail open.
- Market Dynamics Set-Level Analytics.
- Box EV on desktop and mobile.
- Watchlist v2 with sample local positions.
- Methodology & Data Sources.

See `docs/screenshot-plan.md` for the full capture list and framing notes.

## Data And Trust Notes

- Current live prices come from JustTCG.
- Price updates use quota-safe set rotation, so some sets refresh before others.
- `src/livePrices.json` contains current prices only; 30-day history is split into `public/priceHistory30d.json`.
- Cards without live JustTCG prices stay visible with model-derived estimates.
- Estimated cards are excluded from undervalued and overvalued rankings.
- Character, demand, supply, desirability, and Box EV outputs are model heuristics, not observed market guarantees.
- FusionMetrics is a research tool, not financial advice.

## Tech Stack

- React
- Vite
- JavaScript
- JSON data files
- GitHub Actions
- Vercel

## Local Setup

```bash
npm install
npm run dev
npm run build
node scripts/verify-data.js
```

## Validation

Before sharing a demo or making a code commit, run:

```bash
node scripts/verify-data.js
npm run build
```

`verify-data` should report 1,258 cards, 1,156 live prices, split shape required, and 9 invariants passed.

## Current Limitations

- JustTCG free-tier quota limits make full refreshes expensive; rotation is the default update strategy.
- Image coverage is incomplete.
- Box EV is approximate and depends on simplified pull-rate and set-composition assumptions.
- There are no user accounts, alerts, or cloud-synced watchlists yet.
- Cross-source pricing, eBay sold comps, and long-term history archives are future work, not current production inputs.

## Portfolio Notes

- `docs/portfolio-case-study.md` summarizes the product problem, technical architecture, trust model, and roadmap.
- `docs/demo-script.md` provides 60-second and 3-minute walkthroughs.
- `docs/public-beta-backlog.md` tracks remaining public-beta and monetization gaps.
