# Set Rankings & Chase Radar UX Spec (P3-010)

**Status:** Spec authored 2026-05-14. **No implementation approved.**
Operator reviews and decides whether to hand to Codex for the
implementation pass.
**Closes:** P3-010 in `docs/phase-3-execution-checklist.md` as the
spec deliverable (Q-034). Implementation remains a separate gate.

> **Operating principle:** make FusionMetrics unable to lie by
> accident, extended to rankings. A rankings surface that implies
> buy/sell signal is a built-in lie. Every metric here is an
> **observation**, not a recommendation. The UI must reinforce that
> framing relentlessly.

## 1. Two surfaces, one motivation

The "what should I look at next?" question can be answered two ways:

| Surface | Question it answers | Grain |
|---------|---------------------|-------|
| **Set Rankings** | Which set is the most active / cheapest / freshest / most concentrated right now? | Per set (9 rows: FB01–FB09) |
| **Chase Radar** | Which individual cards are showing the most pronounced market signal right now? | Per card (top N of 1,156 live-priced) |

Both surfaces live in the existing tab system. They do NOT replace
Value Scanner, Pricing Model, or Market Dynamics; they aggregate
those surfaces so the user doesn't have to re-derive the answer.

## 2. Non-goals (explicit)

- ❌ Tell the user which set is the "best buy."
- ❌ Tell the user which card to acquire.
- ❌ Imply ROI, return percentages, or any forward-looking projection.
- ❌ Surface aggregates over **estimated** cards (D-009: estimated
  cards excluded from undervalued/overvalued rankings).
- ❌ Display synthetic price movement or synthetic history (D-006,
  D-007: permanent removal).
- ❌ Compute confidence scores beyond what the source data supports.
- ❌ Show "popularity" metrics that aren't backed by observed data
  (current `googleTrends` is a stored heuristic, not a live signal).

## 3. Set Rankings — column inventory

The Set Rankings table shows one row per `set` (FB01–FB09 today;
SB sets added when staged). Columns, all derived from existing
`data.js` exports:

| Column | Source | Display | Sortable |
|--------|--------|---------|----------|
| Set code | `set` field | Badge: `FB01` etc. | yes |
| Set name | `setName` field | Compact text | no |
| Cards | filter | `124 cards` | yes |
| Live-priced | `priceStatus === 'live'` count | `120 / 124` (97%) | yes |
| Aggregate live value (USD) | sum of `marketPrice` over `priceStatus === 'live'` rows | `$1,247` | yes |
| Median live price (USD) | median of `marketPrice` over live rows | `$3.42` | yes |
| Top card | live-priced card with highest `marketPrice` | `Goku — Awakening · SCR · $187` | no |
| Coverage status | derived | `green`/`yellow`/`red` chip per § 5 | yes |
| Freshness | min/max of `refreshedAt` over live rows | `7d ago` | yes |
| Avg delta | mean of `delta` over live rows | `+2.4%` (color-coded per existing scale) | yes |

**Forbidden columns:**
- "Projected return" — invents data.
- "Recommended buy" — buy/sell signal.
- "Investment score" — composite that hides which inputs are real.
- Any column whose computation includes estimated cards' `delta`
  (always 0 by D-008; would skew aggregates).

## 4. Chase Radar — row inventory

Chase Radar shows the top N cards (default N=20) by absolute delta,
filtered to live-priced cards only. Columns:

| Column | Source | Display |
|--------|--------|---------|
| Rank | computed | `#1`, `#2`, … |
| Card | name + set + rarity | Existing `CardRow` minus pagination chrome |
| Market | `marketPrice` | `$24.50` |
| Model | `predictedPrice` | `$32.10` |
| Delta | `delta` | `−23.7%` (color: green if ≤ −15%, red if ≥ +15%, yellow otherwise) |
| Demand | `demand` (heuristic) | Existing minibar; **labeled "model heuristic"** in column header tooltip |
| Freshness | per-card `refreshedAt` | Existing badge |
| Risk chips | from `riskTags` if premium-metadata loaded | Existing chip pattern; `manualReviewOnly` always-visible |

**Sort modes:**
- `delta-undervalued` (default) — most-negative delta first; mirrors
  existing Value Scanner default.
- `delta-overvalued` — most-positive delta first.
- `recently-refreshed` — newest `refreshedAt` first.
- `largest-market` — highest `marketPrice` first.

**Filters:**
- Set (multi-select, default: all).
- Rarity (multi-select, default: all).
- "Only cards with comps" — toggle, default OFF. Becomes meaningful
  after P3-011 lands real eBay comps.

## 5. Coverage-status chip rules

Per-set coverage is critical because the absolute floor (1,121) is a
project-wide guard but individual sets can degrade.

| Live-price ratio (vs prior count) | Chip | Copy |
|-----------------------------------|------|------|
| ≥ 95% | green | `On track` |
| 90–94% | yellow | `Partial` |
| < 90% | red | `Degraded — refresh queued` |

The 90% threshold mirrors the per-set guard in `update-prices.js`.
Below that, an update would be rejected; surfacing it in the UI
makes the guard visible to users instead of being a silent CI gate.

## 6. Provenance / honesty rails

Every aggregate displayed in Set Rankings or Chase Radar carries:

1. A tiny "as of" timestamp inferred from the **oldest** included
   `refreshedAt` (so stale cards drag down the visible freshness,
   not the most recent one).
2. A row-level estimated-cards exclusion note: "Estimated cards not
   included in this aggregate."
3. A link to `/methodology` for the column definition.
4. Risk chips bubble up: if any included card has
   `riskTags.includes('rawGradedContamination')`, the row badge
   shows `Comps caveat`.

## 7. Layout

Mobile first. Three viewports:

- **≤ 480px**: one card per set in a vertical stack. Top card,
  coverage chip, avg delta, freshness — that's it. The full table
  is too dense for narrow viewports.
- **481–1024px**: condensed table — set code, cards, live-priced,
  aggregate live value, avg delta, coverage chip. Top card moves
  to a tooltip on the set-code badge.
- **≥ 1025px**: full table from § 3.

Chase Radar uses the existing `CardRow` component in all viewports.
No new card layout invented.

## 8. Empty / degraded states

- **Set with zero live-priced cards**: row visible, all numeric
  columns show `—`, coverage chip = red `Degraded — refresh queued`.
- **Chase Radar with < 20 cards meeting the sort criteria**: render
  what's available, footer shows `Showing N of 20`.
- **No premium-metadata artifact loaded** (current production state):
  risk chips column shows `—`, no red warnings, no error toast.
  This is the correct, sample-gated state.

## 9. Forbidden language list (re-stated)

Every copy string in these surfaces must pass the `validate-ebay-comps.js`
forbidden-language regex set:

```
/\bguarantee/i, /\bguaranteed\b/i, /\bmust\s+buy\b/i, /\bsafe\s+invest/i,
/\bmoonshot\b/i, /\block\b/i, /\bprofit\s+signal\b/i
```

Plus these UX-specific bans:
- "Best deal," "deal alert," "deal of the day"
- "Top pick," "editor's pick," "investor's pick"
- "Premium opportunity," "value opportunity"
- "Coming up," "set to rise," "set to fall"
- "Smart money," "easy gain"
- "Risk-free"

## 10. Implementation gates (when operator approves)

| Gate | Why |
|------|-----|
| Bundle delta < 30 kB raw vs current 662 kB | Two new tabs shouldn't blow the budget. |
| Renders in < 50ms on a 4× CPU throttle | Aggregates are computed on demand from existing data; should be fast. |
| No new dependency | Per CLAUDE.md § 7.7. |
| `npm test` adds at least 4 new cases | (a) coverage-status chip rules, (b) estimated-card exclusion in aggregates, (c) Chase Radar sort modes, (d) forbidden-language regex coverage of new copy. |
| Smoke test on production preview | Standard PR pattern. |

## 11. Codex handoff (after operator approval)

When operator approves implementation, hand to Codex with a prompt
that:
- References this spec by section.
- Allows: `src/tabs/SetRankings.jsx` (new), `src/tabs/ChaseRadar.jsx`
  (new), `src/lib/setAggregates.js` (new — pure functions), `src/App.jsx`
  (edit — add tab entries), `src/theme.js` (edit if a new color token
  is needed; otherwise no edit), tests under `tests/`, plus the docs
  status flip.
- Forbids: `src/data.js`, all generated artifacts, all infra files.
- Requires: 4 new test cases per § 10.

A pre-staged prompt will be added to `docs/operator-handbook.md` § 4d
when operator decides to greenlight.

## 12. Cross-references

- `docs/decision-log.md` D-006 (no synthetic price movement), D-009
  (estimated cards excluded from rankings), D-014 (only show real
  data), D-043 (badge confidence rules).
- `docs/methodology-review.md` — trust-disclosure language source.
- `src/data.js` — exports `CARDS`, `SETS`, `RARITIES`,
  `HAS_LIVE_PRICES`. All inputs for these surfaces.
- `src/tabs/MarketDynamics.jsx` — current set-level surface; Set
  Rankings is the cleaner cousin.
- `src/components/CardRow.jsx` — reused verbatim by Chase Radar.

## 13. Open spec questions (parked, not blocking)

- Should Chase Radar's default N be 20 or 50? Defer until Plausible
  data shows actual table depth users scroll to.
- Should Set Rankings include a "premium metadata coverage" column
  showing what % of the set has reviewed metadata? Defer to after
  P3-012 production fill lands.
- Should there be a "Watchlist intersection" badge per Chase Radar
  row showing whether the card is in the user's local Watchlist?
  Defer; not blocking.

## 14. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-14 | Initial spec | Closes P3-010 as the spec deliverable. Implementation remains operator-gated. |
