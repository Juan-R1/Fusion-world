---
name: fusionmetrics-pipeline
description: Use when working on FusionMetrics data pipeline, JustTCG updates, price files, GitHub Actions, coverage guards, rotation mode, split price history, or data provenance. Triggers — update-prices, JustTCG, rotation, coverage guard, livePrices.json, priceHistory30d.json, priceUpdateLog.json, weekly cron.
version: 1.1.0
category: Pipeline
triggers:
  - update-prices
  - JustTCG
  - rotation
  - coverage guard
  - merge mode
  - livePrices
  - priceHistory30d
  - priceUpdateLog
  - rate limit
  - quota
---

# FusionMetrics Pipeline

## When to use

Use this skill for any task involving:

- `scripts/update-prices.js` fetch, rotation, merge, rate limits, or guards.
- `scripts/verify-data.js` data invariants.
- `.github/workflows/update-prices.yml` cron or manual dispatch behavior.
- `src/livePrices.json`, `public/priceHistory30d.json`, or
  `public/priceUpdateLog.json`.
- JustTCG quota, failures, stale data, coverage drops, or provenance.

## Current data contract

Split shape is required.

| Path | Purpose | Notes |
|------|---------|-------|
| `src/livePrices.json` | Current JustTCG prices only | bundled into app data |
| `public/priceHistory30d.json` | Real JustTCG 30d history, keyed by cardCode | fetched by `CardDetail` at runtime |
| `public/priceUpdateLog.json` | Refresh metadata | powers provenance footer / modal |

Retired legacy files:

- `scripts/accumulate-prices.js` has been deleted.
- `src/priceHistory.json` has been deleted.
- Do not recreate either without an approved long-term-history design.

## JustTCG quota assumptions

- **Tier:** free unless the operator explicitly says otherwise.
- **Observed limits:** roughly 100 requests/day, 1,000 requests/month, 20
  cards/page.
- **Reset:** 00:00 UTC daily.
- **Full FB01–FB09 refresh:** roughly 67 requests; manual and quota-risky.
- **Rotation refresh:** roughly 21–25 requests per run. This is the default.
- The fetch layer already implements request spacing, typed errors,
  `Retry-After` handling, bounded retries, and hard aborts on quota failure.
  Do not duplicate or bypass it.

## Rotation / merge rules

- **Groups:**
  `A = FB01,FB02,FB03` · `B = FB04,FB05,FB06` · `C = FB07,FB08,FB09`.
- **Group selection:** ISO-week % 3 by default. `UPDATE_SETS` can override
  with an explicit comma list.
- **Modes:** `UPDATE_MODE=rotation` is default. `UPDATE_MODE=full` requires
  explicit operator approval.
- **Merge behavior:** refreshed sets are replaced with newly fetched entries;
  non-refreshed sets carry forward their previous known-good prices and
  timestamps. The active public history map follows the same set partition.
- **Carried-forward data is intentional:** it preserves known-good prices until
  the set refreshes again and must remain visible through freshness/provenance
  UI.

## Coverage guard rules

Do not weaken these.

- Absolute floor: `merged.length >= 1121`.
- Per-set floor: each existing set must stay at or above 90% of its previous
  live-price count.
- The guard runs against merged output, not just freshly fetched cards.
- On failure: write nothing, exit non-zero, and let the commit step see no
  data diff.
- Never commit partial degraded data.

## Verification expectations

For pipeline changes:

1. `node --check scripts/update-prices.js` if that file changed.
2. `node scripts/verify-data.js` must pass and say split shape is required.
3. `npm run build` should pass if app-facing contracts changed.
4. No generated JSON should be manually edited.
5. No guard threshold, invariant, or trust label should be weakened.
6. No new dependency should be added.

## Operator boundaries

- Do not run `gh workflow run` as an agent.
- Do not run full refreshes without explicit approval.
- Do not call JustTCG from local scripts during ordinary validation.
- Do not assume a paid JustTCG tier is active.
- Do not edit generated data files by hand.
