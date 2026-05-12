# FusionMetrics Phase 2 Execution Checklist

## 1. Purpose

This file controls Phase 2 data expansion work. Future agents must read it
before starting any Phase 2 task and must update it after each task. Its job is
to prevent repeated work, skipped validation, premature generated-data edits,
unapproved scraping, premature backend work, and overconfident market claims.

Phase 2 is about stronger data first, not stronger claims first.

## 2. Operating Rules

- Read this checklist before starting Phase 2 work.
- Work one task at a time.
- Do not start a new task until the current task is marked `Complete`,
  `Blocked`, `Skipped`, or explicitly handed off.
- Update this file after each Phase 2 task.
- Never mark a task `Complete` without validation.
- Never edit generated data unless this checklist explicitly says the task is
  approved for implementation.
- Never scrape external sources without explicit user approval.
- Never add backend/database work until trigger criteria are met and approved.
- Never weaken `scripts/verify-data.js`.
- Never weaken the 1,121 live-price coverage guard or per-set guard.
- Never overclaim investment certainty, guaranteed returns, or buy/sell advice.
- Keep observed data, model estimates, manual research, and heuristics clearly
  separated.

## 3. Status Legend

| Status | Meaning |
|--------|---------|
| Not started | Planned but not begun. |
| In progress | Current active task. There should usually be only one. |
| Blocked | Started but cannot continue without user decision or missing input. |
| Complete | Finished and validated. |
| Skipped | Intentionally not done, with reason in notes. |
| Approved for implementation | User has approved moving from spec to implementation. |
| Needs user approval | Must not proceed until user explicitly approves. |

## 4. Phase 2 Master Checklist

| ID | Status | Task | Owner | Allowed files | Validation required | Completion criteria | Notes |
|----|--------|------|-------|---------------|---------------------|---------------------|-------|
| P2-001 | Complete | Create Phase 2 data expansion plan | Codex | `docs/phase-2-data-expansion-plan.md` | `git diff --check`; `node scripts/verify-data.js` | Plan exists with baseline, gaps, target model, staging strategy, eBay plan, premium metadata plan, backend recommendation, roadmap, risks. | Completed in the same docs commit as this checklist. |
| P2-002 | Complete | Create Phase 2 execution checklist | Codex | `docs/phase-2-execution-checklist.md` | `git diff --check`; `node scripts/verify-data.js` | Checklist exists with operating rules, task ledger, forbidden files, backend triggers, source approval, and validation rules. | Completed in the same docs commit as P2-001. |
| P2-003 | Complete | Design v2 data model spec | ChatGPT plan, Codex docs | `docs/data-model-v2.md` | `git diff --check`; `node scripts/verify-data.js` | Entity definitions, field types, required/optional fields, source ownership, and migration notes are documented. | Completed as docs only. |
| P2-004 | Complete | Design premium metadata schema | ChatGPT plan, Codex docs | `docs/premium-metadata-schema.md` | `git diff --check`; `node scripts/verify-data.js` | `premiumFlags`, `collectorTags`, `riskTags`, `gradeUpside`, examples, and anti-hype rules are documented. | Completed as docs only. No UI until metadata exists. |
| P2-005 | Complete | Design SB01/SB02 staging schema | ChatGPT plan, Claude/Codex docs | `docs/sb-set-staging-spec.md` | `git diff --check`; `node scripts/verify-data.js` | Starter-set fields, set-code rules, card-code assumptions, validation needs, and source requirements are documented. | Completed as docs only. No generated card edits yet. |
| P2-006 | Complete | Design manual eBay sold comps CSV spec | ChatGPT plan, Codex docs | `docs/ebay-comps-import-spec.md` | `git diff --check`; `node scripts/verify-data.js` | CSV fields, matching rules, raw/graded separation, variant flags, outlier flags, confidence levels, and source URL requirements are documented. | Completed as docs only. Manual research only; no scraping. |
| P2-007 | Complete | Design source confidence scoring spec | ChatGPT plan, Codex docs | `docs/source-confidence-spec.md` | `git diff --check`; `node scripts/verify-data.js` | Source agreement, variance, stale, low-volume, variant ambiguity, and manipulation-risk rules are documented. | Completed as docs only. Must not imply certainty. |
| P2-008 | Complete | Design graded comps spec | ChatGPT plan, Codex docs | `docs/graded-comps-spec.md` | `git diff --check`; `node scripts/verify-data.js` | PSA/BGS/CGC/TAG fields, grade normalization, raw/graded split, population notes, and confidence rules are documented. | Completed as docs only. No graded UI yet. |
| P2-009 | Complete | Design sealed products spec | ChatGPT plan, Codex docs | `docs/sealed-products-spec.md` | `git diff --check`; `node scripts/verify-data.js` | Product codes, set links, product type, source fields, price timestamp, and Box EV caveats are documented. | Completed as docs only. No formula changes. |
| P2-010 | Complete | Design validation guard plan for expanded data | Codex/Claude | `docs/expanded-data-validation-plan.md` | `git diff --check`; `node scripts/verify-data.js` | Validator requirements for premium metadata, comps, graded data, sealed products, and source confidence are documented. | Completed as docs only. Required before generated artifacts. |
| P2-011 | Complete | Add staging directory structure, docs only first | Codex/Claude | New docs-approved staging paths only | `git diff --check`; `node scripts/verify-data.js` | Empty or README-only staging structure exists and explains that no generated data is active yet. | Approved and executed by operator via the post-P2-018 Codex prompt. |
| P2-012 | Complete | Build sample premium metadata file only after approval | Claude/Codex | Approved staging fixture path only | Dedicated validator required before merge; `node scripts/verify-data.js` | Tiny sample fixture exists and validates. | Approved by operator via operator-handbook § 2. Sample fixture + validator only. Not consumed by app. |
| P2-013 | Complete | Build sample eBay CSV fixture only after approval | Codex/Claude | Approved staging fixture path only | Dedicated validator required before merge; `node scripts/verify-data.js` | Manual sample fixture exists with source URLs and confidence labels. | Approved by operator via operator-handbook § 3. Sample fixture + validator only. No scraping. Not consumed by app. |
| P2-014 | Complete (sample-flagged) | Build importer only after fixture/spec approval | Claude | `scripts/import-premium-metadata.js`, `scripts/import-ebay-comps.js`, emitted artifacts at `public/premiumMetadata.sample.json`, `public/ebayCompsSummary.sample.json` | `node --check` (passed); validator subprocess (✓); `node scripts/verify-data.js` (✓ 9 invariants); `npm run build` (✓ 650 kB raw / 95.8 kB gzip — unchanged because `.sample.json` is a static asset, not bundled) | Importer runs upstream validator, reads sample fixture, writes sample-flagged artifact under `public/`. Emitted artifacts carry `_isSample: true` + `_disclaimer` so production UI must NOT consume them. Per D-046 aggregates computed on demand. | Sample artifacts only; production UI consumption blocked by `.sample.` filename gate + `_isSample` field check in P2-015 / P2-016. |
| P2-015 | Complete | Add UI badges/filters only after metadata exists | Claude/Codex | Specific `src/` files named by user | `npm run build`; `node scripts/verify-data.js` | Premium tags appear with cautious copy and no investment certainty. | Sample-gated UI consumption layer complete. Production path `/premiumMetadata.json` only; sample artifacts refused. |
| P2-016 | Needs user approval | Add CardDetail comps panel only after comps artifact exists | Claude/Codex | Specific `src/` files named by user | `npm run build`; `node scripts/verify-data.js` | Comps panel separates raw/graded, variants, confidence, and outliers. | Requires comps artifact first. |
| P2-017 | Needs user approval | Consider backend only after trigger criteria are met | ChatGPT plan, Claude later | Docs only until approved | `git diff --check`; `node scripts/verify-data.js` | Backend decision record states trigger met, stack choice, migration plan, cost/risk, and rollback path. | Backend is not approved now. |
| P2-018 | Complete | Phase 2 spec-tightening pass (drift resolution from consistency audit) | Claude | `docs/data-model-v2.md`, `docs/premium-metadata-schema.md`, `docs/sb-set-staging-spec.md`, `docs/ebay-comps-import-spec.md`, `docs/graded-comps-spec.md`, `docs/phase-2-data-expansion-plan.md` | `git diff --check`; `node scripts/verify-data.js` | All 8 drift items from `docs/phase-2-consistency-audit.md` § 8 resolved (A1, A2, B1, B2, C1, C2, D1, E1, F1, G1, H1, H2 — 8 drift + 1 divergence + 2 annotation gaps). | Authored by the Claude Code architectural-audit run as a follow-up to CLA-01. |

## 5. Completed Work Ledger

| Date | Task ID | Commit | What changed | Validation | Notes |
|------|---------|--------|--------------|------------|-------|
| 2026-05-01 | P2-001 | `ee6b6c4` | Added `docs/phase-2-data-expansion-plan.md`. | `git diff --check`; `node scripts/verify-data.js` | Establishes Phase 2 baseline, data gaps, target model, staging strategy, and roadmap. |
| 2026-05-01 | P2-002 | `ee6b6c4` | Added `docs/phase-2-execution-checklist.md`. | `git diff --check`; `node scripts/verify-data.js` | Establishes Phase 2 task ledger and guardrails for future agents. |
| 2026-05-01 | P2-003 | `553400c` | Added `docs/data-model-v2.md` and marked P2-003 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines v2 entities, field types, source ownership, artifact strategy, migration path, and validation expectations. |
| 2026-05-01 | P2-004 | `4770375` | Added `docs/premium-metadata-schema.md` and marked P2-004 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines premium flags, collector/risk tags, grade-upside shape, examples, validation rules, and UI guardrails. |
| 2026-05-01 | P2-005 | `5b1f7a8` | Added `docs/sb-set-staging-spec.md` and marked P2-005 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines SB set/card staging fields, set-code rules, reprint/variant handling, source requirements, validation needs, and stop conditions. |
| 2026-05-01 | P2-006 | `0b70442` | Added `docs/ebay-comps-import-spec.md` and marked P2-006 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines manual eBay sold-comp CSV fields, matching rules, raw/graded separation, outlier handling, confidence labels, source URL requirements, and automation stop conditions. |
| 2026-05-01 | P2-007 | `63a7dec` | Added `docs/source-confidence-spec.md` and marked P2-007 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines source-confidence labels, component dimensions, flags, scoring guardrails, validation requirements, and UI stop conditions. |
| 2026-05-01 | P2-008 | `fcb13cf` | Added `docs/graded-comps-spec.md` and marked P2-008 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines graded comp fields, grade normalization, raw/graded separation, population notes, confidence rules, validation requirements, and stop conditions. |
| 2026-05-01 | P2-009 | `252c3c3` | Added `docs/sealed-products-spec.md` and marked P2-009 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines sealed product fields, product-code rules, source/confidence requirements, Box EV caveats, validation requirements, and stop conditions. |
| 2026-05-01 | P2-010 | Current docs commit | Added `docs/expanded-data-validation-plan.md` and marked P2-010 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines validator layers, failure behavior, per-artifact guard requirements, generated artifact checks, app-contract validation, and stop conditions. |
| 2026-05-07 | P2-018 | `0522bb8` | P2-018a: data-model-v2 § 7 + phase-2 plan § 8 — canonical naming (winner→winnerPromo, gradedContamination→rawGradedContamination), defer premiumFlags / riskTags lists to schema, graded_comps.sourceUrl Required. | `git diff --check`; `node scripts/verify-data.js` | Closes consistency-audit drift items A1, A2, B1, B2, E1. |
| 2026-05-07 | P2-018 | `110d895` | P2-018b: graded-comps spec — standardize `gradeCompany` field name (was `company`). | `git diff --check`; `node scripts/verify-data.js` | Closes drift D1. |
| 2026-05-07 | P2-018 | `234672c` | P2-018c: cross-reference and intentional-divergence annotations across 5 specs (premium-metadata, source-confidence, sb-set-staging, ebay-comps, graded-comps). gdr lowercased in graded-comps. | `git diff --check`; `node scripts/verify-data.js` | Closes drift C1 and divergence C2, plus annotation gaps H1/H2 reinforcement. |
| 2026-05-07 | P2-018 | `b844e00` | P2-018d: data-model-v2 § 13 restructured to mirror source-confidence-spec § 5–8 (overall/components/flags/summary/sourceRefs/updatedAt). | `git diff --check`; `node scripts/verify-data.js` | Closes drift F1. |
| 2026-05-07 | P2-018 | `9ef2135` | P2-018e: data-model-v2 § 4 — added "Confidence vocabulary by entity" table documenting the intentional enum divergence. | `git diff --check`; `node scripts/verify-data.js` | Closes annotation gap H1. |
| 2026-05-11 | P2-011 | Current docs commit | Added `data-staging/README.md` and `data-staging/.gitkeep`; marked P2-011 complete. | `git diff --check`; `node scripts/verify-data.js` | Creates the empty staging scaffold only. No fixtures, validators, generated artifacts, external calls, or backend work. |
| 2026-05-11 | P2-012 | Current docs commit | Added `data-staging/premium-metadata/sample.json`, `data-staging/premium-metadata/README.md`, `scripts/validate-premium-metadata.js`. 6 illustrative rows, all `manualReviewOnly`. | `node scripts/validate-premium-metadata.js` (✓ 6 items validated); `node scripts/verify-data.js` (✓ 9 invariants) | Sample fixture only; not consumed by app. Validator gates all future moves toward generated artifact. |
| 2026-05-11 | P2-013 | Current docs commit | Added `data-staging/ebay-comps/ebay-sold-comps.csv`, `data-staging/ebay-comps/README.md`, `scripts/validate-ebay-comps.js`. 6 illustrative rows: raw, graded, ambiguous, lot/outlier. Placeholder listingIds and sourceUrls only. | `node scripts/validate-ebay-comps.js` (✓ 6 comp rows validated); `node scripts/verify-data.js` (✓ 9 invariants) | Sample fixture only; not consumed by app. No scraping. Validator enforces raw/graded separation, enum vocabulary, forbidden-language check on notes. |
| 2026-05-12 | P2-014 | Current docs commit | Added `scripts/import-premium-metadata.js`, `scripts/import-ebay-comps.js`. Emitted `public/premiumMetadata.sample.json` (6 items) + `public/ebayCompsSummary.sample.json` (6 rows across 5 cards). Both artifacts carry `_isSample: true` and `_disclaimer`. Per D-046, aggregates computed on demand by consumer. | `node scripts/import-premium-metadata.js` (✓); `node scripts/import-ebay-comps.js` (✓); `node scripts/verify-data.js` (✓ 9 invariants); `npm run build` (✓ 650 kB raw / 95.8 kB gzip — unchanged) | Sample-flagged artifacts only. Production UI (P2-015 / P2-016) MUST gate on `_isSample === false` AND filename without `.sample.` before consuming. Approved by operator's "approving everything you are capable of implementing" mandate (2026-05-12). |
| 2026-05-12 | P2-015 | Current UI commit | Added sample-gated premium metadata loader, prop-driven premium badge component, CardDetail badge rendering, and Value Scanner micro badges. | `npm run build`; `node scripts/verify-data.js` | Production UI fetches `/premiumMetadata.json`; sample artifacts are refused and current UI renders no premium badges until a production artifact exists. |

## 6. Forbidden Files Until Approval

Do not modify these for Phase 2 planning/spec tasks:

- `src/cardData.json`
- `src/livePrices.json`
- `public/priceHistory30d.json`
- `public/priceUpdateLog.json`
- `scripts/update-prices.js`
- `scripts/verify-data.js`
- `.github/workflows/`
- `package.json`
- `package-lock.json`

Generated data remains read-only until schema, fixture, and validator work is
explicitly approved.

## 7. Backend Trigger Checklist

Backend/database work is not approved until at least one is true and the user
explicitly approves the backend task:

- Comps exceed roughly 1,000 rows.
- Account/cloud Watchlist is approved.
- Alerts are approved.
- Daily multi-source history is approved.
- Static artifacts become too slow or too large.
- User authentication is required.

Until then, prefer docs, manual CSV specs, staged fixtures, validators, and
generated JSON artifacts.

## 8. External Source Approval Checklist

Before eBay/API work:

- Source is identified.
- Official API availability is checked.
- ToS and rate limits are reviewed.
- Fields are defined.
- Manual sample is validated.
- Variant matching rules are written.
- Raw and graded separation is defined.
- Outlier rules are defined.
- User explicitly approves automation.

No scraping is approved by default.

## 9. Validation Checklist

Docs-only tasks:

```bash
git diff --check
node scripts/verify-data.js
```

App-code tasks later:

```bash
npm run build
node scripts/verify-data.js
```

Data-artifact tasks later:

- Dedicated validator is required before merge.
- `node scripts/verify-data.js` must still pass.
- Generated artifacts must be reviewed as generated output, not hand-edited
  production data.

## 10. Next Recommended Task

Next recommended task: **`P2-016` (CardDetail comps panel)**.
The sample-flagged artifact `public/ebayCompsSummary.sample.json` is on
disk; P2-016 must build the consumption layer in `src/` and the
production gate (`_isSample === false` + filename without `.sample.`).

Do not start production-fixture generated data, scraping, backend
work, or UI consumption of `.sample.` artifacts until the relevant
spec tasks are complete and the user approves the next implementation
step.
