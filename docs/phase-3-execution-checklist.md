# Phase 3 Execution Checklist

## 1. Purpose

This file controls Phase 3 operate-and-harden work. Future agents must read it
before starting Phase 3 tasks and update it after each completed, blocked, or
skipped task.

## 2. Operating Rules

- Work one task at a time.
- Do not start a new task until the current task is complete or blocked.
- Update this checklist after each task.
- Never mark complete without validation.
- Do not edit generated JSON manually.
- Do not run JustTCG workflows or GitHub Actions unless the operator approves.
- Do not add dependencies without explicit approval.
- Do not automate eBay, TCGplayer, PriceCharting, or other marketplace access
  without source approval.
- Do not add backend/database work until a backend trigger condition fires.
- Do not weaken `scripts/verify-data.js`, coverage guards, or trust labels.
- Do not use buy/sell/guarantee/profit/moonshot/lock-style language.

## 3. Status Legend

- Not started
- In progress
- Blocked
- Complete
- Skipped
- Approved for implementation
- Needs user approval

## 4. Phase 3 Master Checklist

| ID | Status | Task | Owner | Allowed files | Validation required | Completion criteria | Notes |
|----|--------|------|-------|---------------|---------------------|---------------------|-------|
| P3-001 | Complete | Phase 3 charter | Codex/Claude | `docs/phase-3-operate-and-harden.md` | `git diff --check`; `node scripts/verify-data.js` | Charter exists with principles, metrics, and exit criteria. | Created in Phase 3 kickoff docs commit. |
| P3-002 | Complete | Phase 3 execution checklist | Codex/Claude | `docs/phase-3-execution-checklist.md` | `git diff --check`; `node scripts/verify-data.js` | Checklist exists with task ledger and gates. | Created in Phase 3 kickoff docs commit. |
| P3-003 | Complete | Quarterly recalibration cadence formalized | Codex/Claude | `src/data.js`; `docs/recalibration-YYYY-MM-DD.md` | `npm run build`; `node scripts/verify-data.js` | Recalibration report exists and next recalibration date is set. | Completed by the 2026-05-12 recalibration commit; next date is 2026-08-12. |
| P3-004 | Complete | Production error capture via Plausible custom event | Codex/Claude | `src/lib/errorCapture.js`; `src/main.jsx`; checklist | `npm run build`; `node scripts/verify-data.js` | `window.onerror` and `unhandledrejection` emit `js-error` only when `window.plausible` exists. | No new dependency. |
| P3-005 | Complete | Workflow failure alerts | Codex/Claude | `.github/workflows/update-prices.yml`; `.github/workflows/update-cards.yml`; checklist | `npm run build`; `node scripts/verify-data.js` | Each workflow creates a failure issue without exposing secrets. | Uses `actions/github-script@v7`; workflows were not run. |
| P3-006 | Complete | Watchlist CSV export | Codex/Claude | `src/tabs/Watchlist.jsx`; checklist | `npm run build`; `node scripts/verify-data.js`; manual export smoke test | Empty Watchlist disables export; non-empty export downloads CSV with required columns. | Client-side blob only. |
| P3-007 | Complete | Cross-source spot-check protocol doc | Claude | `docs/cross-source-spot-check-protocol.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | Manual operator checklist exists; no API calls. | Closed by Claude under operator's Phase 3 heavy-session mandate. First run is operator-driven; next due 2026-08-12. |
| P3-008 | Complete | Test suite | Claude/Codex | `package.json`; `package-lock.json`; `vitest.config.js`; `tests/*`; `.github/workflows/ci.yml`; docs | `npm test`; `npm run build`; `node scripts/verify-data.js` | Vitest + React Testing Library suite ships 20 gap-analysis cases and CI runs `npm test` after build. | Q-031 approved dev-only `vitest`, `@testing-library/react`, and `jsdom`. |
| P3-009 | Complete | P2-017 backend pre-stage doc | Claude | `docs/backend-prestage-plan.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | Backend trigger analysis exists; no implementation. | Closed by Claude under operator's Phase 3 heavy-session mandate. Stack: Postgres on Supabase free tier. Activates only when a Backend Trigger Checklist condition fires AND operator approves. |
| P3-013 | Complete | Sample-gate promotion runbook | Claude | `docs/sample-gate-promotion-runbook.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | Operator procedure for safely promoting sample artifacts to production. | Closed by Claude under operator's Phase 3 heavy-session mandate. Adds the only sanctioned path to disable the sample-gate per artifact. |
| P3-014 | Complete | SessionStart hook + session-brief script | Claude | `.claude/settings.json`; `scripts/session-brief.sh`; `AGENTS.md` § 5 | `bash scripts/session-brief.sh` (manual smoke); `node scripts/verify-data.js` | Brief auto-loads at session start with branch, drift, verify-data, recent commits, P3 task counts, and sample-gate state. | Closes R-002 structurally. |
| P3-010 (spec) | Complete | Set Rankings / Chase Radar UX spec | Claude | `docs/set-rankings-spec.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | UX spec exists and avoids unsupported investment claims. | Spec deliverable complete 2026-05-14. Implementation stays operator-gated; Codex prompt staged in `docs/operator-handbook.md` § 4d. |
| P3-010 (impl) | Needs user approval | Set Rankings / Chase Radar implementation | Codex | Per § 4d prompt | `npm test` (4 new cases); `npm run build` (< 30 kB delta); verify-data | Two tabs ship; bundle stays under budget; no new deps. | Q-034 implementation gate; operator-only greenlight. |
| P3-011 | Needs user approval | First real eBay comps fill | Operator/Claude | To be approved | Dedicated validator; `node scripts/verify-data.js` | Manual reviewed production artifact exists. | Requires manual research and source URLs. |
| P3-012 | Needs user approval | First real premium-metadata fill | Operator/Claude | To be approved | Dedicated validator; `node scripts/verify-data.js` | Manual reviewed production artifact exists. | Requires manual review. |

## 5. Completed Work Ledger

| Date | Task ID | Commit | What changed | Validation | Notes |
|------|---------|--------|--------------|------------|-------|
| 2026-05-12 | P3-001 | `5d70587` | Added Phase 3 operate-and-harden charter. | `git diff --check`; `node scripts/verify-data.js` | Phase 3 starts from trust-preserving operations, not a feature expansion spree. |
| 2026-05-12 | P3-002 | `5d70587` | Added Phase 3 execution checklist. | `git diff --check`; `node scripts/verify-data.js` | P3-004/P3-005/P3-006 are pre-approved small wins; P3-008/P3-010/P3-011/P3-012 remain operator-only. |
| 2026-05-12 | P3-003 | `81fadb7` | Recalibrated measured rarity bases and beta; retained UC smoothing and SPR extrapolation. | `npm run build` (✓ 660.00 kB raw / 98.79 kB gzip); `node scripts/verify-data.js` (✓ 9 invariants) | Next recalibration date: 2026-08-12. |
| 2026-05-12 | P3-004 | Current code commit | Added no-op-safe Plausible `js-error` event capture. | `npm run build`; `node scripts/verify-data.js` | Emits only when `window.plausible` is defined. |
| 2026-05-12 | P3-005 | Current code commit | Added issue-creating failure steps to update workflows. | `npm run build`; `node scripts/verify-data.js` | Workflow issue body links to the run and does not include secrets. Workflows were not run. |
| 2026-05-12 | P3-006 | Current code commit | Added client-side Watchlist CSV export. | `npm run build`; `node scripts/verify-data.js` | CSV columns: `cardCode,name,set,rarity,quantity,entryPrice,currentValue,pl`. |
| 2026-05-12 | P3-014 | Current docs commit | Added `.claude/settings.json` SessionStart hook + `scripts/session-brief.sh`. AGENTS.md § 5 updated. | `bash scripts/session-brief.sh` (manual smoke); `node scripts/verify-data.js` (✓ 9 invariants) | Closes R-002 structurally — every future Claude Code session loads project state automatically. |
| 2026-05-12 | P3-007 | Current docs commit | Added `docs/cross-source-spot-check-protocol.md`. 10-card stratified sample, D-037 variance bands, quarterly cadence. | `git diff --check`; `node scripts/verify-data.js` | Operator runs the first spot-check when ready. Next-due 2026-08-12 once a baseline run exists. |
| 2026-05-12 | P3-009 | Current docs commit | Added `docs/backend-prestage-plan.md`. Postgres on Supabase free tier; dual-write → read-pilot → graduated-cutover migration plan; full SQL schema + rollback plan. | `git diff --check`; `node scripts/verify-data.js` | Activates only when a Backend Trigger Checklist condition fires AND operator approves. Zero implementation. |
| 2026-05-12 | P3-013 | Current docs commit | Added `docs/sample-gate-promotion-runbook.md`. Pre-promotion gate, six-step promotion procedure, post-promotion verification, demotion path. | `git diff --check`; `node scripts/verify-data.js` | Only sanctioned path to disable the sample-gate per artifact. |
| 2026-05-13 | P3-008 | Current test commit | Added Vitest + React Testing Library + jsdom infrastructure, 20 focused regression tests, and CI `npm test` step. | `npm test` (20 passed); `npm run build`; `node scripts/verify-data.js` | Covers data trust, Watchlist migration, sample-gates, CardDetail history/freshness, provenance, and ValueScanner ranking filters. |
| 2026-05-14 | R-054 mitigation | Current Dependabot commit | Added `.github/dependabot.yml`. Weekly Monday scan; npm + GitHub Actions ecosystems. | `git diff --check`; `node scripts/verify-data.js` | Closes R-054 (dependency drift). CI gates Dependabot PRs automatically. |
| 2026-05-14 | P3-010 (spec) | Current docs commit | Added `docs/set-rankings-spec.md`. Two surfaces (Set Rankings + Chase Radar) defined with column inventory, coverage-status chip rules, forbidden language list, implementation gates. | `git diff --check`; `node scripts/verify-data.js` | Spec deliverable. Implementation remains operator-gated; Codex prompt in operator-handbook § 4d. |

## 6. Forbidden Files Without Explicit Approval

- `src/cardData.json`
- `src/livePrices.json`
- `public/priceHistory30d.json`
- `public/priceUpdateLog.json`
- `public/premiumMetadata.sample.json`
- `public/ebayCompsSummary.sample.json`
- `scripts/update-prices.js`
- `scripts/verify-data.js`
- package files
- deploy or CI workflows not named by a task

## 7. Backend Trigger Checklist

Backend/database work remains unapproved until at least one is true and the
operator explicitly approves backend work:

- Comps exceed roughly 1,000 rows.
- Account/cloud Watchlist is approved.
- Alerts are approved.
- Daily multi-source history is approved.
- Static artifacts become too slow or too large.
- User authentication is required.

## 8. Validation Checklist

Docs-only:

```bash
git diff --check
node scripts/verify-data.js
```

App code:

```bash
npm run build
node scripts/verify-data.js
```

Workflow YAML:

- Do not run workflows.
- Inspect diff for secrets.
- Ensure issue bodies link only to the run URL and safe metadata.

## 9. Next Recommended Task

All agent-doable Phase 3 docs are closed (P3-001..P3-009,
P3-013, P3-014 complete; P3-003..P3-006 features shipped). The
remaining tasks are operator-gated:

- **P3-010** Set Rankings / Chase Radar UX spec (Q-034 — operator
  authors spec or hands to ChatGPT GPT-04).
- **P3-011** First real eBay comps fill (manual operator research;
  follow `docs/sample-gate-promotion-runbook.md`).
- **P3-012** First real premium-metadata fill (same path).

The first agent-doable Phase 3 run is **complete**. Further agent
work waits on one of the operator decisions above.
