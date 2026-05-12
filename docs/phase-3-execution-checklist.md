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
| P3-007 | Not started | Cross-source spot-check protocol doc | ChatGPT/Codex | `docs/cross-source-spot-check-protocol.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | Manual operator checklist exists; no API calls. | No scraping. |
| P3-008 | Needs user approval | Test suite | Claude/Codex | To be approved | `npm run build`; `node scripts/verify-data.js`; test command | Operator-approved test framework and first smoke cases exist. | Q-031; do not start without approval. |
| P3-009 | Not started | P2-017 backend pre-stage doc | ChatGPT/Codex | `docs/backend-prestage-plan.md`; checklist | `git diff --check`; `node scripts/verify-data.js` | Backend trigger analysis exists; no implementation. | Activates only when backend trigger condition fires. |
| P3-010 | Needs user approval | Set Rankings / Chase Radar UX spec | ChatGPT/Codex | To be approved | `git diff --check`; `node scripts/verify-data.js` | UX spec exists and avoids unsupported investment claims. | Q-034; operator-only. |
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

Next recommended task: **P3-007 Cross-source spot-check protocol doc**.

P3-008, P3-010, P3-011, and P3-012 remain operator-only.
