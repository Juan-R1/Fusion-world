# FusionMetrics — Status Snapshot

**Date:** 2026-05-15
**Branch:** `claude/dbfw-market-analytics-1qh5D` (PR #2 merged 2026-05-14; PR #1 merged 2026-05-12; new commits accumulating on the dev branch)
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Phase 3 operate-and-harden — 14/15 P3 tasks complete (P3-015 added). Synthetic UI surfaces retired.

---

## TL;DR

FusionMetrics is in operate-and-harden mode. Phase 2 closed; Phase 3 has shipped:
the SessionStart hook (R-002 mitigated), the cross-source spot-check protocol
(P3-007, mitigates R-018), the backend pre-stage plan (P3-009, Postgres on
Supabase free tier — activates only on trigger), the sample-gate promotion
runbook (the only sanctioned path to disable the sample-gate per artifact),
the quarterly model recalibration (constants updated against 1156 prices,
R²=0.318), production error capture via Plausible (P3-004), workflow failure
alerts (P3-005), Watchlist CSV export (P3-006), and a 20-case Vitest suite
(P3-008) wired into CI. PR #1 merged main forward 122 commits; PR #2 carries
ongoing Phase 3 work with a green CI gate. The trust contract is intact and
strictly enforced: production UI refuses to consume sample-flagged artifacts,
no synthetic price movement, R-001 / R-017 / R-036 / R-037 / R-038 closed;
P3-015 retired RNG-derived art/hype, demand, supply, pseudo-counts,
composite desirability, Watchlist Desirability sort, and Market Dynamics from
production UI; bundle shrank by roughly 14 kB raw versus the pre-strip build;
new R-055 esbuild dev-server advisory tracked but not blocking (production
unaffected). Decision log at 49 entries (D-001 — D-049). All P0 open
questions closed. Remaining Phase 3 backlog is **operator-only**: P3-010 UX
spec, P3-011 real eBay fill, P3-012 real premium-metadata fill. Plus the
standing R-020 Plausible weekly read.

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
| Set analytics | Retired from UI; Market Dynamics was removed because its axes depended on synthetic demand/supply values |
| Box EV | Approximate assumptions, input quality, and cautious model verdict copy complete |
| Watchlist | Local v2 portfolio fields: quantity, entry price, current value, Unrealized P/L |
| Data verification | `scripts/verify-data.js` requires split shape only |
| Bundle | ~648 kB raw / ~96 kB gzip after retiring synthetic UI paths |
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
| `this commit` | refactor: P3-015 follow-up — Watchlist sort + D-049 docs |
| `51df4b9` | refactor: PricingModel — X axis = character popularity heuristic (was: synthetic desirability composite) |
| `96a34a1` | refactor: remove Market Dynamics tab (synthetic inputs) |
| `48c54d5` | refactor: ValueScanner — drop demand and supply columns (synthetic; no real source) |
| `e57e6e1` | refactor: CardDetail — remove synthetic Demand/Supply gauges and Desirability composite (D-006/D-007 extension) |
| `0abf43e` | refactor: remove RNG artScore/demand/supply from data.js |
| `66285c4` | fix: P3-008 follow-up — regenerate package-lock.json (esbuild transitives) |
| `df452e1` | test: P3-008c full Vitest suite + CI integration |
| `bc9c8a8` | test: P3-008b smoke cases (5 of 20 gap-analysis cases) |
| `87a2ab6` | chore: P3-008a Vitest + RTL infrastructure |
| `247cf19` | docs: § 4b operator-handbook — ready-to-paste P3-008 Codex prompt |
| `07e91fe` | fix: session-brief.sh — clean count output |
| `bee76e9` | docs: ship P3-007 + P3-009 + sample-gate promotion runbook |
| `ff51bf3` | feat: SessionStart hook + scripts/session-brief.sh |
| `914d22a` | feat: P3-004 + P3-005 + P3-006 — error capture, workflow failure alerts, Watchlist CSV export |
| `5d70587` | docs: Phase 3 operate-and-harden scope (P3-001 + P3-002) |
| `81fadb7` | chore: quarterly recalibrate vs 1156 live prices (drift report) |
| `aac36a7` | chore: post-merge production verification 2026-05-12 |
| `13e4f29` | docs: housekeeping refresh post-P2-015 + P2-016 |
| `178a00a` | feat: P2-016 — CardDetail eBay sold-comps panel (sample-gated) |
| `0110c23` | feat: P2-015 — premium metadata UI badges (sample-gated) |
| `6c24fa1` | feat: P2-014 importer — sample-flagged premium-metadata + ebay-comps artifacts |
| `d429b38` | docs: close Q-002/Q-011..Q-024 — D-038..D-047 consolidated closure |

---

## Yellow flags worth tracking

- **R-020 Plausible analytics never reviewed.** **Highest-leverage open
  risk.** Tag live since `01daa2e`; no read yet. Every public-beta
  decision is being made without user-behavior signal. 15-min
  checklist in `docs/operator-handbook.md` § 5.
- **R-018 Single-source dependency on JustTCG.** Mitigation chain
  expanded 2026-05-14: Methodology disclosure + UI degradation states
  + `docs/cross-source-spot-check-protocol.md` (P3-007 quarterly
  manual check) + sample-gated comps infra ready for D-041 manual
  eBay fill + P3-009 backend pre-stage. Structural exit waits on
  P3-011 (operator-only).
- **R-055 esbuild dev-server advisory (new).** Two moderate-severity
  advisories on `esbuild ≤ 0.24.2` via Vite 5.4.1. **Dev-server only;
  production unaffected.** Fix requires Vite 8 breaking upgrade —
  out of scope for now, tracked as future task.
- **R-002 / R-017 / R-037 / R-038** — all closed or mitigated as of
  2026-05-14. See risk-register § 12 change log for state shifts.

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
- Character popularity is a stored card-database heuristic, not observed demand
  or a live trend.
- RNG-derived art/hype, demand, supply, pseudo-counts, and composite
  desirability are retired from production UI.

---

## Non-negotiables

- Make FusionMetrics unable to lie by accident.
- Do not add synthetic price history, synthetic market movement, fake trend
  visuals, RNG pricing noise, or RNG-derived demand/supply/art scoring.
- Do not weaken `scripts/verify-data.js`, the 1,121 coverage guard, or the
  per-set guard.
- Do not manually edit generated JSON data.
- Do not write partial degraded data.
- Assume the JustTCG free tier unless the operator explicitly says otherwise.
- Rotation mode is the default update strategy. Full refresh remains manual
  and quota-risky.

---

## Recommended next sequence (operator)

All agent-doable work is closed. The next moves require the operator
(or operator-driven Codex sessions):

1. **Merge PR #2 to main** when ready — fast-forward eligible, CI
   green on `66285c4`. Vercel will redeploy automatically; no
   user-visible change because the new commits are docs / test infra /
   small additive features (CSV export, error capture).
2. **Read Plausible analytics dashboard** once (R-020; 15 min).
   Pre-staged checklist: `docs/operator-handbook.md` § 5.
3. **Review the P3-015 synthetic-strip UI** on the dev branch before
   pushing/deploying. Watchlist should no longer offer Desirability sort.
4. **Decide P3-011** — start manual eBay sold-comps research per
   `docs/sample-gate-promotion-runbook.md`. Even 10–20 cards
   produces real comps data to promote. If eBay Browse API credentials
   land first, approve a separate ingester plan before any API work.
5. **Continue P3-012 review** — production premium metadata is live;
   operator review can demote or amend any row.
6. **Capture portfolio screenshots / demo flow** after P3-015 review.
7. **Optional: Vite 8 upgrade** to close R-055. Out-of-band Codex
   task; not blocking; defer until other work clears.
8. **Do not start P2-017 backend** unless a Backend Trigger Checklist
   condition fires AND you explicitly approve. The pre-stage plan is
   ready (`docs/backend-prestage-plan.md`).
9. **Quarterly recalibration cadence**: next due 2026-08-12 (P3-003).
10. **Cross-source spot-check cadence**: first run pending; next due
    90 days after first run (P3-007).

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
