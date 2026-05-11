# Premium Metadata Sample Fixture

**Status:** illustrative only — **not consumed by the app**.

## What this is

`sample.json` is a small reference fixture showing the shape and vocabulary that future premium-metadata artifacts must follow. It is **not** active production data. The dashboard does not read this file. The Phase 2 implementation ladder (P2-014 importer, P2-015 UI badges) will only consume premium metadata when the operator explicitly approves a path from staging to a generated artifact, and only after a validator passes against the canonical schema.

## Governing specs

- `docs/premium-metadata-schema.md` — the canonical schema (entities, vocabularies, validation rules).
- `docs/data-model-v2.md` § 7 — premium_metadata entity in the v2 data model.
- `docs/expanded-data-validation-plan.md` — overall validator strategy.
- `docs/phase-2-execution-checklist.md` — gating ledger for moving fixtures into production.

## Gating validator

- `scripts/validate-premium-metadata.js` enforces shape + vocabulary on this fixture.
- Run with:
  ```
  node scripts/validate-premium-metadata.js
  ```
- Exit 0 on success, 1 on any violation. The validator is the only gate between this sample and any future generated artifact.

## Forbidden actions

- Do not move this file into `src/` or `public/` without operator approval and a fresh validator run.
- Do not import this file from app code.
- Do not edit by hand to "look real" — every row must be unambiguously illustrative.
- Do not scrape external sources to enrich this fixture.
- Do not add any premium label invented outside `docs/premium-metadata-schema.md` § 5 / § 6 / § 7.
- Do not add buy/sell/guarantee/profit/moonshot/lock language to notes fields.

## Trust posture

Every row in the sample carries `manualReviewOnly` in `riskTags` and uses `confidence: 'low'` or `'medium'`. None claim `confidence: 'high'`. None set `gradeUpside.status` to `'confirmed'`. This is intentional: a fixture cannot be more confident than its review chain.

## Operator boundaries

- The path `data-staging/premium-metadata/` is the only approved staging location for premium metadata.
- Approved by operator via the operator-handbook § 2 prompt.
- Next gate: P2-013 (eBay sold comps fixture) per the same handbook § 3.
