# FusionMetrics Screenshot Plan

Use this plan after running:

```bash
node scripts/verify-data.js
npm run build
npm run dev
```

Capture screenshots from a clean browser session unless the shot explicitly
requires local demo Watchlist data.

## Required Shots

1. **Desktop Value Scanner + CardDetail**
   - Open Value Scanner.
   - Select a LIVE card such as `FB03-009`.
   - Capture the table, CardDetail, `Source: JustTCG`, and 30-day history.

2. **Narrow Value Scanner**
   - Resize to roughly 390-430 px wide.
   - Capture summary cards, filters, and readable table rows.

3. **Desktop Market Dynamics + Set-Level Analytics**
   - Capture the scatterplot and the first row of set analytics cards.
   - Make sure Chase Dependency and freshness labels are visible.

4. **Desktop Box EV**
   - Capture assumptions, input quality, metric cards, rarity EV, and Top Cards
     by Box EV.
   - Keep the set selector and box price input visible.

5. **Narrow Box EV**
   - Resize to roughly 390-430 px wide.
   - Scroll to Top Cards by Box EV.
   - Capture the stacked full-width card rows with LIVE/EST chips.

6. **Watchlist v2 With Demo Positions**
   - Use `docs/watchlist-demo-data.md` once it exists.
   - Capture quantity, entry price, current value, Unrealized P/L, LIVE/EST
     chips, and freshness.

7. **Methodology & Data Sources**
   - Capture the hero, summary cards, Price Sources, Freshness, and Model
     Limits sections.

8. **Provenance Modal**
   - Open the footer/status chip.
   - Capture mode, group, refreshed sets, fetched count, merged count, and run
     timestamp.

## Optional Shots

- Pricing Model scatterplot with regression formula and predictor.
- Watchlist empty state.
- Mobile Methodology page.

## Framing Notes

- Do not crop out trust labels, provenance, freshness, or methodology caveats.
- Avoid screenshots that imply guaranteed profit or official affiliation.
- For portfolio use, pair each screenshot with one sentence about the user
  problem and one sentence about the trust constraint.
