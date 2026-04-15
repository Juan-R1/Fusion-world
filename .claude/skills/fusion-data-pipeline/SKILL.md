---
name: fusion-data-pipeline
description: Run, debug, and extend the FusionMetrics data pipeline — Bandai Playwright scraper, JustTCG price fetcher, card-data merge. Use for any scraper/API task or data refresh.
version: 1.0.0
category: Maintenance
triggers:
  - scrape
  - fetch-cards
  - JustTCG
  - Bandai
  - update-prices
  - refresh data
---

# FusionMetrics Data Pipeline

## Scripts
| Script | Purpose | Output |
|--------|---------|--------|
| `scripts/scrape-official-fw.js <FBxx>` | Playwright → Bandai card detail pages | `scripts/scraped/<FBxx>.json` |
| `scripts/fetch-cards.js` | Merge known-cards + scraped + synthetic | `src/cardData.json` |
| `scripts/update-prices.js` | JustTCG API → all 9 sets | `src/livePrices.json` |
| `scripts/calibrate-model.js` | Rarity-stratified OLS on livePrices | Console output of constants for `data.js` |

## Bandai scraper (current markup as of 2026)
- Selector: `a[data-src]` where `data-src` contains `card_no=FBxx-`
- Card name: `img[alt]` on same anchor, format `"FBxx-NNN Card Name"`
- Rarity/color: extracted from detail page; defaults to C if extraction fails
- 2s delay between pages; exits on 10 consecutive empty pages

### Playwright gotcha
`page.evaluate()` accepts ONE serializable argument. Wrap multiple params:
```js
// WRONG: await page.evaluate((a, b) => {...}, x, y)
// RIGHT:
await page.evaluate(({ a, b }) => {...}, { a: x, b: y })
```

## JustTCG API
- Header: `x-api-key: $JUSTTCG_API_KEY`
- Endpoint: `GET /v1/cards?game=dbsfw&set=<code>&limit=20&offset=<n>`
- Free tier: 20 items/page
- 7s delay between pages
- On HTTP 429: sleep 65s and retry same offset
- API key is in GitHub Actions secret `JUSTTCG_API_KEY` (weekly workflow)

## Full refresh sequence
```bash
# 1. Scrape all sets (slow, ~15 min total)
for set in FB01 FB02 FB03 FB04 FB05 FB06 FB07 FB08 FB09; do
  node scripts/scrape-official-fw.js $set
done

# 2. Merge into cardData.json
node scripts/fetch-cards.js

# 3. Refresh prices
JUSTTCG_API_KEY=<real-key> node scripts/update-prices.js

# 4. Optional: recalibrate if coverage changed significantly
node scripts/calibrate-model.js
# Then hand-edit RARITY_BASE_PRICE / CHAR_PREMIUM_BETA / MEAN_CHAR_PREMIUM in src/data.js
```

## Known failure modes
- "Too many arguments" in Playwright → single-arg gotcha above
- 401 from JustTCG → verify env var is the REAL key, not literal "your_key_here"
- Non-fast-forward push → see fusion-git-flow skill
- UC geo-mean below Common → smooth UC base to $0.20 (dataset too small)
- Empty `scraped/FBxx.json` → Bandai changed markup; inspect page source for new selector

## Current coverage
- Verified card entries: 161 / 1,258 in `scripts/known-cards.json`
- Live prices: 1,156 / 1,258 across all 9 sets
- Card images: 99 / 1,258 (from HighDefined/TCG-Arena-DBSFW)
