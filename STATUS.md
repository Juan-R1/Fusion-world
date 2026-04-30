# FusionMetrics — Status Snapshot

**Date:** 2026-04-30
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Trust-complete MVP foundation; honest product / analytics expansion next

---

## TL;DR

FusionMetrics now has a durable trust foundation. The app uses real JustTCG
live prices, real JustTCG 30d history, visible provenance, per-card freshness,
and a Methodology & Data Sources page. The next work should improve user-facing
analytics without overstating precision.

---

## Stable checkpoint

| Area | Current state |
|------|---------------|
| Card scope | 1,258 cards across FB01–FB09 |
| Live prices | Known-good baseline: 1,156 |
| Coverage guards | Absolute floor 1,121; per-set floor 90% of previous count |
| Price file | `src/livePrices.json` contains current prices only |
| History file | `public/priceHistory30d.json` contains real JustTCG 30d history |
| Refresh metadata | `public/priceUpdateLog.json` powers provenance UI |
| Price history UI | `CardDetail` lazy-loads `/priceHistory30d.json` and caches it |
| Provenance | Footer/status chip and modal complete |
| Per-card freshness | Badge complete, based on each card's live price timestamp |
| Methodology | Methodology & Data Sources tab complete |
| Data verification | `scripts/verify-data.js` requires split shape only |
| Bundle | Roughly 627–631 kB raw after split-history migration |
| External spot-check | 10 cards checked; 9 aligned, 1 unclear due to variant ambiguity |

---

## Data contract

- `src/livePrices.json` is machine-generated current price data only.
- `public/priceHistory30d.json` is machine-generated public 30d JustTCG
  history.
- `public/priceUpdateLog.json` is machine-generated refresh metadata.
- Legacy accumulator output has been retired. Do not recreate it without an
  approved long-term-history design.
- Estimated cards remain visible but are excluded from undervalued and
  overvalued rankings.
- Character, demand, supply, and desirability scores are model heuristics, not
  observed demand time series.

---

## Non-negotiables

- Make FusionMetrics unable to lie by accident.
- Do not add synthetic price history, synthetic market movement, fake trend
  visuals, or RNG pricing noise.
- Do not weaken `scripts/verify-data.js`, the 1,121 coverage guard, or the
  per-set guard.
- Do not manually edit generated JSON data.
- Do not write partial degraded data.
- Assume the JustTCG free tier unless the operator explicitly says otherwise.
- Rotation mode is the default update strategy. Full refresh remains manual
  and quota-risky.

---

## Recommended next sequence

1. Internal docs / skills cleanup.
2. Set-level analytics upgrade: Set Detail or Set Rankings, chase dependency,
   set value summaries, live-price coverage per set, freshness warnings.
3. Box EV methodology tightening: clearer assumptions, pull-rate caveats, less
   fake precision.
4. Watchlist v2 planning: quantity, entry price, local P/L, CSV export later.
5. Image coverage strategy: research source and safe pipeline before touching
   generated data.
6. README / public launch package: screenshots, setup, data caveats, portfolio
   narrative.
7. Later only: eBay sold comps, manipulation / outlier detection, long-term
   history archive, paid API tier, accounts, alerts.

---

## Resume checklist

1. `git checkout claude/dbfw-market-analytics-1qh5D && git pull`
2. Read `AGENTS.md`.
3. Use `.claude/skills/fusionmetrics-pipeline/SKILL.md` for data pipeline
   tasks.
4. Use `.claude/skills/fusionmetrics-qa/SKILL.md` for validation tasks.
5. Use `.claude/skills/fusionmetrics-product/SKILL.md` for product and
   analytics planning.
6. Before code commits, run `npm run build` and `node scripts/verify-data.js`.
