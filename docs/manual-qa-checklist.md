# FusionMetrics Manual QA Checklist

Use this checklist before public demos, release pushes, or major analytics work.

QA note, 2026-05-01: checked items were verified locally with `npm run build`,
`node scripts/verify-data.js`, and browser smoke tests. Unchecked items still
need a targeted pass. The Value Scanner missing-field search crash was fixed in
`24ac0e0`; browser search smoke tests still need a targeted pass.

## 1. Build / Data Validation

- [x] Run `npm run build`.
- [x] Run `node scripts/verify-data.js`.
- [x] Confirm `verify-data` says split shape is required and 9 invariants passed.

## 2. App Loading

- [x] App opens without console errors.
- [x] Value Scanner loads by default.
- [x] Tabs switch: Value Scanner, Pricing Model, Market Dynamics, Box EV, Watchlist, Methodology.
- [x] Provenance footer remains visible after tab switches.

## 3. Value Scanner Search / Filters

- [x] Search code guards missing/null card fields without crashing.
- [ ] Browser search by card name still works.
- [ ] Browser search by character still works when character exists.
- [ ] Browser search by card code still works.
- [ ] Empty search still shows default results.

## 4. CardDetail

- [x] Open a LIVE card.
- [x] Confirm `/priceHistory30d.json` lazy-loads on first CardDetail open.
- [ ] Open a second LIVE card and confirm history uses cache, not a second fetch.
- [x] Open an EST card and confirm it does not show fake history.
- [ ] Optional offline test: reload offline, open a card, and confirm unavailable history copy appears.

## 5. Provenance

- [x] Footer/status chip is visible.
- [x] Modal opens from the footer.
- [x] Latest refresh row is visible.
- [x] Modal shows mode, group, refreshed sets, fetched count, merged count, and timestamps.

## 6. Freshness

- [x] LIVE card shows `Source: JustTCG` and a refreshed relative time.
- [x] Estimated card shows model-estimate / no live JustTCG timestamp copy.
- [x] Carried-forward sets show older timestamps when applicable.

## 7. Methodology

- [x] Methodology page is accessible.
- [x] Trust copy explains JustTCG, estimates, split history, freshness, Set-Level Analytics, Box EV limits, and not financial advice.

## 8. Market Dynamics

- [x] Set-Level Analytics section is visible.
- [x] All FB01-FB09 sets render.
- [x] Coverage and freshness are visible per set.
- [x] Chase Dependency copy uses risk / concentration language, not investment-rating language.
- [x] Demand and supply are labeled as model heuristics.

## 9. Box EV

- [x] Assumptions and input-quality copy are visible.
- [x] LIVE and EST chips appear correctly in top EV rows.
- [ ] Chase-driven warning appears for concentrated sets.
- [x] Verdict copy uses model/approximate language, not certain-profit language.

## 10. Watchlist

- [x] Existing `fw-watchlist-v1` saved card codes migrate into `fw-watchlist-v2`.
- [x] Quantity and entry price edits persist after reload.
- [x] Summary cards show positions, total cost, current value, Unrealized P/L, and live coverage.
- [x] Rows show LIVE/EST chips and freshness labels.
- [ ] Clear all removes both v1 and v2 localStorage keys after confirmation.

## 11. Mobile

- [ ] Narrow viewport renders without overlapping text.
- [ ] CardDetail modal is readable.
- [ ] Provenance modal is readable.
- [ ] Footer does not block important content.
