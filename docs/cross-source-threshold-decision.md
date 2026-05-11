# Cross-Source Variance Threshold Decision (Q-003)

**Decided:** 2026-05-11
**Decider:** Claude Code (lead agent), under operator's "take charge" mandate
**Status:** active
**Closes:** Q-003 in `docs/open-questions.md`

> This is a forward-looking threshold decision. Today FusionMetrics has only
> one live price source (JustTCG) and one manual cross-reference spot-check
> (`docs/price-spot-check-2026-04-30.md`). No automated cross-source
> comparison runs anywhere in the codebase yet. The thresholds below define
> what `sourceAgreement` will mean when the second source lands; they
> formalize the placeholders in `docs/source-confidence-spec.md` § 7 into
> canonical values.

## 1. The question

At what `sourceVariance` does `sourceAgreement` flip from `aligned` to
`mixed` to `disagree` to `singleSource` to `unknown`? Per `docs/data-model-v2.md`
§ 13 and `docs/source-confidence-spec.md` § 5–8, this label drives the
source-confidence `overall` enum and feeds into UI risk surfaces.

## 2. Decision

### 2.1 Definition of `sourceVariance`

For a given card across N comparable sources (N ≥ 2):

```
sourceVariance = (max_observed_price − min_observed_price) / median_observed_price
```

Examples:
- prices `[10, 11, 12]` → variance = (12 − 10) / 11 = **0.182** (18.2%).
- prices `[5, 6, 8]`    → variance = (8 − 5) / 6  = **0.500** (50%).
- prices `[200, 210]`   → variance = (210 − 200) / 205 = **0.049** (4.9%).

Computed on observed prices only — `excluded` rows, lots, proxies, and
outlier-flagged rows are removed first per
`docs/ebay-comps-import-spec.md` § 12.

### 2.2 Base bands (all rarities, observed prices only)

| sourceVariance | sourceAgreement label |
|----------------|-----------------------|
| < 15 %         | `aligned` |
| 15 % – 35 %    | `mixed`   |
| > 35 %         | `disagree` |

These match the placeholders in `docs/source-confidence-spec.md` § 7 and
are now canonical.

### 2.3 Special-case labels

| Condition                                              | Label          |
|--------------------------------------------------------|----------------|
| Fewer than 2 comparable sources observed for the card  | `singleSource` |
| At least one source has data but none are comparable   | `unknown`      |
| No source has any reviewed observation for the card    | `unknown`      |

### 2.4 Per-rarity adjustments

Low-priced cards have higher relative noise (rounding, listing
floor-prices, free-shipping minimums). High-priced cards demand tighter
thresholds because absolute dollar differences matter more.

| Card market price (median across sources) | Aligned/mixed boundary | Mixed/disagree boundary |
|--------------------------------------------|------------------------|--------------------------|
| < $1.00       | 30 % | 60 % |
| $1.00 – $4.99 | 25 % | 50 % |
| $5.00 – $19.99 | 20 % | 40 % |
| $20.00 – $99.99 | **15 %** | **35 %** |
| ≥ $100.00 | 10 % | 25 % |

The `$20 – $99.99` row is the **default band** (matches § 2.2). Other rows
adjust outward (for low-priced noise) or inward (for high-priced
sensitivity).

### 2.5 Minimum sample size

`sourceAgreement` is **never** computed with fewer than **3 eligible
observations**. Two-observation cards report `singleSource` instead of a
variance label. Eligibility per `docs/source-confidence-spec.md` § 7
(condition class, raw/graded class, variantMatch ∈ {exact, likely}).

### 2.6 Staleness exclusion

A source observation older than **30 days** drops out of the variance
calculation entirely. If the remaining observations fall below the
minimum sample size, label becomes `singleSource` or `unknown` per §
2.3.

This is consistent with the existing 30-day JustTCG history window in
`public/priceHistory30d.json` and per-card freshness thresholds in
`CardDetail` (< 7d green, 7–21d yellow, > 21d red).

### 2.7 Hard-block flag

`sourceAgreement = disagree` is a **hard-block flag** per
`docs/source-confidence-spec.md` § 9: it prevents `overall = high`.
Combined with the existing hard blocks (`singleSource`,
`estimatedPrice`, `variantAmbiguity`, `rawGradedContamination`,
`unknownSource`), the conditions for `overall = high` remain narrow.

## 3. Rejected alternatives and why

- **Uniform thresholds across all rarities.** Rejected because the same
  variance has very different meaning at $0.50 vs. $300. A common card
  with a 30 % spread is noise; a $300 SCR with a 30 % spread is a real
  source disagreement.
- **No minimum sample size.** Rejected because computing variance from
  2 observations gives a false sense of precision.
- **Strict 5 % / 15 % bands.** Rejected because real TCG markets carry
  more noise than that, especially in thin volume windows.
- **Time-weighted variance.** Considered but rejected for v1. Adds
  complexity without obvious accuracy gain at current sample sizes.
  Revisit when there are > 100 cards with > 30 observations each.

## 4. Validator implications

A future `scripts/validate-source-confidence.js` validator should
enforce:

1. `sourceAgreement` is one of `aligned`, `mixed`, `disagree`,
   `singleSource`, `unknown`.
2. `sourceVariance` is `null` when `sourceAgreement ∈ {singleSource,
   unknown}`; otherwise a finite non-negative number.
3. `overall = high` requires `sourceAgreement ∈ {aligned, mixed}`
   AND at least 3 eligible observations AND no other hard-block flag.
4. Per-rarity band boundaries are computed from the median price band
   in § 2.4, not the row's individual price.

The validator script is **not** being authored in this run — it falls
under P2-014 (importer) territory which is operator-approval-gated.

## 5. UI implications (deferred)

When source-confidence eventually surfaces in CardDetail or Set Rankings:

- `disagree` → red-muted "Sources disagree" chip.
- `mixed`    → yellow-muted "Sources mixed" chip.
- `aligned`  → green-muted "Sources aligned" chip.
- `singleSource` → grey-muted "Single source" chip (always present today since JustTCG is the only source).
- `unknown`  → no chip (avoid surfacing absence of data as a signal).

Copy must not imply investment certainty in any branch.

## 6. Revisit triggers

Revisit this decision when **any** of:

- A second live price source is wired up (post-P2-014).
- More than ~100 cards have ≥10 comparable observations across sources.
- An observed false-positive `disagree` rate exceeds ~10 % (`disagree`
  labels that, on review, turn out to be variant mismatches not real
  source disagreement).
- An observed false-negative `aligned` rate is visible (cards labeled
  `aligned` that show wide real-world spread).

## 7. Open follow-ups

- The exact rounding rule for the per-rarity band lookup (use median
  observed price, fine — but rounded to what precision?). Recommended:
  round median to nearest cent before band lookup. Confirm at
  implementation.
- Whether to publish a public "Source Confidence Methodology" page
  alongside the existing `src/tabs/Methodology.jsx`. Deferred until a
  source-confidence artifact exists; until then the public-facing
  posture is "single source (JustTCG) — see Methodology page."

## 8. Cross-references

- `docs/open-questions.md` Q-003 — closed by this decision.
- `docs/decision-log.md` — D-037 entry added.
- `docs/source-confidence-spec.md` § 7 — placeholder thresholds now
  canonical here.
- `docs/source-confidence-spec.md` § 9 — hard-block flag list
  preserved; `disagree` joins the existing five.
- `docs/data-model-v2.md` § 13 — `source_confidence` entity references
  this doc for thresholds.
- `docs/price-spot-check-2026-04-30.md` — the only existing
  cross-source data point; 9 of 10 cards aligned, 1 unclear due to
  variant ambiguity (not variance per se).
