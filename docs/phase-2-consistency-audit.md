# Phase 2 Specs Internal-Consistency Audit

**Audit date:** 2026-05-07
**Audit task:** CLA-01 of the Claude Code architectural-audit run
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Baseline commit:** `5c1efa8 chore: weekly price update` (HEAD)

## 1. Purpose

Codex's May 2026 Phase 2 wave shipped eight schema/spec documents in rapid
succession. Each doc is internally coherent, but cross-doc consistency is
where drift hides — the kind that breaks validators later or surfaces as
"this field exists in two specs with different names" during implementation.

This audit checks for: vocabulary collisions, entity-field-name mismatches,
enum drift, broken cross-references, and required-vs-optional disagreement
across the Phase 2 spec set. Every finding cites file paths and section
numbers. A canonical resolution is recommended for each divergence.

The audit produces no code or schema changes — only a written record. The
canonical resolutions are suggestions for a follow-up task (likely
spec-edit commits under explicit operator approval).

## 2. Method

For each pair of specs that overlap on an entity, vocabulary, or field:

1. Pull the relevant subsections side by side.
2. Compare values exactly, not just by intent.
3. Note whether the divergence is meaningful (changes validator behavior or
   UI semantics) or cosmetic (same concept, alternate name).
4. Rank: **drift** (must reconcile before staged data lands), **divergence**
   (intentional but undocumented — should be annotated), **cosmetic** (style
   only, optional).

## 3. Specs Reviewed

All paths relative to repo root; all docs current as of `5c1efa8`.

| Spec | Path | Phase 2 task |
|------|------|--------------|
| Data Model v2 | `docs/data-model-v2.md` | P2-003 (`553400c`) |
| Premium Metadata Schema | `docs/premium-metadata-schema.md` | P2-004 (`4770375`) |
| SB Set Staging | `docs/sb-set-staging-spec.md` | P2-005 (`5b1f7a8`) |
| eBay Sold Comps Import | `docs/ebay-comps-import-spec.md` | P2-006 (`0b70442`) |
| Source Confidence | `docs/source-confidence-spec.md` | P2-007 (`63a7dec`) |
| Graded Comps | `docs/graded-comps-spec.md` | P2-008 (`fcb13cf`) |
| Sealed Products | `docs/sealed-products-spec.md` | P2-009 (`252c3c3`) |
| Expanded Data Validation Plan | `docs/expanded-data-validation-plan.md` | P2-010 (`b979b72`) |
| Phase 2 Expansion Plan | `docs/phase-2-data-expansion-plan.md` | P2-001 (`ee6b6c4`) |
| Phase 2 Execution Checklist | `docs/phase-2-execution-checklist.md` | P2-002 (`ee6b6c4`) |

## 4. Vocabulary Consistency Audit

### 4.1 `confidence` enum coverage by entity

The `confidence` field appears across nearly every Phase 2 entity, but the
exact allowed values differ. This is intentional in some cases and drift in
others.

| Entity | Spec source | `high` | `medium` | `low` | `excluded` | `unknown` |
|---|---|:-:|:-:|:-:|:-:|:-:|
| `premium_metadata` | `premium-metadata-schema.md` § 4 | ✓ | ✓ | ✓ | — | — |
| `card_market_snapshots` | `data-model-v2.md` § 8 | ✓ | ✓ | ✓ | ✓ | — |
| `price_history` | `data-model-v2.md` § 9 | ✓ | ✓ | ✓ | — | — |
| `ebay_sold_comps` | `ebay-comps-import-spec.md` § 5; `data-model-v2.md` § 10 | ✓ | ✓ | ✓ | ✓ | — |
| `graded_comps` | `graded-comps-spec.md` § 6; `data-model-v2.md` § 11 | ✓ | ✓ | ✓ | ✓ | — |
| `sealed_products` | `sealed-products-spec.md` § 6; `data-model-v2.md` § 12 | ✓ | ✓ | ✓ | ✓ | ✓ |
| `source_confidence.overall` | `source-confidence-spec.md` § 5–6 | ✓ | ✓ | ✓ | — | ✓ |

**Semantic legend**:
- `excluded` = row exists but **must not** be used in aggregates.
- `unknown` = insufficient info to assign a confidence label.

**Reading:**
- `excluded` makes sense only for comp/snapshot entities (eBay, graded,
  sealed, snapshots) — rows that are kept for audit but blocked from
  analytics.
- `unknown` makes sense for `source_confidence` (an aggregate label that
  may genuinely have no input) and `sealed_products` (a product can exist
  without a known sealed price).
- `premium_metadata` and `price_history` use the minimal 3-value set —
  reasonable since they're classification or observed-data tables where
  every row should commit to a confidence.

**Status:** intentional divergence; document explicitly in
`data-model-v2.md` § 4 (Type Conventions) so the differences are
auditable, not surprising. **Cosmetic + needs annotation.**

### 4.2 `premiumFlags` vocabulary divergence

`premium-metadata-schema.md` § 5 defines the canonical list (15 flags):
`manga`, `mangaAdjacent`, `godRare`, `gdr`, `altArt`, `secretRareChase`,
`specialRareChase`, `sealedChase`, `gogetaChase`, `sonGokuChase`,
`brolyChase`, `eventPromo`, `winnerPromo`, `serialized`, `starterDeckChase`.

`data-model-v2.md` § 7 lists only 10: `manga`, `mangaAdjacent`, `godRare`,
`gdr`, `altArt`, `sealedChase`, `gogetaChase`, `eventPromo`, **`winner`**,
`serialized`.

`phase-2-data-expansion-plan.md` § 8 lists the same 10 as `data-model-v2.md`
including `winner`.

`sb-set-staging-spec.md` § 11 names a partial set of possible labels for
SB context: `starterDeckChase`, `gogetaChase`, `godRare`, `gdr`, `altArt`,
`mangaAdjacent`.

**Drift findings:**

- **Drift A1**: `data-model-v2.md` § 7 uses `winner`; the schema doc uses
  `winnerPromo`. These are the same concept under different names. The
  schema doc is the canonical schema; data-model-v2 and the expansion plan
  should both rename to `winnerPromo`.
- **Drift A2**: `data-model-v2.md` § 7 and the expansion plan list 10 flags
  out of 15. They are missing `secretRareChase`, `specialRareChase`,
  `sonGokuChase`, `brolyChase`, `starterDeckChase`. Either reference the
  schema doc instead of duplicating the list, or duplicate the full list.

**Status:** real drift; will cause validator failures if not reconciled.
The schema doc is canonical; the other two need to defer to it.

### 4.3 `riskTags` vocabulary divergence

`premium-metadata-schema.md` § 7 defines the canonical list (10 tags):
`variantAmbiguity`, `rawGradedContamination`, `lowVolume`, `stalePrice`,
`sourceDisagreement`, `reprintRisk`, `sealedVariance`, `manualReviewOnly`,
`unverifiedTreatment`, `thinMarket`.

`data-model-v2.md` § 7 lists 6: `variantAmbiguity`, `lowVolume`,
`stalePrice`, `reprintRisk`, **`gradedContamination`**, `sourceDisagreement`.

**Drift findings:**

- **Drift B1**: `data-model-v2.md` § 7 uses `gradedContamination`; the
  schema doc and `source-confidence-spec.md` § 8 both use
  `rawGradedContamination`. Same concept, different name.
- **Drift B2**: `data-model-v2.md` § 7 has 6 tags; the schema doc has 10.
  Missing: `sealedVariance`, `manualReviewOnly`, `unverifiedTreatment`,
  `thinMarket`. Same recommendation as A2 — defer to schema or duplicate
  the full list.

### 4.4 `source-confidence` flags vs `premium-metadata` riskTags

These are similar but **not the same** vocabulary, and the audit should
note this so future agents don't accidentally merge them.

`source-confidence-spec.md` § 8 flags (13):
`singleSource`, `estimatedPrice`, `stalePrice`, `agingPrice`, `lowVolume`,
`noSoldComps`, `sourceDisagreement`, `variantAmbiguity`,
`rawGradedContamination`, `outlierRisk`, `sealedVariance`,
`manualReviewOnly`, `unknownSource`.

`premium-metadata-schema.md` § 7 riskTags (10):
`variantAmbiguity`, `rawGradedContamination`, `lowVolume`, `stalePrice`,
`sourceDisagreement`, `reprintRisk`, `sealedVariance`, `manualReviewOnly`,
`unverifiedTreatment`, `thinMarket`.

Shared: 7 tags (`variantAmbiguity`, `rawGradedContamination`, `lowVolume`,
`stalePrice`, `sourceDisagreement`, `sealedVariance`, `manualReviewOnly`).

`source-confidence` adds 6 source/freshness/volume tags that describe data
quality. `premium_metadata` adds 3 collector/market-structure tags that
describe long-lived classification risk.

**Status:** intentional divergence. Cosmetic; recommend a small note in
both specs cross-referencing each other so the distinction is preserved.

### 4.5 `variant` vocabulary

| Spec | Vocabulary |
|------|------------|
| `ebay-comps-import-spec.md` § 5–6 | `base, altArt, manga, godRare, gdr, promo, reprint, foil, sealed, unknown` + "reviewed source wording" |
| `graded-comps-spec.md` § 6 | `base, manga, altArt, promo, reprint, GDR, unknown` + "etc." |
| `sb-set-staging-spec.md` § 7 | `base, foil, altArt, promo, reprint, unknown` (6 values) |
| `data-model-v2.md` § 8 | `variant: nullable<string>` — open string, no enum |

**Drift findings:**

- **Drift C1**: `graded-comps-spec.md` uses **`GDR`** (uppercase) while
  `ebay-comps-import-spec.md` uses **`gdr`** (lowercase). Same value,
  different casing. Validators will treat them as distinct unless
  case-folded.
- **Divergence C2**: SB staging is more restrictive (6 values, no
  `manga` / `godRare` / `gdr`) than eBay (10 values). This is intentional —
  SB staging is a stricter canonical-card pipeline; eBay is open-ended
  source data. Document explicitly in both specs.

**Status:** C1 is real drift (validator break); C2 is intentional and
should be annotated.

### 4.6 Confirmed-consistent vocabularies

- `rawOrGraded` — `raw, graded, sealed, unknown` everywhere it appears.
- `variantMatch` — `exact, likely, ambiguous, mismatch, excluded`
  everywhere it appears (eBay, graded, data-model-v2 § 10/11).
- `productType` (sealed) — `boosterBox, starterDeck, case, pack, bundle,
  premiumSet, other` in `sealed-products-spec.md` § 7 matches
  `data-model-v2.md` § 12.
- `gradeCompany` enum values — `PSA, BGS, CGC, TAG, other` consistent
  across `graded-comps-spec.md` § 7, `ebay-comps-import-spec.md` § 5, and
  `data-model-v2.md` § 10/11.

## 5. Field Naming Consistency

### 5.1 `gradeCompany` vs `company`

- `ebay-comps-import-spec.md` § 5: field name is **`gradeCompany`**.
- `graded-comps-spec.md` § 6: field name is **`company`**.
- `data-model-v2.md` § 10 (`ebay_sold_comps`): **`gradeCompany`**.
- `data-model-v2.md` § 11 (`graded_comps`): **`company`**.

**Drift D1**: same concept, two field names. A graded sale that originates
from eBay would be `gradeCompany` in the raw row and `company` in the
derived view. This makes downstream code awkward (two field names for
identical semantics).

**Recommended canonical:** standardize on `gradeCompany` everywhere. It's
more explicit and matches the related field `grade` / `gradeNumeric` /
`gradeLabel` naming.

### 5.2 `sourceUrl` required vs recommended on `graded_comps`

- `graded-comps-spec.md` § 6: `sourceUrl` is **Required**.
- `data-model-v2.md` § 11: `sourceUrl` is **Recommended** ("Required when
  manually reviewed").

**Drift E1**: detailed spec says always required; data-model-v2 softens it.
The detailed spec is the canonical source; data-model-v2 § 11 should be
updated.

### 5.3 `source_confidence` structural mismatch

This is the biggest single inconsistency in the spec set.

**`data-model-v2.md` § 13** (the entity table) uses flat boolean/enum
fields:

```
cardCode, sourcesAgree (boolean), sourceVariance (number),
lowVolumeFlag (boolean), staleFlag (boolean),
variantAmbiguityFlag (boolean),
manipulationRisk (enum[low, medium, high, unknown]),
notes, updatedAt
```

**`source-confidence-spec.md` § 5–8** (the dedicated spec) uses a richer
nested structure:

```
cardCode, overall (enum), score (0-100), components (object with
sourceAgreement / freshness / volume / variantClarity / outlierRisk),
flags (array<enum>), summary, sourceRefs, updatedAt
```

**Drift F1**: `data-model-v2.md` § 13 predates the detailed spec and is
out of sync. Specifically:

- `sourcesAgree` (bool) vs `components.sourceAgreement`
  (enum[`aligned`, `mixed`, `disagree`, `singleSource`, `unknown`]).
- `staleFlag` (bool) vs `components.freshness`
  (enum[`fresh`, `aging`, `stale`, `unknown`]).
- `lowVolumeFlag` (bool) vs `components.volume`
  (enum[`adequate`, `thin`, `none`, `unknown`]).
- `variantAmbiguityFlag` (bool) vs `components.variantClarity`
  (enum[`high`, `medium`, `low`, `unknown`]) **and** `flags` array
  containing `variantAmbiguity`.
- `manipulationRisk` (enum) vs `components.outlierRisk` (enum).
- `data-model-v2.md` § 13 has no `overall`, `score`, `flags`, or `summary`
  field at all.

**Recommended canonical:** the detailed spec
(`source-confidence-spec.md`) is more developed and explicitly references
score-band → label mapping, flag composition, and UI integration. Replace
`data-model-v2.md` § 13's flat field list with a reference to the spec
doc, or update the table to match the spec's nested structure.

### 5.4 `setCode` / `cardCode` migration

Currently active artifacts use `set` and `code`; all Phase 2 specs use
`setCode` and `cardCode`. **`data-model-v2.md` § 5 documents this mapping
explicitly** ("Current v1 maps from `code`"). **Consistent. ✓**

### 5.5 `sourceRefs` requirement

- `premium-metadata-schema.md` § 4: **Required**.
- `data-model-v2.md` § 7 (`premium_metadata`): **Recommended**.

**Drift G1**: schema says required; data-model says recommended. Schema
wins — premium metadata is classification that absolutely needs sources.

## 6. Cross-Reference Resolution

### 6.1 "Next safe task" chain

Each spec ends with a "Next safe task" pointer. The chain resolves
end-to-end with no breaks.

| Spec | "Next safe task" → | Matches checklist? |
|------|--------------------|--------------------|
| `data-model-v2.md` | (no explicit pointer; covered by checklist) | — |
| `premium-metadata-schema.md` § 13 → migration path | P2-005 implied | ✓ |
| `sb-set-staging-spec.md` § 15 | `P2-006 Design manual eBay sold comps CSV spec` | ✓ |
| `ebay-comps-import-spec.md` § 17 | `P2-007 Design source confidence scoring spec` | ✓ |
| `source-confidence-spec.md` § 15 | `P2-008 Design graded comps spec` | ✓ |
| `graded-comps-spec.md` § 17 | `P2-009 Design sealed products spec` | ✓ |
| `sealed-products-spec.md` § 17 | `P2-010 Design validation guard plan for expanded data` | ✓ |
| `expanded-data-validation-plan.md` § 19 | `P2-011 Add staging directory structure, docs only first` | ✓ |

**Status:** clean.

### 6.2 Staging directory paths

| Spec | Proposed staging path |
|------|----------------------|
| `sb-set-staging-spec.md` § 4 | `data-staging/sb-sets/` |
| `ebay-comps-import-spec.md` § 3 | `data-staging/ebay-comps/` |
| `graded-comps-spec.md` § 3 | `data-staging/graded-comps/` |
| `sealed-products-spec.md` § 4 | `data-staging/sealed-products/` |

All four use the `data-staging/<topic>/` convention. **Consistent. ✓**

Premium metadata (`premium-metadata-schema.md` § 3) targets
`public/premiumMetadata.json` (a future generated artifact, not staging
input). Source confidence (`source-confidence-spec.md` § 4) targets
`public/sourceConfidence.json`. Both are appropriately differentiated from
the CSV-staging paths. **Consistent. ✓**

### 6.3 Validator file naming

`expanded-data-validation-plan.md` § 5 lists seven future validator
scripts:

- `scripts/validate-sb-staging.js`
- `scripts/validate-premium-metadata.js`
- `scripts/validate-ebay-comps.js`
- `scripts/validate-graded-comps.js`
- `scripts/validate-sealed-products.js`
- `scripts/validate-source-confidence.js`
- `scripts/validate-expanded-data.js`

No conflict with existing scripts. Naming follows the `validate-<topic>.js`
convention. **Consistent. ✓**

## 7. Required vs Optional Consistency

The audit checked every overlap of the `Required` / `Recommended` /
`Optional` columns across specs.

**Confirmed-consistent requirement levels:**

- `cardCode` — Required everywhere it appears.
- `confidence` — Required everywhere it appears.
- `currency` — Required on ebay-comps and graded-comps; Recommended on
  sealed-products (intentional: sealed manual research often lacks
  currency).
- `variantMatch` — Required on ebay-comps and graded-comps.
- `outlierFlag` — Required on ebay-comps and graded-comps.
- `reviewedAt`, `reviewer` — Recommended on every comps spec (intentional;
  early manual research may lack these).
- `gradeCompany` and `grade` — Required when row is graded.

**Divergences already covered above:**

- `sourceUrl` on graded_comps (§ 5.2 — drift E1).
- `sourceRefs` on premium_metadata (§ 5.5 — drift G1).

## 8. Findings Summary

| ID | Severity | Description | Files involved | Resolution recommendation |
|----|----------|-------------|----------------|---------------------------|
| **A1** | drift | `winner` vs `winnerPromo` | `data-model-v2.md` § 7, `phase-2-data-expansion-plan.md` § 8, `premium-metadata-schema.md` § 5 | Standardize on `winnerPromo` |
| **A2** | drift | `premiumFlags` list incomplete in 2 docs | `data-model-v2.md` § 7, `phase-2-data-expansion-plan.md` § 8 | Either reference schema doc or duplicate full list |
| **B1** | drift | `gradedContamination` vs `rawGradedContamination` | `data-model-v2.md` § 7, `premium-metadata-schema.md` § 7, `source-confidence-spec.md` § 8 | Standardize on `rawGradedContamination` |
| **B2** | drift | `riskTags` list incomplete in `data-model-v2.md` | `data-model-v2.md` § 7, `premium-metadata-schema.md` § 7 | Reference schema doc or duplicate full list |
| **C1** | drift | `gdr` (lowercase) vs `GDR` (uppercase) | `ebay-comps-import-spec.md` § 5, `graded-comps-spec.md` § 6 | Standardize on `gdr` (lowercase, matches `godRare` / `altArt` style) |
| **C2** | divergence | SB staging variant vocabulary stricter than eBay/graded | `sb-set-staging-spec.md` § 7, `ebay-comps-import-spec.md` § 5, `graded-comps-spec.md` § 6 | Intentional; annotate in both specs |
| **D1** | drift | `gradeCompany` (eBay row) vs `company` (graded row) | `ebay-comps-import-spec.md` § 5, `graded-comps-spec.md` § 6, `data-model-v2.md` § 10/11 | Standardize on `gradeCompany` |
| **E1** | drift | `sourceUrl` requirement disagrees | `graded-comps-spec.md` § 6 (Required), `data-model-v2.md` § 11 (Recommended) | Update `data-model-v2.md` § 11 to Required |
| **F1** | drift, structural | `data-model-v2.md` § 13 source_confidence schema is out of sync with `source-confidence-spec.md` | `data-model-v2.md` § 13, `source-confidence-spec.md` § 5–8 | Replace `data-model-v2.md` § 13 with reference to spec OR adopt nested `overall` / `components` / `flags` / `summary` / `sourceRefs` structure |
| **G1** | drift | `sourceRefs` requirement disagrees on premium_metadata | `data-model-v2.md` § 7 (Recommended), `premium-metadata-schema.md` § 4 (Required) | Update `data-model-v2.md` § 7 to Required |
| **H1** | annotation gap | `confidence` enum varies by entity intentionally but isn't documented | `data-model-v2.md` § 4 | Add a "Confidence vocabulary by entity" table to § 4 |
| **H2** | annotation gap | `source-confidence` flags overlap with `premium_metadata` riskTags but the vocabularies are not identical | `source-confidence-spec.md` § 8, `premium-metadata-schema.md` § 7 | Add a cross-reference note in each |

**Severity legend:**
- **drift**: same concept stored under different names or different
  required/optional levels. Will cause validator failures or downstream
  code awkwardness if not reconciled before staged fixtures land.
- **divergence**: intentional difference that should be documented in both
  specs so future readers understand the design choice.
- **annotation gap**: existing content is correct but a cross-reference or
  table should be added so the design intent is auditable.

**Severity counts:** 8 drift items, 1 divergence, 2 annotation gaps.

### Resolution status (added 2026-05-07)

All findings closed by the P2-018 spec-tightening pass.

| ID | Severity | Closed by | Notes |
|----|----------|-----------|-------|
| A1 | drift | `0522bb8` (P2-018a) | `winner` → `winnerPromo` in data-model-v2 § 7 + phase-2 plan § 8; canonical form is `winnerPromo` per `premium-metadata-schema.md` § 5. |
| A2 | drift | `0522bb8` (P2-018a) | `premiumFlags` list in data-model-v2 § 7 + phase-2 plan § 8 now defers to schema doc. |
| B1 | drift | `0522bb8` (P2-018a) | `gradedContamination` → `rawGradedContamination` in data-model-v2 § 7. |
| B2 | drift | `0522bb8` (P2-018a) | `riskTags` list in data-model-v2 § 7 now defers to schema doc. |
| C1 | drift | `234672c` (P2-018c) | `GDR` (uppercase) → `gdr` (lowercase) in graded-comps spec § 6 row and § 9 prose; ebay-comps and graded-comps both annotated with canonical lowercase rule. |
| C2 | divergence | `234672c` (P2-018c) | SB staging variant vocabulary annotated as intentionally stricter than eBay/graded; eBay annotated as intentionally broader; design intent now auditable in both specs. |
| D1 | drift | `110d895` (P2-018b) | `company` → `gradeCompany` in graded-comps spec § 5 CSV header, § 6 field table, § 7 vocabulary note, § 15 validator rule. |
| E1 | drift | `0522bb8` (P2-018a) | `graded_comps.sourceUrl` Required column changed from `Recommended` to `Yes`; type tightened from `nullable<string>` to `string`; Notes simplified. |
| F1 | drift | `b844e00` (P2-018d) | data-model-v2 § 13 restructured to mirror source-confidence-spec § 5–8 (overall/components/flags/summary/sourceRefs). |
| G1 | drift | (already resolved) | `data-model-v2.md` § 7 `sourceRefs` was already `Required` on disk; the audit row described a state that no longer existed. No commit needed. |
| H1 | annotation gap | `9ef2135` (P2-018e) | data-model-v2 § 4 now includes a "Confidence vocabulary by entity" table documenting the intentional `excluded` / `unknown` differences. |
| H2 | annotation gap | `234672c` (P2-018c) | Cross-references between premium-metadata § 7 riskTags and source-confidence § 8 flags added in both directions. |

All 12 findings (8 drift + 1 divergence + 2 annotation gaps + G1 pre-resolved) now have a closing commit or documented prior-state resolution.

## 9. Recommended Canonical Resolutions

A future Phase 2 spec-tightening task (call it **P2-018**, post-P2-017
backlog) should:

1. **Canonical name decisions:**
   - `winnerPromo` (not `winner`).
   - `rawGradedContamination` (not `gradedContamination`).
   - `gdr` (lowercase).
   - `gradeCompany` everywhere (not `company`).

2. **Canonical-doc references:** in any spec that lists `premiumFlags` or
   `riskTags`, replace the embedded list with `"See premium-metadata-schema.md
   § 5"` / `§ 7` rather than duplicating. Reduces drift risk going forward.

3. **`data-model-v2.md` § 13 rewrite:** restructure to match
   `source-confidence-spec.md` § 5–8. Use `overall` enum, `components`
   object, `flags` array, `summary`, `sourceRefs`, `updatedAt`.

4. **`data-model-v2.md` § 4 addition:** add a table titled "Confidence
   vocabulary by entity" listing which entities allow `excluded` /
   `unknown` so the intentional differences in §4.1 of this audit are
   visible in the canonical model doc.

5. **Cross-references:** add a one-line "See also" near the riskTags
   section of `premium-metadata-schema.md` § 7 pointing to
   `source-confidence-spec.md` § 8 flags, and vice versa.

6. **Required-vs-Recommended fixes:**
   - `data-model-v2.md` § 7: change `sourceRefs` on `premium_metadata` to
     Required.
   - `data-model-v2.md` § 11: change `sourceUrl` on `graded_comps` to
     Required.

7. **Intentional-divergence annotations:**
   - `sb-set-staging-spec.md` § 7: note that the strict 6-value variant
     vocabulary is intentional because SB staging is canonical-card
     identity, not open source data.
   - `ebay-comps-import-spec.md` § 5: note that the broader variant
     vocabulary is intentional because eBay listings have less structured
     variant metadata.

## 10. Risk if not resolved

- **Validator failures**: when the SB / premium / comps validators are
  written (P2-014 and beyond), each will pick one of the divergent
  vocabularies. A premium metadata row that uses `gradedContamination`
  passes the v2 data-model check but fails the schema validator (or vice
  versa). Today's docs disagree; tomorrow's validators will too unless the
  decisions in § 9 happen first.
- **Cross-source merging errors**: an eBay row with `gradeCompany=PSA`
  feeds into a graded_comps view that calls the field `company`. The
  importer either silently drops the value or renames it; both behaviors
  obscure data lineage. A canonical field name avoids the question.
- **Cosmetic divergences (C2, H1, H2)** don't break code but waste
  reviewer time every time they're rediscovered. A single annotation pass
  removes that cost.

## 11. What this audit did NOT check

- The accuracy of each spec's *content* (e.g. whether 15% is the right
  source-variance threshold for "aligned"). Those are open questions and
  belong in `docs/open-questions.md` (covered by CLA-09).
- Implementation feasibility of the proposed validators. Those are
  scope-of-work decisions, not consistency.
- Whether the SB staging schema accommodates promo cards (handled by the
  Phase 2 promo namespace decision; out of scope here).
- UI implementation order. Out of scope; covered in the execution
  checklist.

## 12. Recommended next step (no implementation in this audit)

Open a new checklist row **P2-018 Phase 2 spec-tightening pass** ranked
just after the current "needs user approval" cohort. Mark it as a
docs-only task touching only the eight Phase 2 spec docs plus the data
expansion plan. Validate with `git diff --check` and
`node scripts/verify-data.js`. Estimated effort: 2 commits (one for
canonical naming + cross-references, one for `data-model-v2.md`
restructure). Owner: Codex (mechanical) or Claude (if structural
restructure on § 13 is preferred).

This audit itself does not propose those changes — it only catalogs them.
