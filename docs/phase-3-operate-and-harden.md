# Phase 3 — Operate and Harden

## Executive Summary

Phase 3 shifts FusionMetrics from portfolio-MVP buildout into operating,
hardening, and measured trust expansion.

Phase 2 closed the major data-contract work: split pricing/history shape,
sample-gated premium metadata, sample-gated eBay comps surfaces, and the
docs/spec guardrails needed before deeper market intelligence. P2-017 remains
backend-gated and is not approved because no backend trigger has fired.

Phase 3 is not a broad feature sprint. It is the discipline layer that keeps
the product durable while small, user-facing utility improves.

## Operating Principles

- Make FusionMetrics unable to lie by accident.
- Keep JustTCG free-tier assumptions unless the operator explicitly changes
  them.
- Preserve D-027's lean dependency policy.
- Preserve D-031's retired accumulator decision; long-term history requires a
  new design, not resurrected legacy files.
- Preserve D-032's rotation-first update strategy.
- Preserve D-038's icons-only image strategy until an upgrade trigger fires.
- Do not automate external marketplace ingestion until source approval,
  matching rules, and validator gates are complete.
- Separate observed data from modeled scores in every UI surface.
- Prefer small, reversible changes with explicit validation.

## Pillar Alignment

Phase 3 maps to `CLAUDE.md` § 9.2:

| Pillar | Phase 3 posture |
|--------|-----------------|
| A — Continuity & Safety | Keep recovery docs and task ledgers current. |
| B — Data Integrity & Historical Trust | Maintain split-shape verification and quarterly model recalibration. |
| C — Infrastructure Hardening | Add lightweight error capture and workflow failure alerts. |
| D — Data Depth & Coverage | Keep sample-gated artifacts inert until production data is reviewed. |
| E — Analytics Depth | Plan only; do not ship stronger analytics before data supports them. |
| F — Platform Trust | Improve exportability and user control without adding accounts or a backend. |

## Success Metrics

- `npm run build` passes after every code task.
- `node scripts/verify-data.js` reports 9 invariants after every task.
- Bundle stays under the 750 kB raw stop threshold.
- Production sample-gate remains intact: no sample-flagged premium metadata or
  comps artifact is consumed by the UI.
- Workflow failures create visible operator-facing issues without exposing
  secrets.
- Watchlist users can export local positions without accounts or cloud sync.
- Plausible/error telemetry helps find breakage without adding invasive
  tracking.

## Exit Criteria

Phase 3 can be considered complete when:

- P3-001 through P3-007 are complete.
- P3-004 and P3-005 have been observed in production or manually verified as
  no-op safe.
- P3-006 CSV export has been manually smoke-tested.
- P3-008, P3-010, P3-011, and P3-012 have either operator approval or remain
  explicitly gated.
- No generated JSON, pricing pipeline, or workflow trust guard has been
  weakened.

## Out of Scope

- Backend/database implementation unless the backend trigger checklist fires.
- Automated eBay scraping or marketplace API integration.
- Paid accounts, Stripe, alerts, or cloud Watchlist sync.
- New prediction engines or investment certainty language.
- Image ingestion beyond the D-038 icons-only default.
