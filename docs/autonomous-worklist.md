# Autonomous Work Session — Live Worklist

**Session started:** 2026-05-31
**Agent:** Claude architect (Opus 4.8)
**Branch:** `claude/review-claude-md-nZk1S`
**Driving prompt:** operator's "AUTONOMOUS WORK SESSION" mandate.

> This is the live task tracker for the current autonomous run. Updated
> as each item lands. Replaces the ephemeral TodoWrite (MCP server is
> disconnected this session) with a durable artifact that survives
> across sessions and is visible to the operator + future agents.

## Status legend
- ✅ Done (committed + pushed + validated)
- 🔧 In progress
- ⏳ Queued
- ⏸ Bounded / skipped (with rationale)
- ⛔ Operator gate (cannot proceed without operator)

## Backlog

| # | Item | Status | Notes |
|---|------|--------|-------|
| 0 | Preflight | ✅ | Clean tree, 9 invariants, 23 tests, in sync with origin. 5 commits ahead of main (PR #14, CI-green). |
| 1 | Premium-metadata expansion → R/UC/C | ⏸ Bounded | **Stopping at 169-card SCR+SR+Leader tier.** Schema § 5 forbids chase flags on commons ("low-context Gogeta common with no source-backed chase role"). Collector tags only render alongside a surfaced flag, so bulk-classifying 1,028 commons adds invisible rows + overclaim risk. Conservative reading → do not extend. Rationale logged as D-050. |
| 2 | Vite 8 upgrade (R-055) | ✅ | Vite 8 uses Rolldown/OXC — esbuild removed from tree entirely (0 vulnerabilities). plugin-react 4→6. Raw bundle +54 kB (OXC minifier) but gzip flat (+0.04 kB). Dev server boots 207 ms, HTTP 200. R-055 closed. |
| 3 | Set Rankings + Chase Radar (P3-010 impl) | ⏳ queued | Spec at docs/set-rankings-spec.md; uses only real live-price + rarity data, honest today. |
| 4 | Bundle optimization (R-021 / S2 code-split) | ⏳ queued | Dynamic import() per tab. |
| 5 | Test coverage deepening | ⏳ queued | Cases for paths touched above + unimplemented gap-analysis cases. |
| 6 | Doc consistency sweep | ⏳ queued | Reconcile STATUS / AGENTS § 2 / checklist / decision-log + risk-register counts; log D-050 (Item 1 bound), D-051 if Vite landed. |

## Operator gates (noted, not attempted)
- ⛔ eBay ingester — needs EBAY_APP_ID/CERT_ID in secrets.
- ⛔ Synthetic-surface restoration — needs eBay data to exist first.
- ⛔ Plausible analytics read — needs operator login.
- ⛔ Backend / P2-017 — needs a Backend Trigger Checklist condition.
- ⛔ TCGplayer partner application.
- ⛔ Any push to main / PR merge — operator decides.

## Commit log this session

| SHA | Subject | Validation |
|-----|---------|------------|
| _(this commit)_ | chore: Vite 5→8 upgrade (closes R-055) + autonomous worklist | build ✓, verify-data 9✓, tests 23✓, dev HTTP 200 |

## Update protocol
- After each commit, add a row to the commit log + flip the backlog
  status.
- When all reachable items are done or gated, write the consolidated
  report and stop.
