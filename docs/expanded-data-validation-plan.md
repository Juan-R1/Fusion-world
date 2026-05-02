# FusionMetrics Expanded Data Validation Plan

## 1. Purpose

This document defines the validation gates required before Phase 2 staging data
can become generated artifacts or user-facing app inputs.

This is a planning/spec artifact only. It does not approve validators,
generated artifacts, importers, app changes, backend work, scraping, API calls,
or workflow changes.

## 2. Validation Principle

No new market intelligence data should enter the product without a validator
that can reject bad, ambiguous, stale, overconfident, or source-less rows.

FusionMetrics should fail closed: if expanded data cannot be validated, it
should not be generated, committed, or displayed.

## 3. Current Baseline

Current active validation:

- `scripts/verify-data.js` validates the current FB01-FB09 split data shape.
- `src/livePrices.json` must contain current prices only.
- `public/priceHistory30d.json` must exist and contain valid history objects.
- Coverage guards protect the known-good live price baseline.
- Generated data files are not hand-edited.

Phase 2 validators must add checks without weakening those existing guarantees.

## 4. Validator Layers

Recommended layers, in order:

1. Source/staging file validator.
2. Importer dry-run validator.
3. Generated artifact validator.
4. App-contract validator.
5. Existing `node scripts/verify-data.js`.
6. App build/UI validation only after app code consumes the artifact.

Each layer should fail with clear messages and avoid writing partial output.

## 5. Proposed Validator Files

Future files, not approved for creation yet:

```text
scripts/validate-sb-staging.js
scripts/validate-premium-metadata.js
scripts/validate-ebay-comps.js
scripts/validate-graded-comps.js
scripts/validate-sealed-products.js
scripts/validate-source-confidence.js
scripts/validate-expanded-data.js
```

Do not create these scripts until implementation is approved. This plan defines
what they should enforce.

## 6. Shared Validation Rules

All expanded-data validators should check:

- Required files exist.
- Required headers/keys exist.
- Required fields are non-empty.
- Numeric values are finite and within allowed ranges.
- Dates/timestamps parse and use expected formats.
- Enum values are from approved vocabularies.
- URLs are present when traceability is required.
- Card codes reference canonical or staged card data.
- Set/product codes reference canonical or staged set/product data.
- Duplicate primary keys are rejected.
- Unknown fields are either rejected or warned consistently.
- Manual review fields exist where manual confidence is claimed.
- Rows with `confidence = high` satisfy all hard requirements.
- Excluded rows are preserved for audit but not used in aggregates.
- Copy/notes do not contain buy/sell/guarantee language.

## 7. Failure Behavior

Validators should:

- Print actionable errors with row/key context.
- Exit non-zero on blocking errors.
- Avoid writing output when errors exist.
- Separate warnings from errors.
- Treat missing required source URLs as errors for non-draft rows.
- Treat hard-block confidence conflicts as errors.

Validators should not:

- Auto-fix source data silently.
- Lower or change confidence silently.
- Drop rows silently.
- Write partial generated data.

## 8. SB Staging Validator

Validates future SB/starter set staging files.

Must check:

- `setCode` matches approved SB pattern.
- `productType = starter` for SB set rows.
- Card rows reference known staged sets.
- `cardCode` is unique across staged and active cards.
- `sourceCardNo` is preserved when available.
- Required card fields exist.
- Rarity values are either approved or marked for review.
- `variant` and `variantRisk` use approved vocabularies.
- Reprint rows include `originalCardCode` when known.
- Approved rows include source references.
- `reviewStatus = approved` is required before import.

Must fail when:

- A staged SB card collides with an active FB card without alias/reprint notes.
- A starter deck is treated as a booster set.
- Source references are missing.
- New rarity values are forced into current FB vocabulary without review.

## 9. Premium Metadata Validator

Validates future `premiumMetadata` artifact or fixture.

Must check:

- Every `cardCode` exists.
- `premiumFlags`, `collectorTags`, and `riskTags` use approved vocabularies.
- `confidence` is `high`, `medium`, or `low`.
- `sourceRefs` exist for every active row.
- `updatedAt` is a valid ISO timestamp.
- Rows with `manualReviewOnly` cannot be `high`.
- `gradeUpside.confirmed` or non-unknown conclusions require source-backed
  graded fields.
- Notes do not contain hype-only or investment-certainty language.

Must fail when:

- Unknown premium flags appear.
- Premium status is inferred from price only.
- `manga`, `gdr`, `godRare`, or event/promo flags lack source references.

## 10. eBay Sold Comps Validator

Validates future manual eBay sold comps CSV.

Must check:

- Required headers exist.
- `listingId` or approved draft placeholder exists.
- `cardCode` exists or is routed to review.
- Prices are finite and positive.
- `shipping` and `totalPrice` are non-negative when present.
- `soldDate` is valid.
- `rawOrGraded`, `variantMatch`, `itemType`, and `confidence` use approved
  vocabularies.
- `quantity` is a positive integer.
- `sourceUrl` exists for non-draft rows.
- Graded rows have grade company and grade.
- Raw rows do not include graded-only conclusions.
- `confidence = high` is blocked by ambiguous variants, lots, missing URL, or
  raw/graded contamination.
- Duplicate `listingId` rows are rejected unless explicitly marked as a
  correction.

Must fail when:

- Rows imply guaranteed sale value.
- Raw and graded data would be aggregated together.
- Excluded rows are included in default aggregate outputs.

## 11. Graded Comps Validator

Validates future graded comps CSV/artifact.

Must check:

- Required headers exist.
- `compId` is unique.
- `cardCode` exists or is routed to review.
- Grade company is approved.
- Grade is present.
- Prices are finite and positive.
- Sale date is valid.
- Source URL exists for non-draft rows.
- `variantMatch` and `confidence` are valid.
- Population fields are consistent.
- `populationKnown = true` requires `populationCount`.
- Hard blockers prevent `high` confidence.

Must fail when:

- Raw and graded rows are mixed.
- Variant is ambiguous but confidence is high.
- Grade company or grade is missing.
- Grade-upside copy implies guaranteed profit.

## 12. Sealed Products Validator

Validates future sealed products CSV/artifact.

Must check:

- `productCode` is unique.
- Product type uses approved vocabulary.
- Linked `setCode` values exist or are staged.
- `containsSetCodes` values exist or are staged.
- Prices are finite and positive when present.
- Pack/card counts are positive integers when present.
- Timestamp and reviewed dates are valid.
- Source URL exists for non-draft priced rows.
- Confidence labels are valid.
- Starter decks are not marked as booster boxes.
- Hard blockers prevent `high` confidence.

Must fail when:

- Active listings are treated as sold comps.
- Starter decks are routed into booster-box EV logic.
- Product type/region/language ambiguity is hidden.
- Sealed-price copy implies guaranteed returns.

## 13. Source Confidence Validator

Validates future `sourceConfidence` artifact.

Must check:

- Every key references an existing card.
- `overall` is valid.
- `score`, if present, is an integer from 0 to 100.
- Component values use approved vocabularies.
- Flags use approved vocabulary.
- Hard-block flags prevent `overall = high`.
- `updatedAt` is valid.
- Summary copy does not include buy/sell/guarantee language.
- Source references exist for multi-source or manual conclusions.

Must fail when:

- A single-source card is labeled high confidence.
- Estimated prices are labeled high confidence.
- Variant ambiguity is hidden.
- Confidence is presented as investment quality.

## 14. Generated Artifact Validation

Before generated artifacts are committed:

- The source/staging validator must pass.
- The importer must run in dry-run mode and report row counts.
- The generated artifact validator must pass.
- `node scripts/verify-data.js` must still pass.
- If app code consumes the artifact, `npm run build` must pass.
- The diff must show generated output only in approved generated paths.

Generated artifact diffs should be reviewed for:

- Unexpected row count drops.
- New unknown card/set keys.
- Missing source URLs.
- Large confidence shifts.
- Stale timestamps.
- Variant ambiguity hidden by aggregation.

## 15. App-Contract Validation

If app code later consumes expanded artifacts, validation must confirm:

- Missing artifact has a safe UI state.
- Invalid artifact shape does not crash the app.
- LIVE/EST labels remain intact.
- Existing JustTCG provenance/freshness remains intact.
- Estimated rows are not represented as live market observations.
- Raw, graded, sealed, and estimated data stay visually distinct.
- `npm run build` passes.
- `node scripts/verify-data.js` passes.

## 16. Workflow and CI Integration Later

Do not add validators to workflows until:

- The validator exists.
- A sample fixture exists.
- The user approves CI/workflow integration.
- The task explicitly allows `.github/` changes.

When approved, prefer a dedicated validation command over weakening
`scripts/verify-data.js`.

## 17. Manual Review Rules

Manual review is acceptable for early Phase 2, but it must be auditable:

- Reviewer field when practical.
- Review timestamp.
- Source URL or source ID.
- Confidence label.
- Notes for ambiguity.
- Excluded rows retained when useful for audit.

Manual review must not become a shortcut for high confidence without sources.

## 18. Stop Conditions

Stop expanded-data work if:

- A task requires generated data edits before validators exist.
- A task requires scraping/API calls without approval.
- A task requires backend/database work before trigger criteria are met.
- A task would weaken current `verify-data` coverage guards.
- A task would mix raw/graded/sealed data.
- A task would hide source disagreement or variant ambiguity.
- A task would imply investment certainty.
- A validator cannot fail closed without partial output.

## 19. Recommended Next Step

The next checklist item after this plan is `P2-011 Add staging directory
structure, docs only first`, but it is marked `Needs user approval`.

Before approving P2-011, confirm:

- The staging directory names are acceptable.
- No generated artifacts will be created.
- No external source scraping/API calls will occur.
- Validation remains docs-only: `git diff --check` and
  `node scripts/verify-data.js`.
