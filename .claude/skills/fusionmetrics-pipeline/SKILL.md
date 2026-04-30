---
name: fusionmetrics-pipeline
description: Use when working on FusionMetrics data pipeline, JustTCG updates, price files, GitHub Actions, coverage guards, rotation mode, split price history, or data provenance. Triggers — update-prices, JustTCG, rotation, coverage guard, livePrices.json, priceHistory30d.json, priceUpdateLog.json, weekly cron.
version: 1.0.0
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

Any task that touches:

- `scripts/update-prices.js` (fetch, rotation, merge, coverage guard)
- `scripts/accumulate-prices.js` (dormant accumulator — likely retire)
- `scripts/verify-data.js` (CI gate)
- `.github/workflows/update-prices.yml` (cron + workflow_dispatch inputs)
- `src/livePrices.json` (current-price file — machine-generated)
- `public/priceHistory30d.json` (lazy-fetched 30d history — machine-generated)
- `public/priceUpdateLog.json` (refresh metadata — machine-generated)
- Anything related to JustTCG quota, rate limits, or coverage drops.

## Pipeline contract (current)

**Files written by `scripts/update-prices.js`** (only after the merged-output
coverage guard passes):

| Path | Shape | Bundled? |
|------|-------|----------|
| `src/livePrices.json` | `[{cardCode, marketPrice, timestamp}]` — no inline history | yes |
| `public/priceHistory30d.json` | `{ cardCode: [{p, t}] }` | no — fetched at runtime |
| `public/priceUpdateLog.json` | `{ lastRunAt, lastMode, lastGroup, lastRefreshedSets, lastFetchedCount, lastMergedCount, history: [...] }` | no |

`src/priceHistory.json` and `scripts/accumulate-prices.js` are dormant; the UI
no longer reads them. Slated for retirement after several stable cycles.

## JustTCG quota assumptions

- **Tier:** free unless told otherwise.
- **Limits:** ~100 req/day, ~1,000 req/month, 20 cards/page.
- **Reset:** 00:00 UTC daily.
- **Full FB01–FB09 refresh:** ~67 requests — over the daily budget once any
  prior run has eaten into it.
- **Rotation refresh:** ~21–25 requests per run. Default and only safe mode.
- The fetch layer already implements: 8s global request spacing, typed errors
  (`AuthError`, `RateLimitedError`, `ApiError`), `Retry-After` parsing, max 3
  rate-limit retries (90s/180s/360s), max 2 transient retries (15s/30s),
  run-level abort on hard 429. Don't duplicate these.

## Rotation / merge rules

- **Groups:**
  `A = FB01,FB02,FB03` · `B = FB04,FB05,FB06` · `C = FB07,FB08,FB09`.
- **Group selection:** ISO-week % 3 by default. `UPDATE_SETS` env var
  overrides with an explicit comma list.
- **Modes:** `UPDATE_MODE=rotation` (default) or `UPDATE_MODE=full`. Full
  mode is operator-only and quota-risky.
- **Merge logic:** carry forward all entries whose `set` is **not** in the
  refresh group (with their previous `timestamp`); replace entries for sets
  that are in the group. Mirror the same partition for the history map.
- **Bootstrap:** on the very first split run, if `public/priceHistory30d.json`
  does not exist yet, the script bootstraps it from any inline history found
  in the previous `livePrices.json`. After this commit, that branch is dead
  weight and can be removed in a future cleanup commit.

## Coverage guard rules (do not weaken)

The guard runs against the **merged** output, not just the freshly fetched
subset.

- **Absolute floor:** `merged.length >= 1121` (97% of 1,156 baseline).
- **Per-set floor:** for each set seen previously,
  `merged_perSet[set] >= floor(prev_perSet[set] × 0.90)`.
- **On failure:** log loudly, `process.exit(1)`, write nothing. The bot's
  `EndBug/add-and-commit@v9` step sees no diff and skips its commit.
- The guard treats refreshed and carry-forward sets identically — the merge
  ensures carry-forward sets pass trivially because their counts are
  unchanged.

## Files this skill applies to

- **High-risk:** `scripts/update-prices.js`, `scripts/verify-data.js`,
  `.github/workflows/update-prices.yml`.
- **Read-only / machine-generated:** `src/livePrices.json`,
  `src/priceHistory.json`, `public/priceHistory30d.json`,
  `public/priceUpdateLog.json`.
- **Dormant for now:** `scripts/accumulate-prices.js`,
  `src/priceHistory.json`.
- **Static reference for slug → set mapping:** `SET_SLUGS` constant in
  `update-prices.js`. Do not duplicate this mapping elsewhere.

## Before-commit checklist

1. `node --check scripts/update-prices.js` (and any other script touched)
   reports `syntax OK`.
2. `node scripts/verify-data.js` passes — line should end with
   `(N with history, split shape), 9 invariants passed`.
3. `npm run build` passes — bundle size should stay ~622 kB raw / ~88 kB gzip.
4. No machine-generated JSON modified by hand.
5. No coverage-guard threshold or invariant has been loosened.
6. No new top-level npm dependency.
7. Active branch is `claude/dbfw-market-analytics-1qh5D`.

## Final response format

End your reply with:

1. Files changed (paths only).
2. Commit hash.
3. `verify-data` result line.
4. `npm run build` outcome and bundle size.
5. Working tree status.
6. Whether any operator action (e.g. workflow dispatch) is needed next, and
   the exact `gh workflow run …` command if so.

Never trigger workflows yourself — only the operator dispatches runs.
