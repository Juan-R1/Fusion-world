# FusionMetrics Premium Metadata Schema

## 1. Purpose

Premium metadata identifies collector-relevant cards and known risk context
without pretending to predict returns. It is the foundation for future premium
badges, chase filters, Chase Radar, set-level chase analysis, and Watchlist
premium exposure.

This document is a schema/spec only. It does not approve generated data edits,
UI badges, scraping, backend work, or investment scoring.

## 2. Design Principles

- Premium metadata is classification, not a buy/sell signal.
- Premium labels must be explainable through card identity, printed rarity,
  treatment, product role, or reviewed source notes.
- Do not infer premium status from price alone.
- Do not infer market strength from premium status alone.
- Separate collector tags from risk tags.
- Separate metadata confidence from price/source confidence.
- Use `unknown` or omit optional fields instead of inventing certainty.
- Every metadata row needs source references or review notes before it can
  become an active artifact.

## 3. Proposed Artifact

Future artifact, not approved for creation yet:

```text
public/premiumMetadata.json
```

Recommended shape:

```json
{
  "version": 1,
  "updatedAt": "2026-05-01T00:00:00.000Z",
  "items": {
    "FB09-123": {
      "cardCode": "FB09-123",
      "premiumFlags": ["gogetaChase", "sealedChase"],
      "collectorTags": ["fusionCharacter", "setChase"],
      "riskTags": ["variantAmbiguity"],
      "gradeUpside": {
        "status": "unknown",
        "notes": "No reviewed graded comps yet."
      },
      "confidence": "medium",
      "sourceRefs": ["manual-review"],
      "notes": "Illustrative only until source-backed fixture is approved.",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  }
}
```

Do not create this artifact until the user approves fixture work and a
validator exists.

## 4. Entity: `premium_metadata`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cardCode` | string | Yes | Must exist in canonical card data. |
| `premiumFlags` | array<enum> | Yes | Core premium classifications. May be empty only for explicit negative review rows. |
| `collectorTags` | array<enum> | Recommended | Collector-demand descriptors. These are not observed demand metrics. |
| `riskTags` | array<enum> | Recommended | Known caveats and data risks. |
| `gradeUpside` | object | Recommended | Graded-market context. Must be cautious and can be `unknown`. |
| `confidence` | enum[`high`, `medium`, `low`] | Yes | Confidence in metadata classification only. |
| `sourceRefs` | array<string> | Yes | Source IDs, URLs, or `manual-review` placeholder during draft fixture work. |
| `notes` | nullable<string> | Optional | Short human rationale. |
| `updatedAt` | isoDateTime | Yes | Last metadata review timestamp. |

## 5. `premiumFlags` Vocabulary

These are mutually composable flags. A card may have multiple flags.

| Flag | Meaning | Use when | Do not use when |
|------|---------|----------|-----------------|
| `manga` | Official manga-style premium chase treatment. | The card is verified as manga treatment. | The card only has popular manga character art but no verified treatment. |
| `mangaAdjacent` | Visually or collector-adjacent to manga chase cards, but not official manga. | A reviewed source or product context supports the label. | The label is just hype or price-driven. |
| `godRare` | God Rare / God Rare-like premium designation. | The printed rarity/product source confirms it. | The card merely has "God" in character/trait text. |
| `gdr` | GDR rarity/designation. | The product/card source confirms GDR. | Rarity is inferred from external listing title only. |
| `altArt` | Alternate-art treatment. | Card is confirmed as alternate art or parallel art. | Base art and alt art cannot be separated. |
| `secretRareChase` | Secret Rare chase in its product context. | SCR is a meaningful chase role for the set/product. | Every SCR should not automatically get this without review. |
| `specialRareChase` | Special Rare chase in its product context. | SPR is present and source-confirmed. | Current data has no active SPR rows. |
| `sealedChase` | Card materially affects sealed-product chase appeal. | Card is a known chase for opening sealed product. | No sealed product context exists. |
| `gogetaChase` | Gogeta-focused premium collector chase. | Gogeta/Gogeta variant is verified and context supports chase status. | Card is a low-context Gogeta common with no source-backed chase role. |
| `sonGokuChase` | Son Goku-focused premium collector chase. | Source/context supports premium chase status. | Card is ordinary base Goku without premium context. |
| `brolyChase` | Broly-focused premium collector chase. | Source/context supports premium chase status. | Card is ordinary base Broly without premium context. |
| `eventPromo` | Event or tournament promo. | Source confirms event/promo distribution. | Same card number exists as base and promo but variant is unclear. |
| `winnerPromo` | Winner-stamped or winner-distribution promo. | Source confirms winner variant. | Listing title merely says "winner" without card/source confirmation. |
| `serialized` | Serialized/numbered card. | Source confirms serialized print. | Card is simply scarce or expensive. |
| `starterDeckChase` | Premium card inside starter deck product context. | SB/starter source supports it. | Starter set support has not been staged yet. |

Validator notes:

- Unknown flags must fail validation.
- `godRare` and `gdr` are separate until official naming is normalized.
- `manga` and `mangaAdjacent` may coexist only with explicit review notes.
- Event/promo flags should require variant/risk review.

## 6. `collectorTags` Vocabulary

Collector tags describe why a card may matter to collectors. They should not be
displayed as observed demand unless backed by external demand data.

| Tag | Meaning |
|-----|---------|
| `fusionCharacter` | Fusion character such as Gogeta or Vegito. |
| `heroCharacter` | Major hero character. |
| `villainCharacter` | Major villain/antagonist character. |
| `fanFavorite` | Known fan-favorite character or form, source/review backed. |
| `setChase` | Reviewed as one of the set's main chase cards. |
| `boxTopHit` | Appears among top Box EV contributors in current model. |
| `artDriven` | Collector appeal is materially art/treatment-driven. |
| `playabilityRelevant` | Gameplay relevance is part of collector/player demand. Requires source notes. |
| `lowPopulationPotential` | Might have graded scarcity interest, but population data is not confirmed. |
| `nostalgiaAppeal` | Character/form has broader franchise nostalgia appeal. |
| `newReleaseAttention` | Recent product/card likely has attention due to release timing. |

Rules:

- `fanFavorite`, `playabilityRelevant`, and `setChase` require notes or source
  references.
- `boxTopHit` is derived from current model output and must be recalculable if
  used in generated artifacts.
- Collector tags must not become hidden price multipliers without a separate
  approved methodology.

## 7. `riskTags` Vocabulary

Risk tags prevent premium metadata from overclaiming.

| Tag | Meaning |
|-----|---------|
| `variantAmbiguity` | Sources may mix base, promo, alt-art, manga, reprint, or parallel versions. |
| `rawGradedContamination` | Raw and graded sales/listings are likely mixed in public sources. |
| `lowVolume` | Too few sales/observations for strong price conclusions. |
| `stalePrice` | Current price source may be old or carried forward. |
| `sourceDisagreement` | Comparable sources disagree materially. |
| `reprintRisk` | Future or existing reprint may affect market interpretation. |
| `sealedVariance` | Sealed-product conclusions are highly variance-dependent. |
| `manualReviewOnly` | Metadata is draft/manual and not ready for automated UI claims. |
| `unverifiedTreatment` | Treatment/variant label is not fully source-confirmed. |
| `thinMarket` | Market depth is too thin for strong conclusions. |

Rules:

- Risk tags should be visible or summarized before investor-style UI is built.
- `variantAmbiguity` should be common until source matching is strong.
- `manualReviewOnly` rows should not drive rankings.

Source-data-quality flags (`singleSource`, `stalePrice`, `lowVolume`, etc.) live in `docs/source-confidence-spec.md` § 8. These two vocabularies overlap but are not identical — premium `riskTags` describe long-lived classification risk; source-confidence flags describe data-quality at the moment of observation.

## 8. `gradeUpside` Shape

Grading context is optional and should usually be `unknown` until graded comps
exist.

Recommended shape:

```json
{
  "status": "unknown",
  "rawReferencePrice": null,
  "gradedReferencePrice": null,
  "gradeCompany": null,
  "grade": null,
  "estimatedFees": null,
  "spread": null,
  "confidence": "low",
  "sourceRefs": [],
  "notes": "No reviewed graded comps yet."
}
```

Fields:

| Field | Type | Notes |
|-------|------|-------|
| `status` | enum[`unknown`, `notReviewed`, `candidate`, `confirmed`, `avoid`] | `confirmed` requires graded comps. |
| `rawReferencePrice` | nullable<number> | Source-backed raw price. |
| `gradedReferencePrice` | nullable<number> | Source-backed graded price. |
| `gradeCompany` | nullable<enum[`PSA`, `BGS`, `CGC`, `TAG`, `other`]> | Required when graded reference is present. |
| `grade` | nullable<string> | Preserve exact grade text. |
| `estimatedFees` | nullable<number> | Must be labeled assumption if used. |
| `spread` | nullable<number> | Derived, not guaranteed. |
| `confidence` | enum[`high`, `medium`, `low`, `unknown`] | Confidence in grade-upside context. |
| `sourceRefs` | array<string> | Required for non-unknown conclusions. |
| `notes` | nullable<string> | Short caveat. |

Rules:

- No raw-to-grade arbitrage UI until graded comps spec and fixtures exist.
- Never show grade upside as guaranteed profit.
- Fees, shipping, taxes, liquidity, and grading turnaround must be caveated if
  grade upside is ever surfaced.

## 9. Confidence Rules

Metadata confidence answers: "How confident are we that this card has this
premium classification?" It does not answer: "How good is this investment?"

| Confidence | Requirements |
|------------|--------------|
| `high` | Official/card-source confirmation, exact cardCode match, treatment clear, no major variant ambiguity. |
| `medium` | Strong manual review, likely exact match, but one unresolved caveat such as variant naming or source split. |
| `low` | Draft classification, source ambiguity, or known mismatch risk. Should not drive rankings. |

Rules:

- `low` confidence rows may be useful for research but should not power strong
  user-facing claims.
- Any row with `riskTags` containing `manualReviewOnly` should be treated as
  `low` for ranking purposes.

## 10. Example Rows

These examples are illustrative schema examples only. They are not active data
and should not be copied into generated artifacts without review.

```json
{
  "cardCode": "FB09-123",
  "premiumFlags": ["gogetaChase", "sealedChase", "secretRareChase"],
  "collectorTags": ["fusionCharacter", "setChase", "nostalgiaAppeal"],
  "riskTags": ["variantAmbiguity", "thinMarket"],
  "gradeUpside": {
    "status": "unknown",
    "confidence": "unknown",
    "sourceRefs": [],
    "notes": "No reviewed graded comps yet."
  },
  "confidence": "medium",
  "sourceRefs": ["manual-review"],
  "notes": "Illustrative: Gogeta SCR from Dual Evolution needs source-backed variant review.",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

```json
{
  "cardCode": "SB01-XXX",
  "premiumFlags": ["starterDeckChase"],
  "collectorTags": ["newReleaseAttention"],
  "riskTags": ["manualReviewOnly", "unverifiedTreatment"],
  "gradeUpside": {
    "status": "notReviewed",
    "confidence": "unknown",
    "sourceRefs": [],
    "notes": "Starter set staging is not active yet."
  },
  "confidence": "low",
  "sourceRefs": ["manual-review"],
  "notes": "Placeholder pattern for future SB rows only.",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

## 11. Validation Requirements

A future premium metadata validator should enforce:

- Root object has `version`, `updatedAt`, and `items`.
- Each item key matches `item.cardCode`.
- `cardCode` exists in canonical card data.
- `premiumFlags`, `collectorTags`, and `riskTags` contain known vocabulary
  values only.
- `confidence` is one of `high`, `medium`, `low`.
- `sourceRefs` is a non-empty array.
- `updatedAt` is a valid ISO timestamp.
- `gradeUpside.status` is a known value.
- `gradeUpside` cannot claim `confirmed` without at least one source ref and
  graded reference field.
- Rows with `manualReviewOnly` cannot be used in rankings.
- Rows with unknown or invalid card codes must fail validation.

## 12. Future UI Rules

Do not build UI yet. When approved later:

- Badges should be compact and descriptive, not hype language.
- Suggested labels:
  - `Manga`
  - `Manga-adjacent`
  - `God Rare`
  - `GDR`
  - `Alt Art`
  - `Set Chase`
  - `Sealed Chase`
  - `Gogeta Chase`
- Risk context should be visible near premium context.
- Premium filters should not imply profitability.
- Chase Radar must rank evidence quality and concentration risk separately
  from price movement.
- Methodology must explain premium metadata before UI launch.

Avoid labels like:

- `Guaranteed hit`
- `Must buy`
- `Profit card`
- `Safe investment`
- `Moonshot`
- `Lock`

## 13. Migration Path

1. Finish this schema.
2. Design SB01/SB02 staging schema.
3. Design expanded validation guard plan.
4. Ask user approval before creating any staging fixture.
5. Create a tiny premium metadata fixture only after approval.
6. Build a validator before the fixture becomes product input.
7. Only then consider UI badges or filters.

## 14. Open Questions

- Should `GDR` be modeled as a rarity, a premium flag, or both?
- Which official or public source should be canonical for treatment names?
- Should promo variants get separate `cardCode` values or an alias table?
- What confidence level is acceptable before a premium badge appears in UI?
- Should `boxTopHit` be stored or derived at runtime from Box EV output?
