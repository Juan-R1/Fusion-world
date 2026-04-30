# FusionMetrics

FusionMetrics is a Dragon Ball Super: Fusion World TCG market analytics dashboard built around live price provenance and conservative model labeling.

## What It Does

FusionMetrics helps compare cards and sets across FB01-FB09 using current JustTCG market prices, model-derived estimates where live prices are missing, and real 30-day JustTCG price history.

## Current Features

- **Value Scanner:** filter, sort, and inspect cards by market price, model price, delta, demand heuristic, and supply-saturation heuristic.
- **Pricing Model:** visualize modeled price expectations against live market prices.
- **Market Dynamics:** inspect card-level demand/supply heuristics and set-level live value, coverage, freshness, and Chase Dependency concentration risk.
- **Box EV:** approximate open-vs-singles comparison based on simplified rarity and pack assumptions.
- **Watchlist:** local browser watchlist for tracked cards.
- **Methodology:** in-app explanation of data sources, estimates, history states, and model limits.
- **Real 30d history:** `CardDetail` lazy-loads real JustTCG history from `/priceHistory30d.json`.
- **Provenance footer:** shows refresh metadata from `/priceUpdateLog.json`.
- **Per-card freshness:** shows each live card's JustTCG price timestamp.

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

## Current Limitations

- JustTCG free-tier quota limits make full refreshes expensive; rotation is the default update strategy.
- Image coverage is incomplete.
- Box EV is approximate and depends on simplified pull-rate and set-composition assumptions.
- There are no user accounts, alerts, or cloud-synced watchlists yet.
- Cross-source pricing, eBay sold comps, and long-term history archives are future work, not current production inputs.
