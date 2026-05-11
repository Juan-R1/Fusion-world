# eBay Sold Comps Sample Fixture

**Status:** illustrative only — **not consumed by the app, not derived from real eBay listings**.

## What this is

`ebay-sold-comps.csv` is a small reference fixture showing the shape, vocabulary, and confidence patterns that future eBay sold-comp artifacts must follow. Every row uses placeholder `listingId` values (`SAMPLE-NNN`) and placeholder `sourceUrl` values (`https://example.com/sample-NNN`). No row reflects an actual listing or sold price; these are synthetic for schema validation only.

## Governing specs

- `docs/ebay-comps-import-spec.md` — the canonical CSV column list, enum vocabulary, matching rules, raw/graded separation, outlier rules.
- `docs/data-model-v2.md` § 10 — `ebay_sold_comps` entity in the v2 data model.
- `docs/graded-comps-spec.md` — interaction with graded sub-rows.
- `docs/expanded-data-validation-plan.md` — overall validator strategy.

## Gating validator

- `scripts/validate-ebay-comps.js` enforces shape + vocabulary on this fixture.
- Run with:
  ```
  node scripts/validate-ebay-comps.js
  ```
- Exit 0 on success, 1 on any violation.

## Forbidden actions

- Do not scrape eBay to populate this file. Every row must be either synthetic (sample) or manually reviewed with a real `sourceUrl`.
- Do not move real-listing rows into this fixture; if real comps are ever collected, they go in a separate fixture path approved by the operator.
- Do not import this file from app code.
- Do not edit by hand to "look real" — every row must be unambiguously illustrative.
- Do not add buy/sell/guarantee/profit/moonshot/lock language to notes fields.
- Do not aggregate raw and graded comps together. Raw and graded markets are different markets.

## Trust posture

Every row is either:
- `confidence: high` with `variantMatch: exact` (clean illustrative single), or
- `confidence: medium` with `variantMatch: likely` (slight ambiguity), or
- `confidence: low` with `variantMatch: ambiguous` (research-only), or
- `confidence: excluded` with `outlierFlag: true` (lot/bundle, do not aggregate).

This mix ensures the validator and any future importer can see at least one row in each eligibility class.

## Operator boundaries

- The path `data-staging/ebay-comps/` is the only approved staging location for eBay sold comps.
- Approved by operator via the operator-handbook § 3 prompt.
- Next gate: P2-014 (importer) — still operator-approval-required.
- Automation is **not** approved. No scraping. No eBay API calls without the External Source Approval Checklist (`docs/phase-2-execution-checklist.md` § 8).
