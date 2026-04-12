# FusionMetrics — DBFW Market Analytics Dashboard

## What this project is
A React 18 + Vite TCG market analytics dashboard for **Dragon Ball Super Card Game: Fusion World** (DBFW). It models card pricing, desirability, and market dynamics across all 9 sets (FB01–FB09, 1,258 cards total).

## How to run
```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
node scripts/fetch-cards.js   # regenerate src/cardData.json from known-cards.json
```

## Branch
Active development branch: `claude/dbfw-market-analytics-1qh5D`

---

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app — card grid, filters, search, pagination |
| `src/data.js` | Analytics model — exports SETS, RARITIES, CARDS |
| `src/cardData.json` | Generated card data (1,258 cards) — **do not edit manually** |
| `src/components/CardDetail.jsx` | Card detail modal (verified badge, price chart, gauges) |
| `src/components/Sparkline.jsx` | SVG price/demand sparkline |
| `src/components/GaugeRing.jsx` | Circular gauge for desirability/supply metrics |
| `src/components/RarityBadge.jsx` | Colored rarity chip |
| `src/components/DeltaBadge.jsx` | Green/red market delta badge |
| `src/components/CardImage.jsx` | Card image with fallback placeholder |
| `scripts/fetch-cards.js` | Generates cardData.json from known-cards.json |
| `scripts/known-cards.json` | **161 verified real card entries** (source of truth) |

---

## Analytics model (src/data.js)

```js
pullCost        = log-normalized pull rate → [1, 10]
charPremium     = (googleTrends / 100) * 9 + 1  clamped [1, 10]
artScore        = seeded RNG → [3, 10]
universalAppeal = googleTrends / 10
desirability    = charPremium*0.45 + artScore*0.45 + universalAppeal*0.10
predictedPrice  = exp(0.80 + 0.17*pullCost + 0.38*desirability)
marketPrice     = predictedPrice * (0.7 + rng*0.6)
delta           = ((marketPrice - predictedPrice) / predictedPrice) * 100
```

PRNG is **mulberry32 seeded** per card index — all analytics are deterministic/reproducible.

---

## Card data architecture

- `scripts/known-cards.json` — flat array of verified cards, each with:
  `{ code, name, character, rarity, color, type, trait }`
- `scripts/fetch-cards.js` loads known-cards.json as a lookup map, generates all 1,258 card codes, uses real data for known entries and synthetic fallback for gaps
- After editing known-cards.json, run `node scripts/fetch-cards.js` to regenerate `src/cardData.json`

### Verified coverage (161 / 1258 cards)
| Set | Verified | Total |
|-----|---------|-------|
| FB01 Awakened Pulse | 79 | 140 |
| FB02 Blazing Aura | 13 | 140 |
| FB03 Raging Roar | 12 | 164 |
| FB04 Ultra Limit | 6 | 159 |
| FB05 New Adventure | 4 | 159 |
| FB06 Rivals Clash | 11 | 123 |
| FB07 Wish for Shenron | 11 | 125 |
| FB08 Saiyan's Pride | 12 | 125 |
| FB09 Dual Evolution | 13 | 123 |

### Image source
`https://raw.githubusercontent.com/HighDefined/TCG-Arena-DBSFW/main/{CODE}.png`
99 cards have working images. Coverage map in `buildImageCodes()` inside fetch-cards.js.

---

## Rarities
| Code | Name | Pull Rate | Color |
|------|------|-----------|-------|
| L | Leader | 0.04 | #10b981 |
| C | Common | 0.55 | #6b7280 |
| UC | Uncommon | 0.28 | #3b82f6 |
| R | Rare | 0.12 | #a855f7 |
| SR | Super Rare | 0.04 | #f59e0b |
| SCR | Secret Rare | 0.008 | #f97316 |
| SPR | Special Rare | 0.003 | #dc2626 |

---

## Card colors (DBFW)
Red, Blue, Green, Yellow, Black, Purple

Each set's card range follows color sections (~24 cards each):
- 001–024: Color 1 leader section
- 025–048: Color 2
- 049–072: Color 3
- 073–096: Color 4
- 097–120: Color 5
- 121+: SCR/SPR

---

## Data sources used so far
- `jeffinitelyjeff/open-tcg-json` — main source for FB01 (79 verified)
- TCGPlayer product URLs — FB02, FB06–FB09 chase cards
- PriceCharting checklists — rarity confirmation
- eBay listings — color/rarity cross-reference for SCRs
- `DaveVries/fusiontracker` seed.ts — character/rarity signals (numbering inconsistent, used with caution)

## Remaining gap
~1,097 synthetic cards. To expand coverage:
1. Try dragonball.gg API (if they expose one)
2. Scrape official Bandai card DB with rotating headers
3. Check if pricecharting.com exposes a sortable JSON feed
4. Look for forks of jeffinitelyjeff/open-tcg-json with more DBFW data

---

## git
```bash
git log --oneline -5           # recent commits
git push -u origin claude/dbfw-market-analytics-1qh5D
```
