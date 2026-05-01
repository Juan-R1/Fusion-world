# FusionMetrics — Status Snapshot

**Date:** 2026-05-01
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Final MVP polish; portfolio/public-demo preparation

---

## TL;DR

FusionMetrics now has a durable trust foundation and the first honest product
expansion pass. The app uses real JustTCG live prices, real JustTCG 30d
history, visible provenance, per-card freshness, Methodology copy, Set-Level
Analytics, tightened Box EV language, and Watchlist v2 local portfolio fields.
The next work should finish demo QA and public launch packaging.

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
| Set analytics | Market Dynamics includes live value, coverage, freshness, and Chase Dependency |
| Box EV | Approximate assumptions, input quality, and cautious model verdict copy complete |
| Watchlist | Local v2 portfolio fields: quantity, entry price, current value, Unrealized P/L |
| Data verification | `scripts/verify-data.js` requires split shape only |
| Bundle | Roughly 648 kB raw / 95 kB gzip after final MVP UI polish |
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

1. Finish public-demo QA: mobile pass, search smoke, CardDetail history cache,
   Watchlist clear-all, and provenance modal.
2. Capture portfolio screenshots and record a short demo flow.
3. Image coverage strategy: research source and safe pipeline before touching
   generated data.
4. Focused automated UI smoke tests after explicit approval.
5. Later only: CSV export, eBay sold comps, manipulation / outlier detection,
   long-term history archive, paid API tier, accounts, alerts, and AI
   prediction.

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
