# FusionMetrics Screenshot Plan

Use this plan after running:

```bash
node scripts/verify-data.js
npm run build
npm run dev
```

Capture screenshots from a clean browser session unless the shot explicitly
requires local demo Watchlist data.

## Required Shots

| # | Title | Viewport | Tab / page | Setup needed | Must be visible | Suggested filename | Why it matters |
|---|-------|----------|------------|--------------|-----------------|--------------------|----------------|
| 1 | Desktop Value Scanner + CardDetail | Desktop, roughly 1440 px wide | Value Scanner | Select a LIVE card such as `FB03-009` | Table, selected CardDetail, `Source: JustTCG`, per-card freshness, 30-day history | `01-desktop-value-scanner-card-detail.png` | Shows the core card analysis loop and trust labels. |
| 2 | Narrow Value Scanner | 390-430 px wide | Value Scanner | No seeded data required | Summary cards, search, filters, readable rows, LIVE chips | `02-mobile-value-scanner.png` | Proves the main scanner works in a narrow portfolio-demo viewport. |
| 3 | Desktop Market Dynamics + Set Analytics | Desktop, roughly 1440 px wide | Market Dynamics | Scroll until Set-Level Analytics is visible | Scatterplot, set cards, live coverage, freshness, Chase Dependency | `03-desktop-market-dynamics-set-analytics.png` | Shows the first honest set-level analytics expansion. |
| 4 | Desktop Box EV | Desktop, roughly 1440 px wide | Box EV | Use default or FB01 selected set | Assumptions, input quality, metric cards, rarity EV, Top Cards by Box EV | `04-desktop-box-ev.png` | Shows EV utility while keeping assumptions visible. |
| 5 | Narrow Box EV Top Cards | 390-430 px wide | Box EV | Scroll to Top Cards by Box EV | Stacked full-width top-card rows, LIVE/EST chips, price, copies/box, packs to hit, box EV | `05-mobile-box-ev-top-cards.png` | Proves the fixed responsive layout no longer squeezes Top Cards. |
| 6 | Watchlist v2 Demo Positions | Desktop or narrow, whichever reads better | Watchlist | Seed local browser data from `docs/watchlist-demo-data.md`, then refresh | Summary cards, quantity, entry price, current value, Unrealized P/L, LIVE/EST chips, freshness | `06-watchlist-demo-positions.png` | Shows actual local portfolio utility without accounts or a database. |
| 7 | Methodology & Data Sources | Desktop, roughly 1440 px wide | Methodology | No setup | Header, Price Sources, Freshness, Price History, Model Limits, not-financial-advice copy | `07-methodology-data-sources.png` | Shows the trust model in user-facing language. |
| 8 | Provenance Modal | Desktop or narrow | Any tab footer | Click the footer/status chip | Refresh history modal with mode, group, sets, fetched, merged, timestamp | `08-provenance-refresh-history.png` | Shows the app can explain where the current data came from. |

## Optional Shots

| Title | Viewport | Tab / page | Suggested filename | Why it matters |
|-------|----------|------------|--------------------|----------------|
| Pricing Model | Desktop | Pricing Model | `09-desktop-pricing-model.png` | Shows the model visualization and predictor. |
| Watchlist empty state | Desktop or narrow | Watchlist after reset | `10-watchlist-empty-state.png` | Shows local-first empty-state clarity. |
| Mobile Methodology | 390-430 px wide | Methodology | `11-mobile-methodology.png` | Shows trust copy remains readable on narrow screens. |

## Framing Notes

- Do not crop out trust labels, provenance, freshness, or methodology caveats.
- Avoid screenshots that imply guaranteed profit or official affiliation.
- For portfolio use, pair each screenshot with one sentence about the user
  problem and one sentence about the trust constraint.
- Reset Watchlist demo data after capture with the instructions in
  `docs/watchlist-demo-data.md`.
