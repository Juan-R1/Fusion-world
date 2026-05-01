# FusionMetrics Deployment Check

Use this checklist after an approved deploy or when reviewing the live Vercel
URL. Do not deploy from this checklist unless the operator explicitly approves
deployment.

Production URL in current docs: https://fusion-metrics-jet.vercel.app/

## Before Deploy

Run locally:

```bash
node scripts/verify-data.js
npm run build
git status
```

Expected:

- `verify-data` reports 1,258 cards, 1,156 live prices, split shape required,
  and 9 invariants passed.
- Build completes successfully.
- No generated JSON data is dirty.
- No workflow or JustTCG refresh was triggered by the check.

## After Approved Deploy

Open the production URL and verify:

1. **Value Scanner**
   - App loads without a visible runtime error.
   - Search, filters, LIVE/EST chips, and default rankings are visible.

2. **CardDetail**
   - Open a LIVE card.
   - Confirm per-card freshness is visible.
   - Confirm 30-day history loads from `/priceHistory30d.json`.

3. **Static public data**
   - Open `/priceHistory30d.json` in the browser and confirm it returns JSON.
   - Open `/priceUpdateLog.json` in the browser and confirm it returns JSON.

4. **Provenance**
   - Footer/status chip appears.
   - Modal opens and shows mode, group, refreshed sets, fetched count, merged
     count, and timestamp.

5. **Methodology**
   - Methodology page loads and explains JustTCG, estimates, freshness, Box EV
     limits, and not financial advice.

6. **Box EV mobile layout**
   - Narrow the browser to roughly 390-430 px.
   - Confirm Top Cards by Box EV stacks full-width and does not overlap.

7. **Watchlist local storage**
   - Add a card or seed demo data from `docs/watchlist-demo-data.md`.
   - Confirm quantity, entry price, current value, Unrealized P/L, LIVE/EST
     chips, and freshness render.
   - Clear demo data afterward.

8. **Browser console**
   - Check for runtime errors in the console.
   - Warnings about large chunks during local build are expected; runtime errors
     are not.

## If Vercel Tools Are Available

Vercel tooling can help inspect deployment status, project URLs, and build logs.
Use it only for read-only status checks unless the operator explicitly approves
a deploy or production change.
