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
| P3-010 (impl) | Complete | Set Rankings / Chase Radar implementation | Claude-architect | `src/lib/setAggregates.js`, `src/tabs/SetRankings.jsx`, `src/tabs/ChaseRadar.jsx`, `src/App.jsx`, `tests/*` | `npm test` (44 cases); `npm run build` (+12 kB raw / +2.6 kB gzip — under budget); verify-data 9✓ | Both tabs ship; live-data + rarity only (D-053); estimated cards excluded (D-009); no demand/supply (eBay-gated). | Shipped 2026-05-31 under the autonomous-run mandate. 3 commits: 28de053 (aggregates), 495cb2b (Set Rankings), a804939 (Chase Radar). |
| P3-011 | Superseded | First real eBay comps fill (manual) | Operator/Claude | (obsoleted) | (none) | (none) | Superseded by P3-016 eBay Browse API ingester pre-stage. Manual path no longer recommended now that automated ingestion is one Codex run away from shipping. |
| P3-016 | Complete (pre-stage) | eBay Browse API ingester pre-stage | Claude-architect | `docs/ebay-ingester-prestage.md` | `git diff --check`; `node scripts/verify-data.js` | Comprehensive pre-stage doc with paste-ready Codex prompt in § 7 covers the full ingester ship. | Activates when operator's EBAY_APP_ID + EBAY_CERT_ID are in GitHub Actions secrets. Single Codex run produces 4 commits (client + matcher, ingester, workflow YAML, docs refresh). |
| P3-012 | Complete (second-pass) | Premium-metadata fill: SCR + SR + Leader tier | Claude-architect | `data-staging/premium-metadata/sample.json`; `public/premiumMetadata.sample.json`; `public/premiumMetadata.json`; `docs/decision-log.md` (D-048 + second-pass amendment) | `node scripts/validate-premium-metadata.js` (169 items); `node scripts/import-premium-metadata.js`; `node scripts/verify-data.js`; `npm run build`; `npm test` | Production artifact covers SCR + SR + Leader tier (169 of 1,258 cards). 113 surface badges in UI; 56 are data-layer-only honest metadata. | First pass (130 cards) landed 2026-05-14. Second pass (+39 SR) landed 2026-05-15 under operator's "even better" mandate. Operator review pending; demotion is one git rm. |
| P3-015 | Complete | Synthetic UI strip | Codex/Claude | `src/data.js` + 4 components/tabs + Watchlist + docs | `npm test` (23 tests); `npm run build` (-14 kB raw); `node scripts/verify-data.js` | All RNG-derived UI surfaces removed; `predictedPrice` OLS formula and real-data surfaces retained. | Closes deployment-readiness gate. |

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
| 2026-05-14 | P3-012 (first-pass) | Current promotion commit | Overwrote `data-staging/premium-metadata/sample.json` with 130-row classification fill (SCR + Leader tier). Ran importer → emitted `public/premiumMetadata.sample.json`. Promoted to `public/premiumMetadata.json` with `_isSample: false`. Added decision-log entry D-048. | `validate-premium-metadata.js` (130 items); `import-premium-metadata.js`; `verify-data.js` (9 invariants); `npm run build`; `npm test` (20 passing) | All rows confidence=high (per D-043 ranking-flag surfacing rule), all rows `manualReviewOnly`. Production artifact will surface badges on every SCR + Leader. Operator review pending; demotion path documented. |
| 2026-05-15 | P3-016 (pre-stage) | Current docs commit | Authored `docs/ebay-ingester-prestage.md`. Complete eBay Browse API ingester design: 3-set rotation, ~1,620 calls/run vs 5,000 free-tier daily quota (3.2× headroom), variant-matcher state machine, schema mapping, restoration sequence for synthetic surfaces D-049 retired. Paste-ready Codex prompt in § 7. | `git diff --check`; `node scripts/verify-data.js` | Activates when operator's eBay developer account approves + EBAY_APP_ID + EBAY_CERT_ID land in GitHub Actions secrets. Single Codex run ships the ingester. |
| 2026-05-15 | P3-012 (second-pass) | Current second-pass commit | Extended D-048 fill from 130 → 169 cards (added SR tier). Regenerated source fixture, re-validated (✓ 169 items), re-imported, re-promoted with updated production-framed `_disclaimer`. Amended D-048 with a "Second-pass amendment" subsection in `docs/decision-log.md`. | `validate-premium-metadata.js` (169 items); `import-premium-metadata.js`; `verify-data.js` (9 invariants); `npm run build` (647.94 kB raw / 96.48 kB gzip — unchanged); `npm test` (23 passing) | 113 of 169 rows surface UI badges; 56 are data-layer-only honest metadata. Operator review pending; demotion path unchanged. |
| 2026-05-15 | P3-015 | `0abf43e`, `e57e6e1`, `48c54d5`, `96a34a1`, `51df4b9`, this commit | Removed RNG-derived synthetic data exports, CardDetail gauges/breakdown, ValueScanner demand/supply columns, Watchlist Desirability sort, Market Dynamics, and Pricing Model desirability axis. Added D-049 and refreshed Methodology/STATUS. | `npm test` (23 passed); `npm run build` (647.85 kB raw / 96.38 kB gzip); `node scripts/verify-data.js` (9 invariants) | Production UI keeps live prices, 30d history, freshness, provenance, premium badges, and OLS model pricing. |
| 2026-05-31 | R-055 | `4a559d7` | Vite 5.4.1 → 8.0.14 (Rolldown/OXC). esbuild removed from tree entirely; npm audit 0 vulnerabilities. plugin-react 4→6. | `npm ci`; `verify-data` 9✓; `npm test` 23✓; dev HTTP 200; **CI green** | Raw +54 kB (OXC), gzip flat. D-051. R-055 closed. |
| 2026-05-31 | P3-016 (pre-stage) | `583498c` | eBay Browse API ingester pre-stage doc. | docs-only; verify-data ✓ | Paste-ready Codex prompt; activates on credential approval. |
| 2026-05-31 | P3-012 (SR pass logged) | `5dbbed3` | (already shipped) | — | Cross-ref only. |
| 2026-05-31 | FB10 pre-stage | `a210b1a` | FB10 onboarding pre-stage doc (D-052 rotation pre-decision). | docs-only; verify-data ✓ | Activates when Bandai + JustTCG publish FB10. |
| 2026-05-31 | P3-010 (impl) | `28de053`, `495cb2b`, `a804939` | Set Rankings + Chase Radar tabs + setAggregates pure lib. 21 new test cases (15 lib + 3 + 3 UI). | `npm test` (44 passed); `npm run build` (714.78 kB raw / 99.15 kB gzip, +12 kB raw since baseline — under 30 kB budget); verify-data 9✓ | Live-data + rarity only (D-053). Restoration prompts pre-stage `9263390`. README rewrite `4a633a1`. Autonomous worklist + D-050 bound logged this sweep. |

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
P3-013, P3-014, P3-015 complete; P3-003..P3-006 features shipped). The
remaining tasks are operator-gated:

- **P3-010** Set Rankings / Chase Radar UX spec (Q-034 — operator
  authors spec or hands to ChatGPT GPT-04).
- **P3-011** First real eBay comps fill (manual operator research;
  follow `docs/sample-gate-promotion-runbook.md`).
- **P3-012** First real premium-metadata fill (same path).

The first agent-doable Phase 3 run is **complete**. Further agent
work waits on one of the operator decisions above.
