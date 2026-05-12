# FusionMetrics — Status Snapshot

**Date:** 2026-05-12
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Phase 2 UI consumption landing (17/18 tasks complete). P2-017 (backend decision) remains operator-only and is not approved.

---

## TL;DR

FusionMetrics has a durable trust foundation, the full Phase 2 spec set,
two sample fixtures with validators in `data-staging/`, the P2-014 importer
emitting sample-flagged artifacts under `public/`, and **all P0 open
questions closed** plus 10 additional P1/P2 closures from the 2026-05-12
consolidated decision run (D-038..D-047). The app uses real JustTCG live
prices, real JustTCG 30d history, visible provenance, per-card freshness,
Methodology copy disclosing R² = 0.32 plus smoothed UC / extrapolated SPR /
single-source caveats, Set-Level Analytics, tightened Box EV language,
Watchlist v2 local portfolio fields, sample-gated premium metadata badges,
and a sample-gated CardDetail eBay sold-comps panel. Phase 2 specs are
internally consistent (P2-018 closed 8 drift items). Decision log now at 47
entries (D-001 — D-047). The only remaining Phase 2 task is **P2-017**
(backend decision), and no backend trigger condition has fired.

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
| Bundle | ~660 kB raw / ~99 kB gzip after sample-gated UI consumption layers |
| External spot-check | 10 cards checked; 9 aligned, 1 unclear due to variant ambiguity |
| Phase 2 spec drift | **Closed** (P2-018 — 5 commits, all 8 drift items resolved) |
| Methodology trust disclosures | **Live** (commit `02e9733`) — R², smoothed UC, extrapolated SPR, single-source explicitly stated |
| Phase 2 progress | **17 / 18 tasks complete**; next-up is P2-017 (backend decision, operator-only) |
| Premium metadata fixture | **Live** (`313fa55`) — 6 illustrative rows + `scripts/validate-premium-metadata.js` |
| eBay sold comps fixture | **Live** (`9153ad6`) — 6 sample rows + `scripts/validate-ebay-comps.js`; no scraping |
| P2-014 importer | **Live** (`6c24fa1`) — `scripts/import-premium-metadata.js`, `scripts/import-ebay-comps.js` emit `public/premiumMetadata.sample.json` + `public/ebayCompsSummary.sample.json`. Sample-flag contract: `_isSample: true` + `.sample.json` filename gate; production UI must NOT consume. |
| P2-015 premium metadata UI | **Live** (`0110c23`) — UI fetches `/premiumMetadata.json` only, refuses `_isSample`, and renders no badges until a production artifact exists. |
| P2-016 eBay comps panel | **Live** (`178a00a`) — CardDetail fetches `/ebayCompsSummary.json` only, refuses `_isSample`, separates raw/graded comps, and renders awaiting-fixture copy until production comps exist. |
| Promo namespace decision (Q-001) | **Closed D-036** — three-tier scheme; see `docs/promo-namespace-decision.md` |
| Cross-source variance thresholds (Q-003) | **Closed D-037** — base 15%/35% + per-rarity adjustments; see `docs/cross-source-threshold-decision.md` |
| Image strategy (Q-002) | **Closed D-038** — icons-only default; Option C upgrade path on three named triggers; see `docs/image-coverage-strategy.md` |
| P1/P2 decision sweep | **Closed D-039..D-047** (2026-05-12) — GDR is a premiumFlag (Q-011), Bandai canonical for treatment names (Q-012), manual eBay first sold-comp source (Q-013), ≥10 eligible comps for manipulation-risk label (Q-014), two-tier confidence rule for badges (Q-015), `boxTopHit` derived at runtime (Q-020), per-grader public reports + default `populationKnown=false` (Q-022), comps aggregates on demand (Q-023), sealed-price freshness = 30 days (Q-024) |

---

## Recent commits

Most recent first (latest dev-branch head):

| SHA | Subject |
|-----|---------|
| `178a00a` | feat: P2-016 — CardDetail eBay sold-comps panel (sample-gated) |
| `0110c23` | feat: P2-015 — premium metadata UI badges (sample-gated) |
| `6c24fa1` | feat: P2-014 importer — sample-flagged premium-metadata + ebay-comps artifacts |
| `d429b38` | docs: close Q-002/Q-011..Q-024 — D-038..D-047 consolidated closure |
| `79cd1c8` | docs: housekeeping refresh post-P2-012/P2-013/Q-001/Q-002/Q-003 |
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
| `0522bb8` | docs: P2-018a — canonical naming and required-field fixes |
| `02e9733` | feat: Methodology — disclose model limits, delta, and coverage |

---

## Yellow flags worth tracking

- **R-002 Agent reality-drift.** Multi-agent sessions occasionally
  describe completed work that exists on origin but not on the local
  clone. Mitigation: `AGENTS.md` § 9 now requires
  `git fetch --all` before any review.
- **R-017 Image licensing.** **Closed 2026-05-12 via D-038** — icons-only
  is the default; Option C upgrade path (third-party rights-cleared API)
  fires on three named triggers. Re-opens automatically if any trigger
  fires. See `docs/image-coverage-strategy.md`.
- **R-018 Single-source dependency on JustTCG.** Methodology page now
  discloses this explicitly. D-041 (manual eBay first sold-comp) is the
  first structural mitigation; the P2-015 / P2-016 consumption layers are
  complete, but production comps data remains intentionally gated.
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

1. **Do not start P2-017 backend work** unless at least one Backend Trigger
   Checklist condition fires and the operator explicitly approves it.
2. **Read Plausible analytics dashboard** once (R-020 mitigation; 15
   minutes). Pre-staged checklist in `docs/operator-handbook.md` § 5.
3. Capture portfolio screenshots and record a short demo flow.
4. Review `docs/public-beta-backlog.md` for the rest of the public-beta
   prerequisites.
5. Focused automated UI smoke tests after explicit approval
   (see `docs/test-coverage-gap-analysis.md` for proposed Vitest suite).
6. Later only: CSV export, manipulation / outlier detection visible
   in UI (gated on D-042 ≥10 eligible comps), long-term history
   archive, paid API tier, accounts, alerts, and AI prediction.

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
