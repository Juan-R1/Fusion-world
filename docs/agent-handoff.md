# FusionMetrics Agent Handoff

## Stable checkpoint

FusionMetrics has a trust-complete MVP foundation. Real JustTCG prices, real
JustTCG 30d history, provenance, per-card freshness, split-shape verification,
Methodology copy, Set-Level Analytics, tightened Box EV language, and Watchlist
v2 local portfolio fields are all in place.

## Active data contract

- `src/livePrices.json`: current live price data only.
- `public/priceHistory30d.json`: real JustTCG 30d history.
- `public/priceUpdateLog.json`: refresh metadata for provenance UI.
- `CardDetail`: lazy-loads `/priceHistory30d.json`.
- `scripts/verify-data.js`: requires split shape and 9 invariants.
- `scripts/accumulate-prices.js`: deleted.
- `src/priceHistory.json`: deleted.
- `fw-watchlist-v2`: active localStorage key for local-only Watchlist
  positions; `fw-watchlist-v1` is read only for migration.

## What not to do

- Do not reintroduce synthetic price history, synthetic market movement, fake
  trend visuals, or RNG pricing noise.
- Do not weaken `verify-data.js`, the 1,121 coverage guard, or the per-set
  guard.
- Do not manually edit generated data.
- Do not run quota-heavy workflows or full JustTCG refreshes without explicit
  operator approval.
- Do not assume a paid JustTCG tier is active.

## Next recommended tasks

1. Public-demo QA: search/filter browser smoke, CardDetail history cache,
   Watchlist clear-all, and mobile readability.
2. README / public launch package with screenshots, setup, caveats, and
   portfolio narrative.
3. Image coverage strategy before touching generated data.
4. Focused automated UI smoke tests after explicit approval.
5. Watchlist refinements such as CSV export later, still local-only unless
   accounts are approved.

Later only: eBay sold comps, manipulation / outlier detection, long-term
history archive, paid API tier, accounts, alerts, and AI prediction.

## Division of labor

- **Claude Code:** higher-context implementation and multi-file product work.
- **Codex:** audits, cleanup, QA, narrow code changes, and validation.
- **ChatGPT:** strategy, copy, prompts, product review, and roadmap framing.

Useful focused skills now include `fusionmetrics-qa`, `fusionmetrics-product`,
`fusionmetrics-pipeline`, `fusionmetrics-watchlist`,
`fusionmetrics-mobile-ux`, and `fusionmetrics-launch`.

Use one small task, one file cluster, one commit. Stop after each task and
report validation.
