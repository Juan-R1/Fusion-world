# FusionMetrics — Status Snapshot

**Date:** 2026-05-07
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Phase 2 spec foundation complete (11/18 tasks); P2-011 staging directory awaiting operator approval

---

## TL;DR

FusionMetrics now has a durable trust foundation, the full Phase 2 spec set,
and an architectural-audit pass that closed every drift item flagged by the
consistency audit. The app uses real JustTCG live prices, real JustTCG 30d
history, visible provenance, per-card freshness, Methodology copy disclosing
R² = 0.32 plus smoothed UC / extrapolated SPR / single-source caveats,
Set-Level Analytics, tightened Box EV language, and Watchlist v2 local
portfolio fields. Phase 2 specs are internally consistent (P2-018 closed
8 drift items); the canonical naming decisions are recorded in
`docs/decision-log.md` D-033 — D-035. The next work is operator approval
for P2-011 (staging directory scaffold).

---

## Stable checkpoint

| Area | Current state |
|------|---------------|
| Card scope | 1,258 cards across FB01–FB09 |
| Live prices | Known-good baseline: 1,156 |
| Coverage guards | Absolute floor 1,121; per-set floor 90% of previous count |
| Price file | `src/livePrices.json` contains current prices only |
| History file | `public/priceHistory30d.json` contains real JustTCG 30d history |
| Refresh metadata | `public/priceUpdateLog.json` powers provenance UI |
| Price history UI | `CardDetail` lazy-loads `/priceHistory30d.json` and caches it |
| Provenance | Footer/status chip and modal complete |
| Per-card freshness | Badge complete, based on each card's live price timestamp |
| Methodology | Methodology & Data Sources tab complete |
| Set analytics | Market Dynamics includes live value, coverage, freshness, and Chase Dependency |
| Box EV | Approximate assumptions, input quality, and cautious model verdict copy complete |
| Watchlist | Local v2 portfolio fields: quantity, entry price, current value, Unrealized P/L |
| Data verification | `scripts/verify-data.js` requires split shape only |
| Bundle | ~650 kB raw / ~95 kB gzip after Codex Methodology disclosures |
| External spot-check | 10 cards checked; 9 aligned, 1 unclear due to variant ambiguity |
| Phase 2 spec drift | **Closed** (P2-018 — 5 commits, all 8 drift items resolved) |
| Methodology trust disclosures | **Live** (commit `02e9733`) — R², smoothed UC, extrapolated SPR, single-source explicitly stated |
| Phase 2 progress | **11 / 18 tasks complete**; next-up is P2-011 (operator approval gated) |

---

## Recent commits

Most recent first (latest dev-branch head):

| SHA | Subject |
|-----|---------|
| `ea385ba` | docs: dashboard refresh after P2-018 completion |
| `482455f` | docs: open-questions — note P2-018 did not resolve any open question |
| `9a281f5` | docs: risk-register — close R-001 after P2-018; update top-5 |
| `c00c4a1` | docs: log canonical naming decisions D-033..D-035 |
| `5749345` | docs: mark Phase 2 consistency-audit findings as resolved |
| `b78f3e5` | docs: P2-018 — mark Complete in execution checklist |
| `9ef2135` | docs: P2-018e — document confidence-vocabulary divergence by entity |
| `b844e00` | docs: P2-018d — data-model-v2 § 13 mirror source-confidence-spec |
| `234672c` | docs: P2-018c — cross-reference and intentional-divergence annotations |
| `110d895` | docs: P2-018b — standardize gradeCompany field name |
| `0522bb8` | docs: P2-018a — canonical naming and required-field fixes |
| `fa18201` | chore: weekly price update (bot rotation) |
| `02e9733` | feat: Methodology — disclose model limits, delta, and coverage |
| `8570687` | docs: add methodology page review (no UI edits) |

---

## Yellow flags worth tracking

- **R-002 Agent reality-drift.** Multi-agent sessions occasionally
  describe completed work that exists on origin but not on the local
  clone. Mitigation: `AGENTS.md` § 9 now requires
  `git fetch --all` before any review.
- **R-017 Image licensing.** ~40 of 1,258 cards have real Bandai
  imagery; the rest fall back to icons. No strategy doc yet. Blocks
  portfolio-grade visuals past current state.
- **R-018 Single-source dependency on JustTCG.** Methodology page now
  discloses this explicitly. Multi-source comp ingestion is spec'd
  (P2-013 onward) but not implemented.
- **R-020 Plausible analytics never reviewed.** Tag has been live since
  `01daa2e`; nobody has read the dashboard. A 15-minute review would
  unblock honest user-behavior decisions.

---

## Data contract

- `src/livePrices.json` is machine-generated current price data only.
- `public/priceHistory30d.json` is machine-generated public 30d JustTCG
  history.
- `public/priceUpdateLog.json` is machine-generated refresh metadata.
- Legacy accumulator output has been retired. Do not recreate it without an
  approved long-term-history design.
- Estimated cards remain visible but are excluded from undervalued and
  overvalued rankings.
- Character, demand, supply, and desirability scores are model heuristics, not
  observed demand time series.

---

## Non-negotiables

- Make FusionMetrics unable to lie by accident.
- Do not add synthetic price history, synthetic market movement, fake trend
  visuals, or RNG pricing noise.
- Do not weaken `scripts/verify-data.js`, the 1,121 coverage guard, or the
  per-set guard.
- Do not manually edit generated JSON data.
- Do not write partial degraded data.
- Assume the JustTCG free tier unless the operator explicitly says otherwise.
- Rotation mode is the default update strategy. Full refresh remains manual
  and quota-risky.

---

## Recommended next sequence

1. **Approve P2-011** (staging directory scaffold). Docs-only; unblocks
   the Phase 2 implementation ladder. See `docs/phase-2-execution-checklist.md`
   § 4 row P2-011. Codex prompt is provided at the end of the most recent
   Claude run (CLA-24 synthesis).
2. Then **P2-012** (sample premium metadata fixture) — still operator-
   approval-gated, depends on P2-011.
3. **Read Plausible analytics dashboard** once (R-020 mitigation; 15 minutes).
4. **Image coverage strategy spec** when ready (R-017 mitigation; ChatGPT
   GPT-01 + Codex CDX-03 outputs queued).
5. Capture portfolio screenshots and record a short demo flow.
6. Review `docs/public-beta-backlog.md` before approving public-beta work.
7. Focused automated UI smoke tests after explicit approval
   (see `docs/test-coverage-gap-analysis.md` for proposed Vitest suite).
8. Later only: CSV export, eBay sold comps, manipulation / outlier detection,
   long-term history archive, paid API tier, accounts, alerts, and AI
   prediction.

---

## Resume checklist

1. `git checkout claude/dbfw-market-analytics-1qh5D && git pull`
2. Read `AGENTS.md`.
3. Use `.claude/skills/fusionmetrics-pipeline/SKILL.md` for data pipeline
   tasks.
4. Use `.claude/skills/fusionmetrics-qa/SKILL.md` for validation tasks.
5. Use `.claude/skills/fusionmetrics-product/SKILL.md` for product and
   analytics planning.
6. Before code commits, run `npm run build` and `node scripts/verify-data.js`.
