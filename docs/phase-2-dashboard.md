# Phase 2 Progress Dashboard

**Last refreshed:** 2026-05-07 (post-P2-018)
**Audit task:** CLA-05 of the Claude Code architectural-audit run
**Snapshot baseline:** `482455f docs: open-questions — note P2-018 did not resolve any open question`

> Designed as the operator's daily heads-up display. Replaces the need
> to grep `phase-2-execution-checklist.md` to find out "what's next."
> If this file conflicts with the checklist, the **checklist is
> canonical**; update this dashboard to match.

## 1. At a glance

| Metric | Value |
|--------|------:|
| Phase 2 tasks total | 18 |
| Complete | **12** |
| Needs user approval | **6** |
| Blocked | 0 |
| Skipped | 0 |
| **Next-up** | **P2-012** (sample premium metadata fixture — approval required) |
| Most recent closure | P2-011 staging directory scaffold |

Working tree clean. `verify-data.js` passes (split shape, 9 invariants).
Bundle 647.93 kB raw / 94.94 kB gzip.

## 2. Status table

Every P2-XXX task, current status, commit SHA when complete, owner,
validation, and blocker. Cross-linked to its spec doc and to the
canonical checklist row.

| ID | Status | Task | Spec | Owner | Closed by | Validation |
|----|--------|------|------|-------|-----------|------------|
| P2-001 | ✅ Complete | Phase 2 expansion plan | `docs/phase-2-data-expansion-plan.md` | Codex | `ee6b6c4` | docs-only; verify-data ✓ |
| P2-002 | ✅ Complete | Execution checklist | `docs/phase-2-execution-checklist.md` | Codex | `ee6b6c4` | docs-only; verify-data ✓ |
| P2-003 | ✅ Complete | v2 data model | `docs/data-model-v2.md` | ChatGPT plan, Codex docs | `553400c` | docs-only; verify-data ✓ |
| P2-004 | ✅ Complete | Premium metadata schema | `docs/premium-metadata-schema.md` | ChatGPT plan, Codex docs | `4770375` | docs-only; verify-data ✓ |
| P2-005 | ✅ Complete | SB set staging schema | `docs/sb-set-staging-spec.md` | ChatGPT plan, Codex docs | `5b1f7a8` | docs-only; verify-data ✓ |
| P2-006 | ✅ Complete | eBay sold comps CSV spec | `docs/ebay-comps-import-spec.md` | ChatGPT plan, Codex docs | `0b70442` | docs-only; verify-data ✓ |
| P2-007 | ✅ Complete | Source confidence spec | `docs/source-confidence-spec.md` | ChatGPT plan, Codex docs | `63a7dec` | docs-only; verify-data ✓ |
| P2-008 | ✅ Complete | Graded comps spec | `docs/graded-comps-spec.md` | ChatGPT plan, Codex docs | `fcb13cf` | docs-only; verify-data ✓ |
| P2-009 | ✅ Complete | Sealed products spec | `docs/sealed-products-spec.md` | ChatGPT plan, Codex docs | `252c3c3` | docs-only; verify-data ✓ |
| P2-010 | ✅ Complete | Expanded data validation plan | `docs/expanded-data-validation-plan.md` | Codex/Claude | `b979b72` | docs-only; verify-data ✓ |
| **P2-011** | ✅ Complete | Staging directory scaffold (docs only) | — | Codex/Claude | Current docs commit | docs-only; verify-data ✓ |
| P2-012 | 🟡 Needs user approval | Sample premium metadata fixture | premium-metadata-schema.md | Claude/Codex | — | dedicated validator + verify-data |
| P2-013 | 🟡 Needs user approval | Sample eBay CSV fixture | ebay-comps-import-spec.md | Codex | — | dedicated validator + verify-data |
| P2-014 | 🟡 Needs user approval | Importer (after fixtures/specs) | expanded-data-validation-plan.md | Claude | — | `node --check`, validator, verify-data, `npm run build` |
| P2-015 | 🟡 Needs user approval | UI badges/filters (after metadata) | premium-metadata-schema.md § 12 | Claude/Codex | — | `npm run build` + verify-data |
| P2-016 | 🟡 Needs user approval | CardDetail comps panel (after comps) | ebay-comps-import-spec.md § 15, graded-comps-spec.md § 16 | Claude/Codex | — | `npm run build` + verify-data |
| P2-017 | 🟡 Needs user approval | Backend (after trigger criteria) | phase-2-data-expansion-plan.md § 9 | ChatGPT plan, Claude later | — | docs-first; verify-data |

**Proposed addition (not yet in checklist):**

| ID | Status | Task | Source | Owner | Validation |
|----|--------|------|--------|-------|------------|
| P2-018 | ✅ Complete | Phase 2 spec-tightening pass (resolves R-001 drift) | `docs/phase-2-consistency-audit.md` § 8–9 | Claude | `0522bb8`, `110d895`, `234672c`, `b844e00`, `9ef2135` (5-commit run) | docs-only; verify-data ✓ |

## 3. Dependency graph

What blocks what. **→** means "must complete before."

```
P2-001 ┐
P2-002 ┤
P2-003 ┤
P2-004 ┤
P2-005 ┤
P2-006 ┤
P2-007 ┤   (all docs/specs — independent, all complete)
P2-008 ┤
P2-009 ┤
P2-010 ┘
        ╲
         → P2-011 (staging directory scaffold)
                ╲
                 → P2-012 (premium metadata fixture)
                 → P2-013 (eBay CSV fixture)
                        ╲
                         → P2-014 (importer)
                                ╲
                                 → P2-015 (UI badges/filters)
                                 → P2-016 (comps panel)

P2-017 (backend) ← independently gated by Backend Trigger Checklist
                   in phase-2-execution-checklist.md § 7
```

**P2-018 (Complete 2026-05-07)** closed the drift that would have
contaminated P2-014. The validator code in P2-014 can now reference the
canonical names settled by P2-018 without doing its own reconciliation.

## 4. Approval-gate cluster

Six tasks sit at "Needs user approval." Each gate has different
prerequisite conditions.

| Task | Approval prerequisites |
|------|------------------------|
| P2-012 | Premium metadata fixture path + validator file path agreed; sample card count (~5–10 illustrative rows) decided. |
| P2-013 | eBay CSV fixture path agreed; sample listing source (manual research, no scraping) and row count decided. |
| P2-014 | Importer language/style decided (script vs. build step). Validator must exist (P2-012/P2-013 fixtures imply this). R-001 drift should be resolved (P2-018) before this lands. |
| P2-015 | Premium metadata artifact must exist on disk (post P2-012). UI copy reviewed against the forbidden-language list. |
| P2-016 | Comps artifact must exist on disk (post P2-013). Raw/graded separation enforced in UI. |
| P2-017 | At least one Backend Trigger Checklist item (`phase-2-execution-checklist.md` § 7) must be true. None are true today. |

## 5. Audit findings from CLA-XX (this run)

The architectural-audit run that produced this dashboard also produced
these docs:

| Doc | What it tells you |
|-----|------------------|
| [`docs/phase-2-consistency-audit.md`](./phase-2-consistency-audit.md) | 12 inter-spec inconsistencies — **all resolved as of 2026-05-07 via P2-018**; see § 8 "Resolution status" table. |
| [`docs/risk-register.md`](./risk-register.md) | 29 ranked risks; R-001 closed by P2-018 and R-036 closed by Codex `02e9733`. P0 open count is now **0**. |
| [`docs/test-coverage-gap-analysis.md`](./test-coverage-gap-analysis.md) | 20 proposed Vitest cases, tiered P3 until operator-approved. |
| [`docs/bundle-audit-2026-05-07.md`](./bundle-audit-2026-05-07.md) | 5 reduction strategies; recommends S2 (code-split tabs) as the near-term move. |
| [`docs/decision-log.md`](./decision-log.md) | 35 architectural decisions (32 from prior sessions + D-033/D-034/D-035 from P2-018). |
| [`docs/open-questions.md`](./open-questions.md) | 22 unresolved questions; none closed by P2-018; the 3 P0 questions still depend on ChatGPT/Codex strategy plus operator decision. |
| [`docs/methodology-review.md`](./methodology-review.md) | 10 trust-disclosure gaps; **all 6 proposed edits shipped by Codex commit `02e9733`**. |

## 6. Top-3 risks (from risk register)

Live state pulled from `docs/risk-register.md` § 9:

1. **R-002** Agent reality-drift (claimed vs actually done) → P0 →
   mitigation = checklist as source of truth + `git fetch --all`
   preflight. Active.
2. **R-017** Image licensing exposure → P1 → mitigation = image
   coverage strategy spec (queued in Codex's CDX-03 prompt).
3. **R-020** Plausible analytics blind spot → P1 → mitigation = 15-minute
   weekly read of the Plausible dashboard; nothing automated yet.

R-001 (Phase 2 spec drift) is **closed** by P2-018. R-036 (Methodology
disclosure gaps) is **closed** by Codex commit `02e9733`.

## 7. How to read this dashboard

- **At a glance** answers "what's the next move."
- **Status table** answers "what's the state of task X."
- **Dependency graph** answers "what unblocks what."
- **Approval gate cluster** answers "what does the operator need to
  decide before each next step."
- **Audit findings** is the deeper context for current sub-projects.

## 8. Update protocol

Update this file when:

- A Phase 2 task changes status (always after the corresponding
  checklist row updates).
- A new audit doc is committed (add a row to § 5).
- A new risk crosses into the top-3 (refresh § 6).
- The bundle size, invariant count, or coverage floor materially
  changes.

Do **not** edit this dashboard before editing
`docs/phase-2-execution-checklist.md`. The checklist is canonical;
this dashboard mirrors it.

## 9. What this dashboard is NOT

- It is not a roadmap for new features (see ChatGPT GPT-11 output
  when it lands, or `docs/public-beta-backlog.md`).
- It is not a CI status board (CI is on GitHub Actions).
- It is not a code-review queue.
- It is not for tracking non-Phase-2 work (use commit history).
