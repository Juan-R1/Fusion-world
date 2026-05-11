# FusionMetrics — Status Snapshot

**Date:** 2026-05-11
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Phase 2 fixture layer landing (14/18 tasks complete). P2-014 importer is the next operator gate.

---

## TL;DR

FusionMetrics now has a durable trust foundation, the full Phase 2 spec set,
two sample fixtures with validators in `data-staging/`, and two of three P0
open questions closed by Claude-authored decisions. The app uses real
JustTCG live prices, real JustTCG 30d history, visible provenance, per-card
freshness, Methodology copy disclosing R² = 0.32 plus smoothed UC /
extrapolated SPR / single-source caveats, Set-Level Analytics, tightened Box
EV language, and Watchlist v2 local portfolio fields. Phase 2 specs are
internally consistent (P2-018 closed 8 drift items). Canonical naming
decisions: D-033 — D-037 in `docs/decision-log.md`. The next operator gate
is P2-014 (importer) — touches the generated-artifact path, requires
explicit approval.

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
| Phase 2 progress | **14 / 18 tasks complete**; next-up is P2-014 importer (operator approval required) |
| Premium metadata fixture | **Live** (`313fa55`) — 6 illustrative rows + `scripts/validate-premium-metadata.js` |
| eBay sold comps fixture | **Live** (`9153ad6`) — 6 sample rows + `scripts/validate-ebay-comps.js`; no scraping |
| Promo namespace decision (Q-001) | **Closed D-036** — three-tier scheme; see `docs/promo-namespace-decision.md` |
| Cross-source variance thresholds (Q-003) | **Closed D-037** — base 15%/35% + per-rarity adjustments; see `docs/cross-source-threshold-decision.md` |
| Image strategy proposal (Q-002) | **Active proposal** in `docs/image-coverage-strategy.md`; default = icons-only; awaits operator confirm |

---

## Recent commits

Most recent first (latest dev-branch head):

| SHA | Subject |
|-----|---------|
| `68946c9` | docs: Q-002 image strategy proposal (icons-only default, Option C upgrade path) |
| `d26ba1b` | docs: Q-003 closure — cross-source variance thresholds (D-037) |
| `c2c7ae2` | docs: Q-001 closure — promo namespace decision (D-036) |
| `9153ad6` | feat: P2-013 — eBay sold comps sample fixture + validator |
| `313fa55` | feat: P2-012 — premium metadata sample fixture + validator |
| `ee18acd` | docs: CLAUDE.md — append Phase 2 progress snapshot |
| `6ab8719` | docs: add operator handbook with ready-to-paste prompts |
| `bcc3dcc` | docs: refresh public-beta backlog against May 2026 state |
| `dca9b04` | chore: approve P2-011 and add staging directory scaffold |
| `869b3ee` | docs: STATUS.md refresh post-P2-018 |
| `c00c4a1` | docs: log canonical naming decisions D-033..D-035 |
| `5749345` | docs: mark Phase 2 consistency-audit findings as resolved |
| `0522bb8` | docs: P2-018a — canonical naming and required-field fixes |
| `02e9733` | feat: Methodology — disclose model limits, delta, and coverage |

---

## Yellow flags worth tracking

- **R-002 Agent reality-drift.** Multi-agent sessions occasionally
  describe completed work that exists on origin but not on the local
  clone. Mitigation: `AGENTS.md` § 9 now requires
  `git fetch --all` before any review.
- **R-017 Image licensing.** ~40 of 1,258 cards have real Bandai
  imagery; the rest fall back to icons. **Proposal active** in
  `docs/image-coverage-strategy.md` (icons-only default, upgrade to a
  third-party rights-cleared API on demand triggers). Reverts to fully
  closed when operator confirms.
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

1. **Read Plausible analytics dashboard** once (R-020 mitigation; 15
   minutes). Pre-staged checklist in `docs/operator-handbook.md` § 5.
2. **Confirm or counter-propose the image strategy** in
   `docs/image-coverage-strategy.md` (Q-002). Default is icons-only;
   confirm or pick a different option.
3. **Approve P2-014 (importer)** when ready. This is the next gated
   task that crosses into generated-artifact territory; needs an
   explicit operator green-light. P2-012 and P2-013 fixtures are
   already in `data-staging/` with validators.
4. Capture portfolio screenshots and record a short demo flow.
5. Review `docs/public-beta-backlog.md` for the rest of the public-beta
   prerequisites.
6. Focused automated UI smoke tests after explicit approval
   (see `docs/test-coverage-gap-analysis.md` for proposed Vitest suite).
7. Later only: P2-015 UI badges, P2-016 comps panel, CSV export,
   manipulation / outlier detection, long-term history archive, paid
   API tier, accounts, alerts, and AI prediction.

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
