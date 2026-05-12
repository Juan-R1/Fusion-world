# Post-Merge Production Verification — 2026-05-12

## Scope

Post-merge verification after Phase 2 closure and PR #1 merge to `main`.
No workflows, JustTCG calls, generated data edits, or deploy commands were run.

## Local Build

Command:

```bash
npm run build
```

Result:

```text
vite v5.4.21 building for production...
✓ 55 modules transformed.
dist/index.html                  3.68 kB │ gzip:  1.39 kB
dist/assets/index-DhBeSG0x.js  660.00 kB │ gzip: 98.79 kB
✓ built in 534ms
```

Size delta versus pre-merge baseline `660.00 kB raw / 98.79 kB gzip`:

- Raw: `+0.00 kB`
- Gzip: `+0.00 kB`

The existing Vite chunk-size warning still appears because the main bundle is
larger than 600 kB. This remains below the 750 kB stop threshold.

## Local Data Verification

Command:

```bash
node scripts/verify-data.js
```

Result:

```text
✓ 1258 cards, 1156 live prices (1156 with history, split shape required), 9 invariants passed
```

## Production HTML Tab-Label Check

Target:

```text
https://fusion-metrics-jet.vercel.app/
```

HTTP status: `200`

The production app is a client-rendered Vite SPA, so most tab labels are not
present in the static HTML response.

| Label | HTML grep result |
|-------|------------------|
| Value Scanner | MISS |
| Pricing Model | MISS |
| Market Dynamics | MISS |
| Box EV | HIT |
| Watchlist | MISS |
| Methodology | MISS |

## Production `livePrices.json` Contract Check

Target:

```text
https://fusion-metrics-jet.vercel.app/livePrices.json
```

Result:

- HTTP status: `404`
- Content-Type: `text/plain; charset=utf-8`
- JSON parse: failed (`The page could not be found`)
- Expected split-shape contract (`current` keyed by `cardCode`): not verifiable from this public URL.
- Flat-map check: not verifiable from this public URL.

Finding: production does not currently expose `/livePrices.json` as a public
asset. The app still imports bundled `src/livePrices.json`; this check only
confirms the public URL is absent.

## Production Refresh Metadata

Target:

```text
https://fusion-metrics-jet.vercel.app/priceUpdateLog.json
```

Result:

- HTTP status: `200`
- Content-Type: `application/json; charset=utf-8`
- `lastRefreshAt`: `2026-05-11T08:29:57.942Z`

## Production Sample-Gate Check

Targets:

```text
https://fusion-metrics-jet.vercel.app/premiumMetadata.json
https://fusion-metrics-jet.vercel.app/ebayCompsSummary.json
```

Results:

| Path | HTTP status | Result |
|------|------------:|--------|
| `/premiumMetadata.json` | 404 | production premium metadata artifact absent |
| `/ebayCompsSummary.json` | 404 | production eBay comps artifact absent |

This proves the production UI cannot consume the sample-flagged artifacts via
the production filenames. P2-015 and P2-016 remain sample-gated until reviewed
production artifacts are created.
