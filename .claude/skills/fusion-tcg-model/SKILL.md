---
name: fusion-tcg-model
description: DBFW (Dragon Ball Fusion World) analytics math — rarity-stratified price model, Box EV formulas, pull rates, set/color taxonomy. Use whenever calibrating prices, building ROI features, or writing any analytics logic.
version: 1.0.0
category: Domain Logic
triggers:
  - predicted price
  - Box EV
  - pull rate
  - rarity
  - calibrate model
  - desirability
---

# FusionMetrics TCG Model

## Rarities & pull rates
| Code | Name | Rate | Color |
|------|------|------|-------|
| L | Leader | 0.04 | #10b981 |
| C | Common | 0.55 | #6b7280 |
| UC | Uncommon | 0.28 | #3b82f6 |
| R | Rare | 0.12 | #a855f7 |
| SR | Super Rare | 0.04 | #f59e0b |
| SCR | Secret Rare | 0.008 | #f97316 |
| SPR | Special Rare | 0.003 | #dc2626 (FB01–FB05 only) |

## Price model (calibrated on 1,156 live prices)
```js
const RARITY_BASE_PRICE = {
  L: 0.2304, C: 0.1598, UC: 0.2000, R: 0.2440,
  SR: 1.1144, SCR: 12.9869, SPR: 24.99,
}
const CHAR_PREMIUM_BETA  = 0.0803
const MEAN_CHAR_PREMIUM  = 5.9386

predictedPrice = rarityBase * exp(CHAR_PREMIUM_BETA * (charPremium - MEAN_CHAR_PREMIUM))
```
R² = 31.8%. SPR extrapolated via log-linear pull-rate regression. UC smoothed to enforce C < UC < R monotonic order.

## Desirability (display only, not pricing)
```
charPremium     = (googleTrends / 100) * 9 + 1  // clamped [1,10]
artScore        = seeded RNG [3,10]
universalAppeal = googleTrends / 10
desirability    = 0.45*charPremium + 0.45*artScore + 0.10*universalAppeal
```

## Box EV
```
PACKS_PER_BOX = 24
CARDS_PER_PACK = 12
copiesPerCardPerBox = (pullRate * CARDS_PER_PACK / countOfRarityInSet) * PACKS_PER_BOX
boxEV = sum(card.marketPrice * card.copiesPerCardPerBox) for card in set
roi% = (boxEV - boxPrice) / boxPrice * 100
breakEvenPrice = boxEV
```

## Set structure
Each set has color sections of ~24 cards:
- 001–024: Color 1 (typically leader color)
- 025–048: Color 2
- 049–072: Color 3
- 073–096: Color 4
- 097–120: Color 5
- 121+: SCR/SPR chases

## Seeded determinism
All synthetic values use `mulberry32(seed)` keyed off card index. NEVER change RNG call order — it cascades through every downstream value and invalidates comparisons against prior builds.

## Data quality guardrails
- Show a quality badge when `distinctRars < 4` in a set (likely Bandai rarity-extraction failure)
- Cards with `hasLivePrice: true` display LIVE chip; others show calibrated-model price
- `HAS_LIVE_PRICES` exported from `data.js` drives the header pill
