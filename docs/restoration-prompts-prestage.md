# Synthetic-Surface Restoration — Pre-Staged Codex Prompts

**Created:** 2026-05-15
**Status:** Pre-stage. Activates after the eBay Browse API ingester
(`docs/ebay-ingester-prestage.md`) has shipped and produced its
first non-empty `public/ebayDemand.json` + `public/ebaySupply.json`
artifacts.
**Closes when shipped:** R-018 fully resolved; D-049 restoration
roadmap entries become live in production UI.

> The strip wave (D-049) retired the RNG-derived Demand / Sup. Sat. /
> Market Dynamics / Watchlist-Highest-Demand surfaces. The eBay
> ingester restores their **inputs** as observed data. This doc
> stages the **UI restoration prompts** so the operator can paste
> them one at a time, in dependency order, the moment the ingester
> produces real data.
>
> Each prompt is bounded to a single Codex run with a single commit.
> They're independent — if you want only the comps panel and not
> the Market Dynamics tab, paste only § 1.

## Sequencing — paste in this order

| Order | Surface restored | Depends on | Estimated effort |
|-------|------------------|------------|------------------|
| § 1 | Demand % gauge + Value Scanner Demand column | `public/ebayDemand.json` populated | 1 commit |
| § 2 | Sup. Sat. % gauge + Value Scanner Sup. Sat. column | `public/ebaySupply.json` populated | 1 commit |
| § 3 | Market Dynamics tab (quadrant + Set Health) | Both § 1 + § 2 done | 1–2 commits |
| § 4 | Watchlist Highest-Demand sort | § 1 done | 1 commit (tiny) |

After each section ships, hard-refresh production and visually
confirm the surface renders correctly before pasting the next.
If anything looks wrong, demote with `git rm` on the relevant
artifact OR revert the UI commit — both paths preserve the trust
contract.

## Universal preflight

Before pasting ANY section's prompt, Codex must run:

```bash
bash scripts/session-brief.sh
git fetch --all && git pull --ff-only
node scripts/verify-data.js
npm test
```

Confirm: 9 invariants, 23+ tests pass, `public/ebayDemand.json`
and/or `public/ebaySupply.json` exist with `_isSample: false` and
non-empty `byCardCode`.

## § 1 — Restore Demand % gauge + Value Scanner Demand column

```text
Restore the Demand % gauge and Value Scanner Demand column,
sourced from public/ebayDemand.json. This was retired in D-049
(P3-015 synthetic strip) and returns now with real eBay
watchCount data. Single commit.

Read first:
- AGENTS.md (§ 3 trust rules)
- docs/decision-log.md D-006, D-007, D-009, D-014, D-049
  (restoration-path subsection)
- docs/restoration-prompts-prestage.md § 1 (this section)
- src/data.js (export shape — you'll add a per-card `demand` field
  that reads from the new artifact)
- src/lib/ebayComps.js (existing pattern — copy the lazy-fetch
  sample-gate loader)
- src/components/GaugeRing.jsx (component is intact; just call it
  again from CardDetail)
- public/ebayDemand.json (verify it's populated with non-empty
  byCardCode and _isSample: false)

Allowed files:
- src/lib/ebayDemand.js (NEW — lazy-fetched sample-gate loader
  for `/ebayDemand.json`; same shape as ebayComps.js)
- src/data.js (EDIT — add per-card `demand` getter that reads
  cached ebayDemand artifact; returns null if loader rejects
  the sample-gate; UI gates on non-null)
- src/components/CardDetail.jsx (EDIT — re-add the GaugeRing
  rendering Demand % with the real data source; add a tooltip
  noting "Source: eBay active-listing watchCount, normalized")
- src/tabs/ValueScanner.jsx (EDIT — re-add the DEMAND column
  with a MiniBar; re-add the demand sort option)
- tests/ebayDemand.test.jsx (NEW — sample-gate refusal + missing
  artifact fallback + UI render with non-null demand)

Forbidden: every other file. ESPECIALLY: src/data.js OLS formula
(only adding a new getter; do NOT touch predictedPrice math),
src/cardData.json, src/livePrices.json, scripts/*, the existing
ebayComps.js / premiumMetadata.js loaders.

Surface rule: when `card.demand` is null (no eBay data for the
card OR sample-gate refused the artifact), render NOTHING — no
gauge, no minibar, no "—" placeholder. Same posture as the
existing premium-badges component.

Copy rules:
- Gauge label: "Demand"
- Tooltip: "Source: eBay active-listing watchCount, normalized
  per card. Higher = more watchers per active listing."
- Value Scanner column header: "DEMAND"
- NO claim that high demand = buy signal. The number is observed
  signal, not a recommendation.

Validation:
  npm test (24+ tests pass)
  npm run build (bundle delta < 5 kB raw)
  node scripts/verify-data.js (9 invariants)

Commit message: feat: restore Demand gauge + Value Scanner Demand
  column (real eBay watchCount source)

STOP CONDITIONS:
- Any test fails.
- bundle grows > 5 kB raw.
- Any synthetic / RNG-derived value reintroduced.
- src/data.js predictedPrice formula touched.
- Any UI copy implies buy/sell signal.
```

## § 2 — Restore Sup. Sat. % gauge + Value Scanner Sup. Sat. column

```text
Restore the Sup. Sat. (supply saturation) gauge and Value Scanner
Sup. Sat. column, sourced from public/ebaySupply.json. Mirror of
§ 1 with different input. Single commit.

Read first: same as § 1, swap ebayDemand.json → ebaySupply.json.

Allowed files:
- src/lib/ebaySupply.js (NEW — same sample-gate loader pattern)
- src/data.js (EDIT — add per-card `supplySaturation` getter
  reading the cached artifact; null when missing)
- src/components/CardDetail.jsx (EDIT — re-add the Sup. Sat.
  GaugeRing alongside the Demand one)
- src/tabs/ValueScanner.jsx (EDIT — re-add the SUP. SAT. column;
  re-add the supply-saturation sort option)
- tests/ebaySupply.test.jsx (NEW — sample-gate refusal +
  missing-artifact fallback)

Forbidden: same as § 1.

Surface rule: same — when null, render nothing.

Copy rules:
- Gauge label: "Sup. Sat." (matches the retired wording)
- Tooltip: "Source: eBay active-listing count for this card,
  normalized against catalog median. Higher = more sellers per
  buyer interest."
- Value Scanner column header: "SUP. SAT."

Validation: same as § 1.

Commit message: feat: restore Sup. Sat. gauge + Value Scanner
  Sup. Sat. column (real eBay listing-count source)
```

## § 3 — Restore Market Dynamics tab (quadrant + Set Health)

```text
Restore the Market Dynamics tab. The retired tab had:
- A 4-quadrant scatter chart (Heating Up / Overheated / Stable /
  Cooling Off) with X = supply saturation, Y = demand pressure
- A Set Health Dashboard grid showing per-set Avg Demand +
  Supply Sat. with cooling/overheated labels

Both inputs now have real data via § 1 + § 2. Restore the tab.
Single commit, OR two if the operator wants to split quadrant
from set health.

Read first: same as § 1 + § 2 + the retired implementation
(check git log for the `refactor: remove Market Dynamics tab
(synthetic inputs)` commit — its diff shows the original
component code that should be restored with real-data inputs
substituted for the RNG fields).

Allowed files:
- src/tabs/MarketDynamics.jsx (NEW or restored — wires the
  scatter chart to real `card.demand` + `card.supplySaturation`
  fields; adds a Set Health Dashboard reading set-level
  aggregates)
- src/lib/setHealthAggregates.js (NEW — pure functions:
  computeSetAvgDemand, computeSetSupplySat; both
  median-over-eligible-cards per set)
- src/App.jsx (EDIT — re-add the Market Dynamics tab between
  Pricing Model and Box EV, matching the prior tab order)
- tests/marketDynamics.test.jsx (NEW — quadrant zone classification
  + set-health aggregate computation + empty-state rendering when
  artifacts are missing)

Forbidden: same as § 1.

Surface rule: if either ebayDemand.json or ebaySupply.json is
missing/empty, render an empty-tab state with a one-line note
"Awaiting eBay data ingestion." Do NOT render placeholder dots
or RNG-derived fallback values.

Copy rules:
- Quadrant labels: "Heating Up", "Overheated", "Stable",
  "Cooling Off" (re-use the retired language; visual is
  identical to original).
- Set Health chip wording: "Cooling" / "Overheated" / "On track"
  (no buy/sell implication).
- Header subtitle: "Each dot represents a card. X = real eBay
  supply saturation, Y = real eBay demand pressure. Dots
  colored by rarity tier."

Validation:
  npm test (26+ tests pass)
  npm run build (bundle delta < 15 kB raw — the tab is the
    largest single restoration)
  node scripts/verify-data.js

Commit message: feat: restore Market Dynamics tab (real eBay
  inputs replace retired RNG-derived axes)
```

## § 4 — Restore Watchlist Highest-Demand sort

```text
Tiny commit. Watchlist had a "Highest Demand" sort retired with
the synthetic-strip wave (it sorted on a now-deleted
`card.desirability` composite). Restore the sort against the
real `card.demand` field that § 1 added.

Allowed files:
- src/tabs/Watchlist.jsx (EDIT — two lines: add the sort option
  row + add the switch case)
- tests/useWatchlist.test.jsx (EDIT — add one case asserting the
  demand sort orders cards correctly when card.demand values
  are present)

Forbidden: every other file.

Sort option label: "Highest Demand" (matches the retired
Desirability label as the closest semantic replacement).

Switch case:
  case 'demand': return (b.card.demand ?? 0) - (a.card.demand ?? 0)

(The ?? 0 fallback keeps cards with null demand at the bottom
of the sort, not at the top.)

Validation: npm test (27+ tests pass); npm run build; verify-data.

Commit message: feat: restore Watchlist Highest-Demand sort
  (real eBay watchCount source)
```

## After all four sections ship

- Update `docs/risk-register.md` R-018: status moves from
  "monitored" or "mitigated" to "closed under current scope."
- Update `docs/decision-log.md` D-049 status to indicate
  restoration completed for Demand, Sup. Sat., Market Dynamics,
  and Watchlist sort. `artScore` and Composite Desirability
  remain permanently retired (no real-data path).
- Update `docs/phase-3-execution-checklist.md` with P3-017
  through P3-020 ledger rows (one per restoration commit).
- Update STATUS.md.

A consolidated docs commit handles all of this in one go after
the four UI commits land.

## What this doc does NOT do

- Restore `artScore` / "Art / Hype" gauge — permanently retired
  per D-049 (no real source exists for "art quality").
- Restore Composite Desirability — permanently retired; component
  values surface separately.
- Add new tabs beyond what was retired (Set Rankings + Chase
  Radar are separately spec'd in `docs/set-rankings-spec.md`).
- Change the OLS pricing model or any data.js formula.
- Touch generated artifacts or pipeline scripts.

## Cross-references

- `docs/ebay-ingester-prestage.md` — the upstream dependency.
- `docs/decision-log.md` D-049 — retirement record + restoration
  roadmap.
- `docs/risk-register.md` R-018 — single-source dependency
  resolved by this chain.
- `docs/bundle-audit-2026-05-07.md` — bundle delta budgets per
  restoration are anchored to this audit's recommendations.

## Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-15 | Initial pre-stage doc | Activates after eBay ingester ships. Four paste-ready Codex prompts. |
