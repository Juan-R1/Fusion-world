# FusionMetrics Demo Script

Use this for a concise portfolio or public-demo walkthrough.

## 60-second flow

1. **Open Value Scanner.** Show FB01-FB09 scope, live/estimated chips, search,
   filters, and a live card detail panel.
2. **Open CardDetail.** Point out per-card freshness, real 30d JustTCG history,
   and the difference between live prices and model estimates.
3. **Open Market Dynamics.** Show Set-Level Analytics, live coverage,
   freshness, and Chase Dependency as concentration risk, not an investment
   rating.
4. **Open Box EV.** Explain that EV is approximate, uses simplified rarity
   assumptions, may include estimated prices, and does not model fees,
   liquidity, variant odds, or sealed variance.
5. **Open Watchlist.** Add a card, edit quantity and entry price, and explain
   that Unrealized P/L is local-only and based on the current FusionMetrics
   price.
6. **Open Methodology.** Close with the trust story: JustTCG source, rotation,
   carried-forward timestamps, split history, model heuristics, and not
   financial advice.

## Trust story

FusionMetrics is built to avoid fake confidence:

- Current prices and 30d history come from JustTCG.
- Split shape keeps current prices out of bundled history.
- Provenance shows when and how price data refreshed.
- Estimated cards remain visible but are excluded from undervalued /
  overvalued rankings.
- Model outputs are labeled as heuristics, not observed demand or guaranteed
  outcomes.

## Pre-demo checklist

```bash
node scripts/verify-data.js
npm run build
npm run dev
```

Then smoke-test:

- Value Scanner search and filters.
- CardDetail history and freshness.
- Market Dynamics on desktop and narrow width.
- Box EV top-card rows on desktop and narrow width.
- Watchlist v2 migration, edit, remove, and clear-all.
- Provenance footer and modal.
