# FusionMetrics External Price Spot Check - 2026-04-30

## Summary

- Cards checked: 10.
- Directionally aligned: 9.
- Materially high/low/unclear: 1 unclear due to variant mismatch (`FB02-049 Zen-Oh`).
- Immediate concern: no broad pricing-trust concern found in this first pass. The main risk is product/variant ambiguity on cards with promos, alternate arts, reprints, or graded-market contamination.

## Method

- Selected 10 live-priced cards from `src/livePrices.json` joined to `src/cardData.json`.
- Sample covers high chase cards, mid-value cards, low-value live cards, refreshed FB01-FB03 cards, carried-forward FB04-FB09 cards, 8 sets, and 5 rarities.
- Checked public pages only, primarily PriceCharting pages that expose TCGplayer and eBay observed prices, plus search-visible Cardmarket pages where useful.
- This is a directional QA pass, not a pricing-model rewrite. Exact product matching is imperfect where external sources split base, alternate-art, promo, graded, Japanese, or reprint variants differently.

## Spot-check table

| cardCode | name | set | rarity | FusionMetrics price | external observed price/range | source | assessment | notes |
|---|---|---:|---:|---:|---|---|---|---|
| FB07-121 | Son Gohan : SH | FB07 | SCR | $60.97, ts `2026-04-27T04:16:33.680Z` | PriceCharting ungraded $48.99; TCGPlayer $58.71; recent eBay/TCGplayer examples roughly $39.65-$75.00 | https://www.pricecharting.com/game/dragon-ball-super-wish-for-shenron/son-gohan-sh-fb07-121 | close | FM is in the same band as TCGplayer and recent sales, with volatile eBay results. |
| FB09-123 | Gogeta : GT | FB09 | SCR | $42.42, ts `2026-04-27T04:18:36.630Z` | Recent TCGPlayer examples $42.32-$46.97; earlier sales $54.78-$90.00; Cardmarket V1 available from 20 EUR with higher variants | https://www.pricecharting.com/game/dragon-ball-fusion-world-dual-evolution/gogeta-gt-fb09-123 | close | FM is close to recent TCGPlayer sales; Cardmarket shows strong variant spread. |
| FB08-034 | Kefla | FB08 | SR | $4.22, ts `2026-04-27T04:17:31.048Z` | Recent TCGPlayer/eBay examples roughly $1.50-$6.99; Cardmarket trend around 1.85 EUR | https://www.pricecharting.com/game/dragon-ball-fusion-world-saiyan%27s-pride/kefla-fb08-034 | close | FM is on the high side of recent low-end sales but still inside observed range. |
| FB06-009 | Android 16 | FB06 | SR | $4.13, ts `2026-04-27T04:15:36.055Z` | Recent TCGPlayer examples $3.69-$4.32; eBay $4.99; Cardmarket V1 price trend 4.27 EUR | https://www.pricecharting.com/game/dragon-ball-super-rivals-clash/android-16-fb06-009 | close | Strong match to current external range. |
| FB02-119 | Son Goku | FB02 | C | $3.89, ts `2026-04-30T00:32:27.806Z` | PriceCharting ungraded $4.00; TCGPlayer $3.78; recent examples $3.25-$5.00 | https://www.pricecharting.com/game/dragon-ball-fusion-world-blazing-aura/son-goku-fb02-119 | close | Strong match to current external range despite rarity label mismatch in some external text. |
| FB03-140 | Son Goku : GT | FB03 | C | $9.81, ts `2026-04-30T00:33:45.098Z` | PriceCharting ungraded $12.00; TCGPlayer examples $10.00-$18.40; eBay examples around $12.50-$15.00 | https://www.pricecharting.com/game/dragon-ball-fusion-world-raging-roar/son-goku-gt-fb03-140 | slightly low | FM is directionally aligned but below many recent observed sales. External pages also surface expensive GDR/graded variants. |
| FB01-004 | Whis | FB01 | UC | $1.18, ts `2026-04-30T00:31:10.838Z` | TCGPlayer examples $0.65-$1.85; eBay regular example $0.99; PriceCharting ungraded $1.30 | https://www.pricecharting.com/game/dragon-ball-fusion-world-awakened-pulse/whis-fb01-004 | close | FM lands in the middle of recent observed sales. |
| FB02-049 | Zen-Oh | FB02 | R | $1.18, ts `2026-04-30T00:32:27.806Z` | PriceCharting Judge Promo page shows TCGPlayer $6.32-$7.99; Cardmarket versions page shows base FB02 from 0.02 EUR and higher promo/reprint versions | https://www.pricecharting.com/game/dragon-ball-fusion-world-judge-promo/zen-oh-fb02-049 | unclear | Same card number spans base, promo, alternate, and reprint variants. FM likely tracks a cheaper base/regular variant, while the easiest public page is a promo. |
| FB04-015 | Dyspo | FB04 | C | $0.03, ts `2026-04-27T04:13:41.569Z` | PriceCharting console $0.03; individual page TCGPlayer examples $0.02-$0.03 | https://www.pricecharting.com/game/dragon-ball-fusion-world-ultra-limit/dyspo-fb04-015 | close | Strong match; thin low-value market. |
| FB01-041 | Gowasu | FB01 | C | $0.03, ts `2026-04-30T00:31:10.838Z` | PriceCharting ungraded $0.05; TCGPlayer $0.04-$0.05; only 5 ungraded sold listings shown | https://www.pricecharting.com/game/dragon-ball-fusion-world-awakened-pulse/gowasu-fb01-041 | close | Directionally aligned; very thin market means cents-level differences are not meaningful. |

## Findings

- Pricing appears directionally trustworthy for MVP analytics.
- Most sampled cards were close to public TCGplayer/eBay-derived prices or inside recent observed ranges.
- Thin markets make low-value commons noisy; a difference of a few cents should not drive analytics decisions.
- Variant ambiguity is the primary trust risk. External sources frequently mix or split base cards, alternate arts, promos, Japanese cards, graded cards, and reprints under similar card numbers.
- JustTCG appears safe enough for current MVP analytics if the UI continues to surface provenance/freshness and avoids overclaiming precision.

## Recommendation

Proceed with current JustTCG pricing.

Do not build cross-source pricing yet. For the next analytics layer, keep conclusions directional and add variant/source caveats where investor-style scoring might imply more precision than the data supports.
