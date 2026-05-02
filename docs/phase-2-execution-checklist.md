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
| P2-009 | Not started | Design sealed products spec | ChatGPT plan, Codex docs | `docs/sealed-products-spec.md` | `git diff --check`; `node scripts/verify-data.js` | Product codes, set links, product type, source fields, price timestamp, and Box EV caveats are documented. | No formula changes. |
| P2-010 | Not started | Design validation guard plan for expanded data | Codex/Claude | `docs/expanded-data-validation-plan.md` | `git diff --check`; `node scripts/verify-data.js` | Validator requirements for premium metadata, comps, graded data, sealed products, and source confidence are documented. | Required before generated artifacts. |
| P2-011 | Needs user approval | Add staging directory structure, docs only first | Codex/Claude | New docs-approved staging paths only | `git diff --check`; `node scripts/verify-data.js` | Empty or README-only staging structure exists and explains that no generated data is active yet. | Wait for user approval after specs. |
| P2-012 | Needs user approval | Build sample premium metadata file only after approval | Claude/Codex | Approved staging fixture path only | Dedicated validator required before merge; `node scripts/verify-data.js` | Tiny sample fixture exists and validates. | Do not edit `src/cardData.json`. |
| P2-013 | Needs user approval | Build sample eBay CSV fixture only after approval | Codex | Approved staging fixture path only | Dedicated validator required before merge; `node scripts/verify-data.js` | Manual sample fixture exists with source URLs and confidence labels. | No scraping. |
| P2-014 | Needs user approval | Build importer only after fixture/spec approval | Claude | New importer path approved by user | `node --check` for importer; dedicated validator; `node scripts/verify-data.js`; `npm run build` if app contract changes | Importer reads sample fixture and writes only approved generated artifact path. | No active UI consumption until validated. |
| P2-015 | Needs user approval | Add UI badges/filters only after metadata exists | Claude/Codex | Specific `src/` files named by user | `npm run build`; `node scripts/verify-data.js` | Premium tags appear with cautious copy and no investment certainty. | Requires metadata artifact first. |
| P2-016 | Needs user approval | Add CardDetail comps panel only after comps artifact exists | Claude/Codex | Specific `src/` files named by user | `npm run build`; `node scripts/verify-data.js` | Comps panel separates raw/graded, variants, confidence, and outliers. | Requires comps artifact first. |
| P2-017 | Needs user approval | Consider backend only after trigger criteria are met | ChatGPT plan, Claude later | Docs only until approved | `git diff --check`; `node scripts/verify-data.js` | Backend decision record states trigger met, stack choice, migration plan, cost/risk, and rollback path. | Backend is not approved now. |

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
| 2026-05-01 | P2-008 | Current docs commit | Added `docs/graded-comps-spec.md` and marked P2-008 complete. | `git diff --check`; `node scripts/verify-data.js` | Defines graded comp fields, grade normalization, raw/graded separation, population notes, confidence rules, validation requirements, and stop conditions. |

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

Next recommended task: `P2-009 Design sealed products spec`.

Do not start implementation, generated data, scraping, backend work, or UI
badges until the relevant spec tasks are complete and the user approves the
next implementation step.
