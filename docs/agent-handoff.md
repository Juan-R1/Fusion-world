# FusionMetrics Agent Handoff

## Stable checkpoint

FusionMetrics has a trust-complete MVP foundation. Real JustTCG prices, real
JustTCG 30d history, provenance, per-card freshness, split-shape verification,
and Methodology copy are all in place.

## Active data contract

- `src/livePrices.json`: current live price data only.
- `public/priceHistory30d.json`: real JustTCG 30d history.
- `public/priceUpdateLog.json`: refresh metadata for provenance UI.
- `CardDetail`: lazy-loads `/priceHistory30d.json`.
- `scripts/verify-data.js`: requires split shape and 9 invariants.
- `scripts/accumulate-prices.js`: deleted.
- `src/priceHistory.json`: deleted.

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

1. Set-level analytics upgrade: Set Detail / Set Rankings, chase dependency,
   set value summaries, live-price coverage per set, freshness warnings.
2. Box EV methodology tightening: clearer assumptions and pull-rate caveats.
3. Watchlist v2 planning: quantity, entry price, local P/L, CSV export later.
4. Image coverage strategy before touching generated data.
5. README / public launch package with screenshots, setup, caveats, and
   portfolio narrative.

Later only: eBay sold comps, manipulation / outlier detection, long-term
history archive, paid API tier, accounts, alerts.

## Division of labor

- **Claude Code:** higher-context implementation and multi-file product work.
- **Codex:** audits, cleanup, QA, narrow code changes, and validation.
- **ChatGPT:** strategy, copy, prompts, product review, and roadmap framing.

Use one small task, one file cluster, one commit. Stop after each task and
report validation.
