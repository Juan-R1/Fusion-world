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

## 3-minute flow

1. **Frame the product.** "FusionMetrics is a trust-first analytics dashboard
   for Dragon Ball Super: Fusion World cards. The point is useful market
   scanning without pretending the model knows more than it does."
2. **Value Scanner.** Search for a card, filter a set, and point out LIVE/EST
   chips. Open a live card and show market price, model price, freshness, and
   real 30-day JustTCG history.
3. **Provenance.** Open the footer modal and explain rotation, fetched count,
   merged count, and carried-forward data.
4. **Market Dynamics.** Show Set-Level Analytics. Explain live coverage,
   freshness, live value, and Chase Dependency as concentration risk rather
   than expected profit.
5. **Box EV.** Show assumptions, input quality, approximate EV cards, and Top
   Cards by Box EV. Say explicitly that fees, taxes, liquidity, variant odds,
   and sealed variance are not modeled.
6. **Watchlist.** Show local-only positions with quantity, entry price, current
   FusionMetrics value, and cautious Unrealized P/L.
7. **Methodology.** Close by showing the Methodology page and explaining how
   live prices, estimated prices, model heuristics, and history states stay
   separated.

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

## Screenshot sequence

Use `docs/screenshot-plan.md` for the capture list. For a tight portfolio post,
lead with Value Scanner + CardDetail, then Market Dynamics, Box EV, Watchlist,
and Methodology.

For the Watchlist screenshot, use `docs/watchlist-demo-data.md` to seed local
browser-only demo positions. Reset the data after capture.
