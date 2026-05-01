---
name: fusionmetrics-watchlist
description: Use when working on FusionMetrics Watchlist localStorage, portfolio fields, migration, entry price, quantity, local P/L, clear-all behavior, or local-only portfolio constraints.
version: 1.0.0
category: Product
triggers:
  - watchlist
  - localStorage
  - portfolio fields
  - entry price
  - quantity
  - unrealized P/L
  - fw-watchlist
---

# FusionMetrics Watchlist

## When to use

Use this skill for changes involving:

- `src/hooks/useWatchlist.js`
- `src/tabs/Watchlist.jsx`
- `src/App.jsx` Watchlist wiring
- Watchlist manual QA in `docs/manual-qa-checklist.md`

## Current contract

- Watchlist is local browser storage only.
- Active storage key: `fw-watchlist-v2`.
- Legacy key: `fw-watchlist-v1`, read for migration and removed only by
  explicit clear-all.
- V2 shape stores `{ version: 2, items }`, keyed by `cardCode`.
- Each item stores only `cardCode`, `quantity`, `entryPrice`, and `addedAt`.
- Do not store derived values such as current value, cost basis, P/L, or
  freshness.

## Non-negotiables

- No accounts, cloud sync, alerts, CSV export, or recommendations without
  explicit approval.
- Do not change pricing logic or generated data.
- Preserve star/toggle behavior from Value Scanner and CardDetail.
- Preserve v1 migration so existing saved cards are not lost.
- Keep quantity finite and at least 1.
- Keep entry price finite and non-negative.
- Use cautious copy: `Unrealized P/L`, `current FusionMetrics price`, and `EST
  rows use model-estimated prices`.

## Before commit

1. Confirm v1 migration still creates v2 items with quantity `1` and current
   entry price fallback.
2. Confirm edits to quantity and entry price persist after reload.
3. Confirm removing one card does not wipe the whole list.
4. Confirm clear-all asks for confirmation and removes both v1 and v2 keys.
5. Confirm LIVE / EST chips and freshness labels still render.
6. Run:

```bash
npm run build
node scripts/verify-data.js
```

## Final response format

Report files changed, commit hash, build result, verify-data result, manual
localStorage smoke-test notes, working tree status, and anything deliberately
not changed.
