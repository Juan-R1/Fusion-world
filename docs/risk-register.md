# FusionMetrics Risk Register

**Compiled:** 2026-05-07
**Audit task:** CLA-02 of the Claude Code architectural-audit run
**Baseline commit:** `148fe17 docs: phase 2 specs internal-consistency audit`

## 1. Purpose

A single consolidated risk register pulled from every Phase 2 spec's
embedded Risks/Stop-conditions section, deduplicated, scored, and
extended with risks not yet captured anywhere in the repo.

This file is the source of truth for project risk. Future agents should
update it when a risk is closed, downgraded, or newly identified.

## 2. Scoring legend

| Tier | Meaning | When to act |
|------|---------|-------------|
| **P0** | Active blocker. Mitigation must land before any new Phase 2 implementation. | Now |
| **P1** | Material risk. Should be tracked actively; an owner is assigned. | Within current Phase 2 cycle |
| **P2** | Tracked, not urgent. Mitigation is desirable but not blocking. | Next phase |
| **P3** | Long-term watch. May never need active mitigation if conditions change. | When triggers fire |

| Status | Meaning |
|--------|---------|
| **open** | No mitigation in place. |
| **monitored** | Aware; no formal mitigation, but tracked. |
| **mitigated** | Active mitigation reduces likelihood/impact materially. |
| **closed** | No longer a risk under current scope. |

## 3. Source map

Every risk row in § 4–7 cites where it came from:

- `plan-§N` → `docs/phase-2-data-expansion-plan.md` section N
- `sb-§N`  → `docs/sb-set-staging-spec.md`
- `ebay-§N` → `docs/ebay-comps-import-spec.md`
- `srcconf-§N` → `docs/source-confidence-spec.md`
- `graded-§N` → `docs/graded-comps-spec.md`
- `sealed-§N` → `docs/sealed-products-spec.md`
- `val-§N` → `docs/expanded-data-validation-plan.md`
- `audit-§N` → `docs/phase-2-consistency-audit.md`
- `agents-§N` → `AGENTS.md`
- `new` → not previously catalogued anywhere; this register is the first
  record

## 4. P0 — Active blockers

### R-001 — Phase 2 spec internal-consistency drift
- **Sources:** `audit-§8` (all 8 drift findings)
- **Description:** Eight drift items across Phase 2 specs (`winner` vs
  `winnerPromo`, `gradedContamination` vs `rawGradedContamination`,
  `gradeCompany` vs `company`, structural mismatch on
  `source_confidence` between data-model-v2 and the spec doc, etc.).
- **Impact:** Validators written against either spec will fail-closed on
  rows that pass the other. Importers must either silently rename fields
  or hard-fail.
- **Likelihood:** High — every future validator hits at least one drift.
- **Owner:** Codex or Claude (mechanical doc-edit task, ≈2 commits).
- **Mitigation:** P2-018 spec-tightening pass shipped 2026-05-07.
  Closing commits: `0522bb8` (A1/A2/B1/B2/E1), `110d895` (D1),
  `234672c` (C1/C2 + H2 cross-refs), `b844e00` (F1),
  `9ef2135` (H1). See `docs/phase-2-consistency-audit.md` § 8
  "Resolution status" table and the new P2-018 row in
  `docs/phase-2-execution-checklist.md` § 4.
- **Residual risk after mitigation:** Low. The 8 documented drift items
  are closed. Future drift remains a watch item; every new spec edit
  must keep cross-references consistent. No active validator failure
  surface today.
- **Status:** mitigated.

### R-002 — Agent reality-drift (claimed-done vs actually-done)
- **Sources:** new (observed in May 2026 review sessions)
- **Description:** Operator prompts repeatedly assert completed work that
  doesn't exist on the active branch. In two separate sessions, a review
  prompt described ~20 completed items that were either missing,
  on a different branch, or on origin but unsynced locally.
- **Impact:** Reviews calibrate against fiction; recommendations are
  wrong; later prompts compound the error.
- **Likelihood:** High in multi-agent setups; observed twice in May 2026.
- **Owner:** Process (operator + every agent's preflight).
- **Mitigation:** **P3-014 SessionStart hook + `scripts/session-brief.sh`
  (commit `ff51bf3` / `07e91fe`) structurally closes the silent-drift
  path.** Every Claude Code session now auto-loads branch + drift vs
  origin/main + verify-data + recent commits + Phase 3 task counts +
  sample-gate state before the first prompt. `AGENTS.md` § 5 documents
  the manual invocation.  `AGENTS.md` standard workflow still requires
  `git fetch --all` + `git pull --ff-only` + `git status` as a belt-
  and-suspenders preflight. The canonical "what's done" sources are
  `docs/phase-2-execution-checklist.md` and
  `docs/phase-3-execution-checklist.md`.
- **Residual risk:** Low — auto-loaded brief + checklist canonical
  source make silent drift hard to reach.
- **Status:** mitigated (was: monitored).

### R-003 — Coverage guard can be silently bypassed via manual restore
- **Sources:** `agents-§3` rule 5; new
- **Description:** If a degraded `src/livePrices.json` ever lands by hand
  (or via a future overwrite) and the next rotation merges against it,
  the per-set guard's baseline becomes the degraded distribution. The
  absolute floor (1,121) still catches catastrophic drops, but a slow
  per-set ratchet-down is possible.
- **Impact:** Slow data degradation that passes `verify-data.js` because
  the absolute floor is satisfied at each step.
- **Likelihood:** Low (guarded against by `agents-§6` rule + per-set
  guard); never observed.
- **Owner:** Pipeline (Codex / Claude when editing `update-prices.js`).
- **Mitigation:** Per-set floor at 90% of *previous* count means a
  single-step ratchet caps at 10%; combined with the 1,121 absolute
  floor and the "never hand-edit generated JSON" rule, the surface is
  small. Could be tightened further by anchoring the per-set baseline to
  a known-good archive (not the current file).
- **Residual risk:** Low.
- **Status:** monitored.

## 5. P1 — Material risks

### R-010 — Variant mismatch / variant ambiguity
- **Sources:** `plan-§11`, `sb-§14`, `ebay-§17`, `graded-§17`,
  `audit-§4.5`
- **Description:** Public market sources mix base, alt-art, manga,
  godRare, GDR, promo, reprint, and foil variants. A comp marked for
  `FB02-139` may be the SCR Vegito, the alt-art Vegito, or a reprint —
  with very different prices.
- **Impact:** Aggregate medians become meaningless; "undervalued"
  rankings could highlight cards whose comps are wrongly attributed.
- **Likelihood:** High — every comps source has this problem.
- **Owner:** Data (validators + variantMatch enum + manual review).
- **Mitigation:** `variantMatch` enum
  (`exact`/`likely`/`ambiguous`/`mismatch`/`excluded`) on every comps
  row. `variantAmbiguity` riskTag. Manual review required for
  `confidence=high`. No automation without explicit approval.
- **Residual risk:** Medium — manual review is the only defense; will
  shrink only after a structured premium taxonomy lands.
- **Status:** mitigated by spec; not yet by code (no validator exists).

### R-011 — Raw/graded contamination
- **Sources:** `plan-§11`, `ebay-§9`, `graded-§2`, `audit-§4.3`,
  `audit-§4.5`
- **Description:** A PSA 10 graded sale at $400 mixed into a raw NM
  median for the same card pushes the median price upward, distorting
  rankings and Box EV.
- **Impact:** Card valuations inflated; "undervalued" calls become
  arbitrage traps.
- **Likelihood:** High without active separation.
- **Owner:** Data (validators).
- **Mitigation:** `rawOrGraded` field required on every comp row. eBay
  comps validator must reject mixed aggregates. `rawGradedContamination`
  risk tag flags ambiguous rows. No graded UI until graded comps spec is
  implemented (P2-016 user-approval gate).
- **Residual risk:** Low if validators land first; high if any comps
  ingestion happens before validators.
- **Status:** mitigated by spec; not yet by code.

### R-012 — eBay ToS / API / rate-limit uncertainty
- **Sources:** `plan-§11`, `ebay-§14`
- **Description:** eBay's API has access constraints and ToS that may
  prohibit certain automated retrieval patterns. Manual research is
  allowed; bulk scraping is not.
- **Impact:** A premature automation push could draw a rate-limit ban,
  account suspension, or worse.
- **Likelihood:** High if scraping is attempted; near-zero under
  current manual-only policy.
- **Owner:** Operator (final approval); Codex/Claude (no scraping
  ever).
- **Mitigation:** External Source Approval Checklist in
  `phase-2-execution-checklist.md` § 8 explicitly gates all eBay/API
  work. P2-014 (importer) is `Needs user approval`. No agent can scrape.
- **Residual risk:** Low under current rules.
- **Status:** mitigated by process.

### R-013 — JustTCG free-tier quota exhaustion
- **Sources:** `plan-§4`, `agents-§4`, observed
- **Description:** JustTCG free tier is ~100 requests/day, 1,000/month,
  20 cards/page. A full FB01–FB09 refresh costs ~67 requests; a single
  badly-timed manual `mode=full` plus a scheduled run blows the day.
- **Impact:** Coverage guard correctly refuses to commit degraded data;
  the day's refresh produces no update; next day's quota also at risk.
- **Likelihood:** Medium — has happened multiple times in March/April
  2026; rotation mitigates but doesn't eliminate.
- **Owner:** Operator (workflow trigger decisions).
- **Mitigation:** Rotation mode is default (~25 reqs/run). Full mode
  requires explicit approval. Rate-limit-aware fetch already includes
  typed errors, `Retry-After` honoring, run-level abort.
- **Residual risk:** Low under current rotation cadence.
- **Status:** mitigated.

### R-014 — JustTCG schema or pricing change
- **Sources:** new
- **Description:** JustTCG could change response shape
  (e.g. `priceHistory` returning empty arrays after a free-tier policy
  change), change the `priceHistoryDuration` parameter behavior, or
  shift tier limits.
- **Impact:** Pipeline silently degrades; coverage guard catches
  count drops but not shape drops. UI could show empty sparklines on
  every card.
- **Likelihood:** Low–medium; external dependency, can change without
  warning.
- **Owner:** Pipeline (monitoring).
- **Mitigation:** `scripts/diagnose-history.js` exists as a re-runnable
  probe. `verify-data.js` invariant 9 checks history schema
  (`{p,t}` finite-positive). The split-shape contract means UI
  degradation is bounded.
- **Residual risk:** Medium — no active monitor; a JustTCG change would
  be discovered on the next manual probe or by a user observation.
- **Status:** monitored.

### R-015 — Fake investment certainty in copy or labels
- **Sources:** `plan-§11`, `premium-§2`, `srcconf-§10`, every spec's
  stop conditions, `agents-§3`
- **Description:** Any phrase like "guaranteed hit", "safe buy",
  "moonshot", "lock", "must buy", or implicit certainty in delta /
  Box EV / Watchlist P&L copy.
- **Impact:** Directly violates the operating principle. Legal/ethical
  exposure if monetized; reputational damage; user trust collapse.
- **Likelihood:** Medium — every new feature introduces new copy
  surfaces.
- **Owner:** Every author (Claude, Codex, ChatGPT, operator).
- **Mitigation:** Forbidden-language list in `AGENTS.md`, every Phase 2
  spec's stop conditions, `fusionmetrics-qa` SKILL.md, Methodology page
  copy. Each PR must be reviewed for trust-language compliance.
- **Residual risk:** Medium — discipline-based; a single missed review
  can ship.
- **Status:** mitigated by process, not by automation.

### R-016 — Generated data corruption / hand-editing
- **Sources:** `plan-§11`, `agents-§6`
- **Description:** Direct hand-edits to `src/cardData.json`,
  `src/livePrices.json`, `public/priceHistory30d.json`, or
  `public/priceUpdateLog.json`.
- **Impact:** Breaks the data contract that `verify-data.js` enforces;
  could silently corrupt rankings, Box EV, or freshness signals.
- **Likelihood:** Low — explicit rule in AGENTS.md + execution
  checklist forbidden-files list.
- **Owner:** Every agent.
- **Mitigation:** Forbidden-files list in
  `phase-2-execution-checklist.md` § 6; `agents-§6` file boundaries.
  No CI gate against accidental edits (a future improvement).
- **Residual risk:** Low.
- **Status:** mitigated by process.

### R-017 — Image licensing exposure
- **Sources:** `plan-§4`, `sb-§14`
- **Description:** ~40 of 1,258 cards have real Bandai images today;
  the rest fall back to icons. Any scrape-and-host approach hits
  copyright/IP exposure.
- **Impact:** Portfolio-grade visual quality is capped; public-beta
  credibility suffers; a misstep on image sourcing could draw a DMCA
  or worse.
- **Likelihood:** Medium — image rights are a real constraint for any
  TCG project.
- **Owner:** Product strategy.
- **Mitigation:** Strategy confirmed via D-038 (2026-05-12). Option E
  (icons-only) is the default; Option C (third-party rights-cleared
  API) is the upgrade path with three named triggers. Options A
  (mirror Bandai) / B (hot-link) / D (placeholder renders) / F
  (user-uploaded) explicitly rejected. No images hosted, scraped, or
  licensed; no rights exposure under current posture.
- **Residual risk:** Low under current posture (rights exposure = 0;
  credibility cost is the only remaining tradeoff, gated to
  Option-C triggers).
- **Status:** closed under current scope. Re-opens automatically if
  Option-C upgrade triggers fire and a provider is approved.

### R-018 — Single-source dependency on JustTCG
- **Sources:** new
- **Description:** Every live price and 30d history row comes from
  JustTCG. The Methodology page discloses this; the source-confidence
  spec models it; but in practice if JustTCG goes down, the dashboard
  has no fallback.
- **Impact:** Dashboard becomes 100% estimated; provenance footer would
  show stale data; user trust degrades fast.
- **Likelihood:** Low–medium; JustTCG is a reasonable vendor but
  single-source dependency is structural.
- **Owner:** Data strategy.
- **Mitigation:** Multi-layered:
  - **Disclosure**: Methodology page explicitly states single-source
    dependency (commit `02e9733`).
  - **UI degradation states**: `priceStatus`/`historyState`/
    `unavailable` already model graceful failure.
  - **Carry-forward**: per-card freshness UI tolerates short outages.
  - **Spot-check protocol**: `docs/cross-source-spot-check-protocol.md`
    (P3-007) — quarterly 10-card stratified manual check against
    TCGplayer + PriceCharting, with PASS/CAUTION/STRUCTURAL decision
    bands tied to D-037. Detects systematic bias without requiring
    automated cross-source ingestion.
  - **First sold-comp source**: D-041 commits to manual eBay as the
    first cross-source data path; sample-gated infrastructure
    (P2-013/P2-014/P2-016) is ready. Operator fills via
    `docs/sample-gate-promotion-runbook.md`.
  - **Backend escape hatch**: P2-017/P3-009 backend pre-stage plan
    (`docs/backend-prestage-plan.md`) defines the multi-source
    Postgres path when comps exceed ~1,000 rows.
- **Residual risk:** Low operationally; medium structurally until
  D-041 production data exists.
- **Status:** monitored — mitigation chain in place at multiple
  layers; structural exit waits on P3-011 manual eBay fill.

### R-019 — Watchlist v2 localStorage corruption
- **Sources:** new (observed during v2 migration design)
- **Description:** `useWatchlist.js` migrates `fw-watchlist-v1` →
  `fw-watchlist-v2`. Edge cases:
  - User has v1 data, opens app, migration runs, then the v2 write fails
    (private-browsing storage quota, content blockers).
  - User has both v1 and v2 keys present after partial migration.
  - User clears all browser data mid-session.
- **Impact:** User loses their portfolio without warning. Trust hit.
- **Likelihood:** Low (storage failures are rare); meaningful when it
  happens.
- **Owner:** Watchlist code (useWatchlist.js).
- **Mitigation:** `hasStorage()` guard exists; `normalizeItems` handles
  malformed rows; `clear()` removes both v1 and v2. **P3-008 test
  suite (commits `87a2ab6`/`bc9c8a8`/`df452e1`) ships gap-analysis
  cases 11 (v1→v2 migration) and 12 (hasStorage failure path) as
  part of the 20-case Vitest suite.** No backup yet.
- **Residual risk:** Low — automated tests cover the documented
  failure modes; an undocumented failure mode is the remaining
  surface.
- **Status:** mitigated (was: monitored).

### R-020 — Plausible analytics blind spot
- **Sources:** new
- **Description:** Plausible analytics tag was added (`01daa2e`) but
  nobody has reviewed what it has been telling us. The data exists but
  decision-making doesn't reference it.
- **Impact:** Public-beta decisions are made without user-behavior
  signal; we may add features users don't want or skip features they do.
- **Likelihood:** Certain (no review happening today).
- **Owner:** Operator + product strategy.
- **Mitigation:** Quick read of the Plausible dashboard once weekly;
  document findings in `docs/analytics-snapshot-YYYY-MM-DD.md` style.
  No automation needed.
- **Residual risk:** Low after first review; medium until first review
  happens.
- **Status:** open.

### R-021 — Bundle bloat from future artifacts
- **Sources:** new
- **Description:** Current bundle is 647 kB raw / 95 kB gzip (just over
  the 600 kB Vite warning). Future inlined artifacts —
  `premiumMetadata.json`, image manifests, `sourceConfidence.json`,
  expanded `cardData.json` for SB sets — could push it past 1 MB raw
  again unless lazy-loaded the same way `priceHistory30d.json` was.
- **Impact:** Mobile users on slow connections feel it; portfolio-grade
  load time suffers.
- **Likelihood:** Medium — every new data layer is a candidate to be
  accidentally bundled.
- **Owner:** Frontend (data.js + Vite config).
- **Mitigation:** Existing pattern: large data → `public/` + lazy
  `fetch()`. CLA-04 (bundle audit) will document this explicitly.
- **Residual risk:** Low if the lazy pattern is followed.
- **Status:** monitored.

## 6. P2 — Tracked, not urgent

### R-030 — Reprint collision in SB and FB sets
- **Sources:** `sb-§14`, `plan-§4`
- **Description:** A starter-deck reprint of an FB card with the same
  printed name and similar art but a distinct source card number.
- **Impact:** Without an alias plan, the reprint either collapses into
  the FB row (wrong) or appears as a duplicate (also wrong).
- **Owner:** Data model (SB staging spec already addresses).
- **Mitigation:** `sb-set-staging-spec.md` § 8 mandates preserving
  `sourceCardNo` and `isReprint` + `originalCardCode` fields.
- **Status:** mitigated by spec.

### R-031 — Rarity drift when SB sets land
- **Sources:** `sb-§14`
- **Description:** SB products may introduce rarity labels not in the
  current FB vocabulary (`L`, `C`, `UC`, `R`, `SR`, `SCR`).
- **Impact:** `verify-data.js` invariant 4 would fail; validators reject
  the new SB cards.
- **Mitigation:** SB staging spec § 9 mandates preserving source rarity
  text and updating the validator deliberately before activation.
- **Status:** mitigated by spec.

### R-032 — Active-listing vs sold-comp confusion
- **Sources:** `sealed-§13`
- **Description:** Sealed product "active listing" prices are not sold
  prices. If they get into the same aggregate, the medians become
  meaningless.
- **Mitigation:** `sealed-products-spec.md` § 13 separates them
  explicitly. Sold comps must go through the eBay/manual comps process
  with sale date.
- **Status:** mitigated by spec.

### R-033 — Box EV overclaim from sealed-price addition
- **Sources:** `sealed-§16`
- **Description:** Adding sealed-product price as Box EV input could
  imply more precision than the formula actually has (pull rates are
  simplified, variance is high).
- **Mitigation:** `sealed-products-spec.md` § 11 mandates that the EV
  formula stays unchanged when sealed prices are added; copy must
  preserve "approximate" framing.
- **Status:** mitigated by spec.

### R-034 — Starter-deck misuse in booster Box EV
- **Sources:** `sealed-§12`
- **Description:** A SB starter deck is not a booster box. Running
  booster-box EV math on a starter deck produces garbage.
- **Mitigation:** Sealed-products spec § 7 enforces product type;
  Box EV UI must filter to `boosterBox` only.
- **Status:** mitigated by spec.

### R-035 — Cron drift / missed scheduled runs
- **Sources:** new
- **Description:** Rotation runs are date-deterministic (ISO-week % 3).
  If a Monday cron is missed, that group gets skipped 3 weeks instead
  of 1. No automatic catch-up.
- **Impact:** A set goes 6 weeks without refresh instead of 3.
  Provenance footer shows stale group label.
- **Mitigation:** `priceUpdateLog.json.history` makes missed runs
  visible. Operator can manually trigger `gh workflow run` with explicit
  `-f sets=...` to re-run a missed group.
- **Status:** monitored.

### R-036 — Methodology page disclosure gaps
- **Sources:** new (will be confirmed in CLA-10)
- **Description:** `src/tabs/Methodology.jsx` mentions JustTCG and
  model estimates but may not surface R²=0.32, the smoothed UC base,
  the extrapolated SPR base, or the single-source dependency in a way
  users will read.
- **Impact:** Trust principle ("unable to lie by accident") is
  preserved technically but not communicatively.
- **Owner:** Product copy (Methodology tab).
- **Mitigation:** CLA-10 (this audit run) will read the Methodology
  JSX and propose specific copy edits; the actual edits are out of
  scope for this audit.
- **Status:** monitored.

### R-037 — Test coverage gap
- **Sources:** new (detailed in `docs/test-coverage-gap-analysis.md`)
- **Description:** CI had build + 9 invariants only. Zero
  UI/component tests. A regression in `data.js` ranking logic,
  Watchlist v2 migration, or `loadPriceHistory30d` error handling
  would have shipped silently.
- **Owner:** Quality.
- **Mitigation:** **P3-008 ships a 20-case Vitest suite (commits
  `87a2ab6`/`bc9c8a8`/`df452e1`) covering data.js invariants,
  Watchlist v1→v2 migration + hasStorage failure, sample-gate
  refusal on `_isSample: true`, CompsPanel raw/graded separation +
  on-demand aggregates, ValueScanner ranking, CardDetail rendering,
  and ProvenanceFooter.** CI gate added in `ci.yml` (commit
  `df452e1`). Lockfile follow-up landed in `66285c4`.
- **Status:** closed (was: open).

### R-038 — Vercel deploy gap (dev branch unmerged)
- **Sources:** new
- **Description:** `claude/dbfw-market-analytics-1qh5D` was 122
  commits ahead of `main` for months. Production reflected
  pre-Phase-2 state.
- **Impact:** Operator's mental model ("look at the live site")
  differed from reviewer reality.
- **Owner:** Operator (deploy decision).
- **Mitigation:** **PR #1 merged 2026-05-12, bringing main current.
  Going forward, all Phase 3 work lands via PR #2 → main with CI
  gate and Vercel preview deploys per PR.** Branch discipline
  re-established. R-002 SessionStart hook prevents future drift.
- **Status:** closed (was: monitored).

### R-055 — esbuild dev-server vulnerability (CVE chain via Vite 5.4.1)
- **Sources:** new (surfaced by `npm audit` 2026-05-14 during the
  P3-008 lockfile regeneration follow-up)
- **Description:** Two moderate-severity advisories on
  `esbuild ≤ 0.24.2` shipped transitively by `vite@5.4.1`. The
  vulnerability allows any website to send requests to a running
  esbuild dev-server and read responses
  (GHSA-67mh-4wv8-2f99).
- **Impact:** **Dev-server only.** Affects developers running
  `npm run dev` locally if they have a malicious tab open in the
  same browser. Does NOT affect production builds, the Vercel
  deploy, or end users of `fusion-metrics-jet.vercel.app`.
- **Likelihood:** Low operationally; depends on developer browser
  hygiene.
- **Owner:** Build infrastructure (architecture).
- **Mitigation:** Production unaffected — Vite's dev-server path is
  not used for the deployed bundle. Upgrade requires Vite 8.x
  (breaking major bump from 5.4.1) — defer until a separate task
  with an explicit before/after smoke test on every tab + CI run.
  Recommended: dedicated Codex prompt with bounded scope (npm
  install vite@^8, verify build, verify all 20 tests still pass,
  verify production bundle size hasn't regressed, document any
  config migration needed).
- **Residual risk:** Low — operational impact is zero for users;
  developer-side risk is mitigated by browser hygiene plus the
  fact that the dev server only binds to localhost by default.
- **Status:** open (tracked; not blocking).

## 7. P3 — Long-term watch

### R-050 — Backend complexity creep
- **Sources:** `plan-§9`
- **Description:** Adding a database before trigger criteria are met
  creates support burden, security surface, and slowdown.
- **Owner:** Operator (backend approval).
- **Mitigation:** Backend Trigger Checklist in
  `phase-2-execution-checklist.md` § 7 enforces gates.
- **Status:** mitigated by process.

### R-051 — Source licensing pivot
- **Sources:** `plan-§11`
- **Description:** A future requirement to license card images,
  pricing, or comps from a specific commercial source.
- **Owner:** Operator.
- **Mitigation:** Image strategy spec (queued) addresses this; data
  model v2 leaves room for `sourceRefs`.
- **Status:** open.

### R-052 — Monetization premature
- **Sources:** new
- **Description:** Pricing page exists in ChatGPT spec backlog but no
  trigger has fired. Premature monetization adds support obligations,
  legal expectations, and pressure.
- **Owner:** Operator.
- **Mitigation:** No payment integration; no accounts. Plausible data
  must show recurring user engagement before any monetization decision.
- **Status:** closed under current scope.

### R-053 — AI / prediction feature creep
- **Sources:** new
- **Description:** "AI-powered price prediction" is fashionable but
  directly conflicts with the operating principle (would invent
  certainty).
- **Owner:** Operator.
- **Mitigation:** Methodology page disclaims financial advice; no LLM
  features in product roadmap.
- **Status:** closed under current scope.

### R-054 — Dependency drift / no Dependabot
- **Sources:** new
- **Description:** React 18.3.1, Vite 5.4.1, no automated security
  update flow. CVE in a transitive dep could ship to production.
- **Owner:** Architecture.
- **Mitigation:** **`.github/dependabot.yml` shipped 2026-05-14.**
  Weekly Monday scan for both npm dependencies and GitHub Actions.
  Production deps and dev deps batched separately (low PR noise);
  major-version bumps come as individual PRs (explicit review).
  CI gate (build + tests) runs on each Dependabot PR. Catches the
  same advisory class as R-055 going forward.
- **Status:** mitigated (was: monitored).

## 8. Aggregate counts

| Tier | Open | Monitored | Mitigated | Closed | Total |
|------|-----:|----------:|----------:|-------:|------:|
| P0 | 0 | 1 | 2 | 0 | 3 |
| P1 | 2 | 4 | 6 | 1 | 13 |
| P2 | 1 | 2 | 6 | 1 | 10 |
| P3 | 1 | 1 | 1 | 2 | 5 |
| **Total** | **4** | **8** | **15** | **4** | **31** |

Recent state changes (2026-05-12 → 2026-05-14):
- R-001 spec drift → closed (P2-018).
- R-002 agent reality-drift → mitigated (P3-014 SessionStart hook).
- R-017 image licensing → closed (D-038).
- R-018 single-source JustTCG → mitigation chain expanded (P3-007 protocol + sample-gate infra + backend pre-stage).
- R-019 Watchlist localStorage → mitigated (P3-008 cases 11+12).
- R-036 Methodology disclosure gaps → closed (`02e9733`).
- R-037 test coverage → closed (P3-008).
- R-038 Vercel deploy gap → closed (PR #1 merge 2026-05-12 + ongoing PR #2 pattern).
- **R-055 esbuild dev-server advisory → open** (new, tracked, not blocking).

## 9. Top 5 risks to act on this cycle

After the 2026-05-14 closure sweep, the top open risks are:

1. **R-020** — Plausible analytics blind spot. Operator-only;
   15-minute first read still pending. **Highest-leverage
   open risk because every public-beta decision is being made
   without user-behavior signal.** Mitigation checklist:
   `docs/operator-handbook.md` § 5.
2. **R-018** — Single-source dependency on JustTCG. Mitigation
   chain now in place (Methodology disclosure +
   `priceStatus/historyState` UI states + P3-007 quarterly
   spot-check protocol + sample-gated comps infra ready for
   D-041 manual eBay fill + P3-009 backend pre-stage). Structural
   exit waits on P3-011 operator-only data fill.
3. **R-055** — esbuild dev-server advisory via Vite 5.4.1.
   Dev-server only; production unaffected. Fix requires Vite 8
   breaking upgrade. Tracked, not blocking.
4. **R-054** — Dependency drift / no Dependabot. Lockfile pins
   versions today; no automated security update flow. Would have
   caught R-055 earlier.
5. **R-002** — Agent reality-drift. **Mitigated** by P3-014
   SessionStart hook + `scripts/session-brief.sh`; tracked for
   visibility.

Recently closed (visibility): R-001, R-017, R-036, R-037, R-038.

## 10. What this register did NOT include

- Risks specific to backend / accounts / alerts (covered by Backend
  Trigger Checklist; not active scope).
- Risks specific to eBay/TCGplayer/PriceCharting automation (covered by
  External Source Approval Checklist; not active scope).
- Operational risks of the GitHub Actions runner itself (out of project
  scope).
- Marketing/legal risks of public launch (covered by ChatGPT GPT-05
  launch-plan spec; not yet authored).

## 11. Update protocol

When a risk changes state:

1. Edit the row's `Status` field.
2. Add a one-line note to § 12 (Change log).
3. If a new risk is identified, add it under the appropriate tier and
   give it the next available `R-NNN` ID.
4. If a risk is downgraded or upgraded, move the row to the new tier
   and note the date.

## 12. Change log

| Date | Risk ID | Change | Notes |
|------|---------|--------|-------|
| 2026-05-07 | (init) | Initial register | Compiled from 8 Phase 2 specs + AGENTS.md + observed multi-agent session experience. |
| 2026-05-12 | R-017 | open → closed under current scope | D-038 confirms icons-only default; re-opens if Option-C triggers fire. |
| 2026-05-14 | R-002 | monitored → mitigated | P3-014 SessionStart hook + `scripts/session-brief.sh` structurally close the silent-drift path. |
| 2026-05-14 | R-018 | mitigation expanded | P3-007 spot-check protocol + sample-gate infra + P3-009 backend pre-stage now layered with the existing UI degradation states. |
| 2026-05-14 | R-019 | monitored → mitigated | P3-008 cases 11 (v1→v2 migration) + 12 (hasStorage failure) ship in the Vitest suite. |
| 2026-05-14 | R-037 | open → closed | P3-008 20-case Vitest suite + CI `npm test` step shipped. |
| 2026-05-14 | R-038 | monitored → closed | PR #1 merged 2026-05-12; PR #2 pattern + standing dev branch reestablishes branch discipline. |
| 2026-05-14 | R-055 | (new entry) open | esbuild dev-server advisory surfaced by npm audit. Dev-only; not blocking. |
| 2026-05-14 | R-054 | monitored → mitigated | `.github/dependabot.yml` shipped; weekly Monday scan for npm + GitHub Actions. |
