# FusionMetrics Source Confidence Spec

## 1. Purpose

This document defines how FusionMetrics should describe market data confidence
once multiple sources, sold comps, graded comps, sealed products, and premium
metadata exist.

This is a spec only. It does not approve generated artifacts, UI changes,
importers, scraping, backend work, or new formulas.

## 2. Principle

Source confidence is a caution system, not an investment score.

It should answer: "How trustworthy and complete is the current market picture
for this card or product?" It must not answer: "Should I buy this?"

## 3. Current Baseline

Current active confidence is simple:

- JustTCG live prices are labeled `LIVE` with medium confidence.
- Model-estimated prices are labeled `EST` with low confidence.
- Per-card freshness shows how old the JustTCG timestamp is.
- Provenance shows the latest rotation/merge run.
- The Methodology page explains estimates, rotation, and model limits.

Phase 2 source confidence should extend this model only after new source data
exists.

## 4. Proposed Future Artifact

Future artifact, not approved for creation yet:

```text
public/sourceConfidence.json
```

Recommended shape:

```json
{
  "version": 1,
  "updatedAt": "2026-05-01T00:00:00.000Z",
  "items": {
    "FB03-009": {
      "cardCode": "FB03-009",
      "overall": "medium",
      "score": 68,
      "components": {
        "sourceAgreement": "unknown",
        "freshness": "fresh",
        "volume": "unknown",
        "variantClarity": "medium",
        "outlierRisk": "unknown"
      },
      "flags": ["singleSource"],
      "summary": "JustTCG live price is fresh, but no reviewed sold comps exist.",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  }
}
```

Do not create this artifact until source data fixtures and validators are
approved.

## 5. Entity: `source_confidence`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cardCode` | string | Yes | Must exist in canonical card data. |
| `overall` | enum[`high`, `medium`, `low`, `unknown`] | Yes | User-facing confidence label. |
| `score` | integer 0-100 | Optional | Internal display helper. Must be paired with label/caveats. |
| `components` | object | Yes | Breakdown by data-quality dimension. |
| `flags` | array<enum> | Yes | Specific cautions. |
| `summary` | string | Recommended | Short human-readable reason. |
| `sourceRefs` | array<string> | Recommended | Source IDs/artifacts used to compute confidence. |
| `updatedAt` | isoDateTime | Yes | Last confidence computation/review. |

## 6. Confidence Labels

| Label | Meaning | Required conditions |
|-------|---------|---------------------|
| `high` | Multiple reviewed sources broadly agree, data is fresh enough, variant is clear, and volume is adequate. | Requires more than one source and no major risk flags. |
| `medium` | Source picture is useful but incomplete, single-source, lightly stale, or has minor variant/volume caveats. | Current JustTCG-only live rows usually fit here. |
| `low` | Estimate, stale source, thin market, variant ambiguity, source disagreement, or known outlier risk. | Must show caution copy. |
| `unknown` | Not enough source data to evaluate. | Use when no live price or reviewed comps exist. |

Rules:

- `high` cannot be assigned from JustTCG alone.
- `high` cannot be assigned when variant ambiguity is material.
- `low` is not a bad-card label; it is a data-quality label.
- Estimated prices should default to `low` or `unknown`.

## 7. Component Dimensions

### Source agreement

Measures whether comparable sources are directionally aligned.

Suggested values:

- `aligned`: Reviewed sources are within a defined tolerance.
- `mixed`: Sources differ but not enough to flag major disagreement.
- `disagree`: Sources diverge materially.
- `singleSource`: Only one source exists.
- `unknown`: No comparable source exists.

Initial tolerance guidance:

- Under 15% variance: `aligned`.
- 15%-35% variance: `mixed`.
- Over 35% variance: `disagree`.

These thresholds are starting points and must be revisited after real fixtures.

### Freshness

Uses source timestamps.

Suggested values:

- `fresh`: active price source is under 7 days old.
- `aging`: 7-21 days old.
- `stale`: over 21 days old.
- `unknown`: missing/invalid timestamp or estimate-only.

### Volume

Uses reviewed sold-comp counts once comps exist.

Suggested values:

- `adequate`: at least 5 eligible comps in the selected window.
- `thin`: 1-4 eligible comps.
- `none`: no eligible comps.
- `unknown`: comps source not reviewed.

Do not use active listings as sold volume.

### Variant clarity

Measures whether sources refer to the same card/treatment.

Suggested values:

- `high`: exact card code and treatment match.
- `medium`: likely match with minor uncertainty.
- `low`: likely source mixing.
- `unknown`: no reviewed variant data.

### Outlier risk

Measures whether observations look distorted.

Suggested values:

- `low`: no flagged outliers and enough comparable observations.
- `medium`: one caution or thin data.
- `high`: multiple outliers, suspicious sale pattern, or source mismatch.
- `unknown`: not enough observations.

## 8. Flags Vocabulary

| Flag | Meaning |
|------|---------|
| `singleSource` | Only one active price source exists. |
| `estimatedPrice` | Current market value is model-estimated. |
| `stalePrice` | Current live price timestamp is over 21 days old. |
| `agingPrice` | Current live price timestamp is 7-21 days old. |
| `lowVolume` | Too few eligible sold comps. |
| `noSoldComps` | No reviewed sold comps exist. |
| `sourceDisagreement` | Comparable sources materially disagree. |
| `variantAmbiguity` | Sources may mix base, promo, reprint, alt-art, manga, or other variants. |
| `rawGradedContamination` | Raw and graded observations are likely mixed. |
| `outlierRisk` | One or more observations should be excluded or reviewed. |
| `sealedVariance` | Sealed-product interpretation is unusually variance-dependent. |
| `manualReviewOnly` | Confidence depends on manual review and should not drive strong claims. |
| `unknownSource` | Source identity or URL is missing/insufficient. |

Unknown flags should fail validation.

## 9. Draft Scoring Model

If a numeric score is used, keep it secondary to labels and flags.

Starting score: `100`

Suggested deductions:

| Issue | Deduction |
|-------|-----------|
| Single source only | -20 |
| Estimated price | -35 |
| Aging price | -10 |
| Stale price | -25 |
| No sold comps when comps are expected | -15 |
| Thin sold comps | -10 |
| Source disagreement | -25 |
| Variant ambiguity | -30 |
| Raw/graded contamination | -30 |
| High outlier risk | -25 |
| Missing source URL in manual data | -40 |

Label mapping:

- `80-100`: high, only if multiple-source and no hard-block flags.
- `50-79`: medium.
- `1-49`: low.
- `0` or insufficient inputs: unknown.

Hard-block flags that prevent `high`:

- `singleSource`
- `estimatedPrice`
- `sourceDisagreement`
- `variantAmbiguity`
- `rawGradedContamination`
- `unknownSource`

## 10. Card-Level Summary Rules

CardDetail copy should eventually be plain language:

- "Medium confidence: JustTCG price is fresh, but no reviewed sold comps exist."
- "Low confidence: sources may be mixing base and promo variants."
- "Low confidence: current price is model-estimated."
- "Unknown confidence: no reviewed market source is available."

Do not use phrases like:

- "safe buy"
- "guaranteed"
- "undervalued for sure"
- "investment grade"
- "profit signal"

## 11. Set-Level Summary Rules

Set-level confidence should aggregate cards cautiously.

Potential future metrics:

- Live-price coverage.
- Fresh/aging/stale share.
- Share of cards with source disagreement.
- Share of premium cards with variant ambiguity.
- Share of top value concentrated in low-confidence rows.

Do not show a set as "safe" because source confidence is high. Confidence is
about data quality, not expected return.

## 12. Watchlist Rules

Watchlist may eventually summarize source risk per position:

- Current price source is live or estimated.
- Freshness label.
- Source confidence label.
- Variant/low-volume warnings.

Potential copy:

"Unrealized P/L is based on current FusionMetrics price. Low-confidence rows
may be affected by stale prices, thin comps, or variant ambiguity."

## 13. Validation Requirements

A future source-confidence validator must check:

- Every key references an existing card.
- `overall` is valid.
- `score`, if present, is an integer from 0 to 100.
- Component values use approved vocabularies.
- Flags use approved vocabulary.
- Hard-block flags prevent `high`.
- `updatedAt` is valid ISO datetime.
- Summary copy does not contain buy/sell/guarantee language.
- Manual-source rows include source references.

## 14. UI Integration Later

Potential future UI:

- CardDetail Source Confidence panel.
- Watchlist low-confidence warnings.
- Market Dynamics set confidence summary.
- Chase Radar risk filters.

UI must separate:

- price status (`LIVE` / `EST`)
- source confidence
- freshness
- premium metadata
- investment/user interpretation

## 15. Stop Conditions

Stop source-confidence work if:

- It would compute confidence without enough source fields.
- It would imply investment quality instead of data quality.
- It would hide variant ambiguity.
- It would mix raw and graded markets.
- It would need generated artifact edits before validators exist.
- It would require scraping/API calls or backend work without approval.

Next safe task after this spec: `P2-008 Design graded comps spec`.
