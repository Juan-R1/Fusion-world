# FusionMetrics Manual QA Checklist

Use this checklist before public demos, release pushes, or major analytics work.

## 1. Build / Data Validation

- [ ] Run `npm run build`.
- [ ] Run `node scripts/verify-data.js`.
- [ ] Confirm `verify-data` says split shape is required and 9 invariants passed.

## 2. App Loading

- [ ] App opens without console errors.
- [ ] Value Scanner loads by default.
- [ ] Tabs switch: Value Scanner, Pricing Model, Market Dynamics, Box EV, Watchlist, Methodology.
- [ ] Provenance footer remains visible after tab switches.

## 3. CardDetail

- [ ] Open a LIVE card.
- [ ] Confirm `/priceHistory30d.json` lazy-loads on first CardDetail open.
- [ ] Open a second LIVE card and confirm history uses cache, not a second fetch.
- [ ] Open an EST card and confirm it does not show fake history.
- [ ] Optional offline test: reload offline, open a card, and confirm unavailable history copy appears.

## 4. Provenance

- [ ] Footer/status chip is visible.
- [ ] Modal opens from the footer.
- [ ] Latest refresh row is visible.
- [ ] Modal shows mode, group, refreshed sets, fetched count, merged count, and timestamps.

## 5. Freshness

- [ ] LIVE card shows `Source: JustTCG` and a refreshed relative time.
- [ ] Estimated card shows model-estimate / no live JustTCG timestamp copy.
- [ ] Carried-forward sets show older timestamps when applicable.

## 6. Methodology

- [ ] Methodology page is accessible.
- [ ] Trust copy explains JustTCG, estimates, split history, freshness, Set-Level Analytics, Box EV limits, and not financial advice.

## 7. Market Dynamics

- [ ] Set-Level Analytics section is visible.
- [ ] All FB01-FB09 sets render.
- [ ] Coverage and freshness are visible per set.
- [ ] Chase Dependency copy uses risk / concentration language, not investment-rating language.
- [ ] Demand and supply are labeled as model heuristics.

## 8. Mobile

- [ ] Narrow viewport renders without overlapping text.
- [ ] CardDetail modal is readable.
- [ ] Provenance modal is readable.
- [ ] Footer does not block important content.
