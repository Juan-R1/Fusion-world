# FusionMetrics Architectural Decision Log

**Compiled:** 2026-05-07
**Audit task:** CLA-08 of the Claude Code architectural-audit run
**Baseline commit:** `52b2820 docs: cross-reference skills to Phase 2 tasks`

## 1. Purpose

Capture every meaningful product / architectural decision made on
FusionMetrics so future agents can answer "why was X chosen?" without
re-deriving the answer. Each entry lists the decision, the
alternatives considered, the rationale, the decider, and the trigger
that would justify revisiting.

This is a log, not a charter. Decisions can be revisited when their
expiry trigger fires.

## 2. Reading guide

- **Status**: `active` | `revisited` | `superseded` | `closed`.
- **Expiry trigger**: the observable condition that would prompt
  re-evaluating this decision.
- **Owner**: who would re-decide. "Operator" = the human; "agent" =
  any coding agent acting on direction.

## 3. Decision entries

### D-001 — Stay on JustTCG free tier
- **Date:** 2026-04 (project inception)
- **Decision:** Use JustTCG free tier (~100 req/day, 1,000/month) as
  the sole pricing source.
- **Alternatives:** JustTCG Starter ($19/mo, 10K req/mo, 1K/day);
  TCGplayer API; PriceCharting; multi-source aggregation.
- **Rationale:** Project is portfolio/demo stage; paid tier is
  premature until proven user value or coverage-pressure issues.
- **Owner:** Operator.
- **Expiry trigger:** Any of — full refresh becomes operationally
  necessary daily; quota truncation regularly blocks the coverage
  guard; first paying user or monetization decision.
- **Related commits:** `8c0f262`, `a55378d`, `f57b56c`.
- **Status:** active.

### D-002 — 3-set rotation over full refresh
- **Date:** 2026-04-30
- **Decision:** Default the weekly refresh to a 3-set rotation
  (groups A=FB01–FB03, B=FB04–FB06, C=FB07–FB09) at ~25 requests per
  run. Full refresh remains available as `UPDATE_MODE=full`,
  operator-only.
- **Alternatives:** Daily full refresh (blew quota); 2-set rotation
  (awkward 5-group cycle); per-set rotation (slow freshness);
  abandon rotation and tier-up.
- **Rationale:** 3-set rotation fits under free-tier daily quota with
  headroom for retries, completes a full coverage cycle every 3 weeks,
  and is the simplest schedule that divides 9 evenly.
- **Owner:** Operator + pipeline.
- **Expiry trigger:** Quota tier changes; coverage staleness becomes
  a user complaint; more than 9 sets exist.
- **Related commits:** `a55378d`.
- **Status:** active.

### D-003 — ISO-week % 3 group selection
- **Date:** 2026-04-30
- **Decision:** Auto-pick rotation group from `getISOWeek(date) % 3`
  unless `UPDATE_SETS` env override is set.
- **Alternatives:** State file tracking last group; round-robin via
  `priceUpdateLog.json` history.
- **Rationale:** Stateless; deterministic; no risk of "lost rotation
  cursor" if a commit is rolled back.
- **Owner:** Pipeline.
- **Expiry trigger:** Missed crons cause materially uneven coverage;
  observed > 1 month gap between same-group runs.
- **Related commits:** `a55378d`.
- **Status:** active.

### D-004 — Static JSON over backend (for now)
- **Date:** 2026-04 (project inception)
- **Decision:** Ship all data as static JSON artifacts; no backend,
  database, or auth system.
- **Alternatives:** Supabase + Postgres; Neon + Postgres; Turso;
  Firebase; custom Node API.
- **Rationale:** Static JSON via Vercel edge cache is sufficient for
  current scale; backend adds security/auth/migration/cost burden not
  justified by a portfolio-stage app with single-source data.
- **Owner:** Operator + architecture.
- **Expiry trigger:** Any one of the Backend Trigger Checklist items
  (`docs/phase-2-execution-checklist.md` § 7): comps >1,000 rows;
  account/cloud watchlist approved; alerts approved; daily
  multi-source history approved; static artifacts too slow/large; user
  auth required.
- **Related commits:** project inception; reaffirmed in `phase-2-data-expansion-plan.md` § 9.
- **Status:** active.

### D-005 — Lazy-load `priceHistory30d.json` over bundling
- **Date:** 2026-04-30
- **Decision:** `public/priceHistory30d.json` is fetched on demand by
  `CardDetail` rather than imported and bundled into the JS chunk.
- **Alternatives:** Bundle into JS (was the prior state — bundle hit
  1,351 kB); per-card-file fetching; backend API.
- **Rationale:** Initial bundle dropped from 1,351 kB → 622 kB raw;
  history is only needed when a user opens CardDetail; module-scope
  cache prevents duplicate fetches in a session.
- **Owner:** Architecture.
- **Expiry trigger:** History coverage > 30d or substantial size
  growth; backend approved; first-card-open latency becomes
  measurable problem.
- **Related commits:** `9433602`, `b371e43`.
- **Status:** active.

### D-006 — Synthetic price history permanently removed
- **Date:** 2026-04-29
- **Decision:** Synthetic sparkline generation (mulberry32-seeded RNG)
  removed from the trust contract. Sparklines only render real
  JustTCG history.
- **Alternatives:** Keep synthetic with disclaimers; hybrid (real
  with synthetic fallback); model-driven projections.
- **Rationale:** Operating principle: *make FusionMetrics unable to
  lie by accident.* Synthetic visuals are a built-in lie.
- **Owner:** Product strategy + trust contract.
- **Expiry trigger:** Never. Reintroducing synthetic price movement
  would violate the principle.
- **Related commits:** `3d0aa52`.
- **Status:** active. Permanent.

### D-007 — Synthetic demand sparkline removed
- **Date:** 2026-04-29
- **Decision:** Demand sparkline (synthetic) was removed from
  `CardDetail` and `MarketDynamics`. No observed demand-history source
  exists.
- **Alternatives:** Keep synthetic with disclaimer; defer until a
  real demand-history source lands.
- **Rationale:** Same as D-006. A fake-movement chart misleads even
  with a disclaimer.
- **Owner:** Trust contract.
- **Expiry trigger:** A real observed demand-history source is
  ingested and validated.
- **Related commits:** `3d0aa52`.
- **Status:** active.

### D-008 — Estimated cards: `marketPrice = predictedPrice`, `delta = 0`
- **Date:** 2026-04-30
- **Decision:** For cards with no live price, the model price IS the
  market price (no RNG noise). `delta` is therefore exactly 0.
- **Alternatives:** RNG-perturbed synthetic market price; hide
  estimated cards entirely.
- **Rationale:** A nonzero delta on an estimated card is
  model-vs-itself noise — confusing and dishonest.
- **Owner:** Trust contract.
- **Expiry trigger:** Never under current scope.
- **Related commits:** `3d0aa52`, `fc0be25`.
- **Status:** active.

### D-009 — Estimated cards excluded from undervalued/overvalued rankings
- **Date:** 2026-04-30
- **Decision:** Sort = "Most Undervalued" or "Most Overvalued" filters
  out cards where `priceStatus === 'estimated'`. They remain visible
  in other sorts.
- **Alternatives:** Include estimated cards (would dominate rankings
  since their delta is 0); hide them entirely (loses inventory
  visibility).
- **Rationale:** Estimated cards have no real market signal; ranking
  them implies a buy/sell recommendation that the data can't support.
- **Owner:** Trust contract.
- **Expiry trigger:** Multi-source confidence is added and estimated
  cards have meaningful comp data.
- **Related commits:** `3d0aa52`.
- **Status:** active.

### D-010 — Per-card freshness thresholds: <7d / 7–21d / >21d
- **Date:** 2026-05-01
- **Decision:** Freshness coloring on CardDetail uses
  `<7 days` → green-muted, `7–21 days` → yellow-muted,
  `>21 days` → red-muted, estimated → dim/grey.
- **Alternatives:** Different bucket widths (5/14/30; 3/10/30); show
  exact age only with no color; binary "fresh/stale."
- **Rationale:** 7d and 21d align with the 3-week rotation cycle —
  worst-case set staleness in rotation mode is 21 days, so red
  appears only when a refresh was missed.
- **Owner:** Trust contract + UX.
- **Expiry trigger:** Rotation cadence changes; user research shows
  the thresholds confuse rather than inform.
- **Related commits:** `fc0be25`.
- **Status:** active.

### D-011 — Coverage guard floor: 1,121 (97% of 1,156)
- **Date:** 2026-04-30
- **Decision:** `update-prices.js` refuses to write when merged
  livePrices count drops below 1,121.
- **Alternatives:** Lower floor (more permissive, masks degradation);
  no floor (current state of "more than 0 entries"); per-set only
  (misses catastrophic drops).
- **Rationale:** 97% of the known-good 1,156-card baseline is the
  largest acceptable drop. Per-set 90% floor catches partial truncation;
  this absolute floor catches catastrophic truncation.
- **Owner:** Trust contract.
- **Expiry trigger:** A new baseline establishes a different
  coverage band; never weaken without operator approval.
- **Related commits:** `f57b56c`.
- **Status:** active. **Do not weaken.**

### D-012 — Per-set guard: 90% of previous per-set count
- **Date:** 2026-04-30
- **Decision:** Every set's merged count must be ≥ 90% of its
  previous on-disk count, in addition to the absolute floor.
- **Alternatives:** Only the absolute floor; smaller per-set tolerance
  (more brittle); no per-set check.
- **Rationale:** A single-set truncation can pass the absolute floor
  if other sets compensate. Per-set guard catches that pattern.
- **Owner:** Trust contract.
- **Expiry trigger:** Same as D-011.
- **Related commits:** `f57b56c`, `a55378d`.
- **Status:** active. **Do not weaken.**

### D-013 — Watchlist local-only (no backend)
- **Date:** 2026-04 (project inception); reaffirmed 2026-05-01
- **Decision:** Watchlist state lives in localStorage; no cloud sync.
- **Alternatives:** Cloud sync via backend; IndexedDB; URL-encoded
  state.
- **Rationale:** No accounts, no backend, no auth burden. localStorage
  is sufficient for portfolio-grade demo.
- **Owner:** Architecture.
- **Expiry trigger:** Accounts approved; cross-device sync becomes a
  feature requirement.
- **Related commits:** all Watchlist commits.
- **Status:** active.

### D-014 — Watchlist v2 migration in place (not destructive)
- **Date:** 2026-05-01
- **Decision:** `useWatchlist.js` reads `fw-watchlist-v1`, normalizes
  to v2 shape (`{quantity, entryPrice, addedAt}`), saves at
  `fw-watchlist-v2`. v1 key is preserved (cleared only on `clear()`).
- **Alternatives:** Destructive migration; cold reset.
- **Rationale:** Existing users keep their starred cards as
  `quantity: 1, entryPrice: <current market>`. No data loss.
- **Owner:** Watchlist code.
- **Expiry trigger:** v3 introduces a breaking change.
- **Related commits:** `2bc9f9b`.
- **Status:** active.

### D-015 — Methodology page as a dedicated tab
- **Date:** 2026-05-01
- **Decision:** `Methodology` is its own tab in the main nav, not an
  inline disclaimer.
- **Alternatives:** Footer link; inline tooltip per card; collapsed
  "About" panel.
- **Rationale:** Trust copy needs to be discoverable and complete in
  one place. A dedicated tab is visible during demo screenshots.
- **Owner:** Product / trust.
- **Expiry trigger:** UX research shows users don't visit it.
- **Related commits:** `899c098`.
- **Status:** active.

### D-016 — No eBay scraping
- **Date:** 2026-04 (project inception); reaffirmed in
  `docs/ebay-comps-import-spec.md` § 14
- **Decision:** All eBay-derived data must be manual research with
  source URLs. No scraping under any circumstance without explicit
  operator approval and an External Source Approval Checklist pass.
- **Alternatives:** Build a scraper; use eBay Browse API (paid);
  PriceCharting affiliate data only.
- **Rationale:** ToS risk, rate-limit risk, ethical concerns,
  variant-match ambiguity is worse on scraped titles than manual
  research.
- **Owner:** Operator (final approver) + every agent (must not
  scrape).
- **Expiry trigger:** Operator explicitly approves an API path that
  satisfies the External Source Approval Checklist.
- **Related commits:** `0b70442`, `fcb13cf`.
- **Status:** active. **Do not change without approval.**

### D-017 — Split-shape required (livePrices vs priceHistory30d)
- **Date:** 2026-05-01
- **Decision:** `src/livePrices.json` MUST contain current prices
  only; 30d history lives separately in `public/priceHistory30d.json`.
- **Alternatives:** Inline history (the original state — bundle 1.35
  MB); per-card history files.
- **Rationale:** Lazy-load decision (D-005) requires the split. Also
  enforces the trust contract: bundle is small enough for fast initial
  paint, history is fetched on demand.
- **Owner:** Trust contract.
- **Expiry trigger:** Backend introduces relational history (history
  schema would change anyway).
- **Related commits:** `1aa72f8` (verify tightened), `a55378d`.
- **Status:** active.

### D-018 — Coverage guard refuses to write, doesn't write partial
- **Date:** 2026-04-30
- **Decision:** On any guard failure, the pipeline `process.exit(1)`
  without touching the data files. The bot's add-and-commit step sees
  no diff and skips its commit.
- **Alternatives:** Write partial and label it; warn-only mode.
- **Rationale:** Partial data is worse than stale data. Stale data is
  honestly stale; partial data silently misleads aggregates.
- **Owner:** Trust contract.
- **Expiry trigger:** Never under current scope.
- **Related commits:** `f57b56c`.
- **Status:** active.

### D-019 — Typed errors in `update-prices.js` (AuthError / RateLimitedError / ApiError)
- **Date:** 2026-04-30
- **Decision:** Classify HTTP failures into typed error classes so
  the run-level controller can decide retry vs abort vs continue.
- **Alternatives:** Generic Error + status-code switch in the caller;
  retry-all approach.
- **Rationale:** 401/403 means stop the run (auth bug). 429 means
  wait + retry per policy. 5xx means transient retry. Each behavior
  needs a distinct code path.
- **Owner:** Pipeline.
- **Expiry trigger:** Never — same pattern would apply if we add a
  second data source.
- **Related commits:** `8c0f262`.
- **Status:** active.

### D-020 — `Retry-After` honored, max 3 retries
- **Date:** 2026-04-30
- **Decision:** On 429, honor the `Retry-After` header when present.
  Otherwise back off 90s / 180s / 360s. Max 3 retries before throwing
  `RateLimitedError`.
- **Alternatives:** Exponential backoff with unbounded retries; fixed
  60s; ignore `Retry-After`.
- **Rationale:** Honoring `Retry-After` is the courteous and
  budget-efficient path. 3 retries is enough to recover from transient
  bursts; more wastes budget on a hard cap.
- **Owner:** Pipeline.
- **Expiry trigger:** API documentation changes.
- **Related commits:** `8c0f262`.
- **Status:** active.

### D-021 — Run-level abort on RateLimitedError
- **Date:** 2026-04-30
- **Decision:** A surviving `RateLimitedError` aborts the entire
  rotation; remaining sets are skipped.
- **Alternatives:** Continue to next set; partial-commit the sets
  that succeeded.
- **Rationale:** Once the daily quota is hit, every subsequent set
  fetch would also fail. Aborting saves wall-clock and preserves the
  coverage guard's "all or nothing" contract.
- **Owner:** Pipeline.
- **Expiry trigger:** Quota model changes such that "this set is
  rate-limited but the next one isn't" becomes possible.
- **Related commits:** `8c0f262`.
- **Status:** active.

### D-022 — CI gate: build + verify-data only (no Vitest yet)
- **Date:** 2026-04
- **Decision:** Continuous integration runs `npm ci`, then
  `npm run build`, then `node scripts/verify-data.js`. No Vitest
  / Playwright / linter / type checker.
- **Alternatives:** Vitest + RTL; Playwright e2e; ESLint;
  TypeScript.
- **Rationale:** Lean dependency surface; no test code exists yet
  (covered in `docs/test-coverage-gap-analysis.md`); test framework
  decision is a P3 task gated by operator approval.
- **Owner:** Quality.
- **Expiry trigger:** Test coverage phase approved.
- **Related commits:** `897b1c1`, `ce448ae`.
- **Status:** active. Will be revisited per CLA-03.

### D-023 — No error monitoring (Sentry / etc.)
- **Date:** 2026-04
- **Decision:** No third-party error/crash monitoring shipped.
  Plausible analytics is the only observability.
- **Alternatives:** Sentry free tier; LogRocket; custom
  `window.onerror` → Vercel logs.
- **Rationale:** Privacy-respecting analytics already exists; adding
  Sentry's privacy posture, dep size, and operational burden isn't
  justified at portfolio stage.
- **Owner:** Operator.
- **Expiry trigger:** First reported user-facing JS crash; or paid
  tier / accounts decision.
- **Related commits:** `01daa2e` (Plausible enable).
- **Status:** active.

### D-024 — Plausible over Google Analytics
- **Date:** 2026-04-25
- **Decision:** Plausible (`script.js`, privacy-respecting, no
  cookies, no PII) for analytics.
- **Alternatives:** Google Analytics (GA4); PostHog; Fathom; nothing.
- **Rationale:** Aligns with trust principle; minimal payload; no
  cookie banner needed; sufficient for portfolio-stage signal.
- **Owner:** Architecture.
- **Expiry trigger:** Granular funnel analysis becomes a hard
  requirement.
- **Related commits:** `01daa2e`.
- **Status:** active.

### D-025 — Vercel deploy, push to `main`
- **Date:** 2026-04 (project inception)
- **Decision:** Vercel hosts the static build, deploying on every
  push to `main`.
- **Alternatives:** Netlify; Cloudflare Pages; GitHub Pages; static
  S3+CloudFront.
- **Rationale:** Vercel's Vite preset is one-config; preview
  deployments per PR for free; edge gzip is automatic.
- **Owner:** Architecture.
- **Expiry trigger:** Vercel pricing/policy change; backend introduced.
- **Related commits:** `7c519ae` (deploy.yml).
- **Status:** active.

### D-026 — Vite over Create React App / Next.js
- **Date:** 2026-04 (project inception)
- **Decision:** Vite 5 + React 18 + plain JavaScript.
- **Alternatives:** Create React App (deprecated); Next.js (SSR
  overkill); Remix; Astro.
- **Rationale:** Vite's build speed; no SSR needed for a
  static-data dashboard; minimal config; built-in code-splitting via
  dynamic imports.
- **Owner:** Architecture.
- **Expiry trigger:** SSR/SSG genuinely required (e.g. SEO for
  per-card pages).
- **Related commits:** project inception.
- **Status:** active.

### D-027 — Lean dependency policy
- **Date:** 2026-04 (project inception); enforced by `AGENTS.md` § 9
- **Decision:** `package.json` has 2 deps (`react`, `react-dom`) and
  2 devDeps (`@vitejs/plugin-react`, `vite`). No others added without
  explicit approval.
- **Alternatives:** UI library (MUI / Chakra); state lib (Zustand);
  chart lib (Recharts).
- **Rationale:** Smaller surface, smaller bundle, fewer supply-chain
  risks. Inline styles + `theme.js` and custom mini-components are
  sufficient.
- **Owner:** Architecture.
- **Expiry trigger:** A genuinely-needed dep emerges (e.g. Vitest
  for the test coverage phase).
- **Related commits:** project inception; reaffirmed `fcb0147`.
- **Status:** active.

### D-028 — `fusionmetrics-*` skill family alongside legacy `fusion-*`
- **Date:** 2026-04-30
- **Decision:** New Phase 2 skills use the `fusionmetrics-*`
  prefix; legacy 7 `fusion-*` skills remain active for narrower
  domains.
- **Alternatives:** Replace `fusion-*` entirely; merge into one
  skill family.
- **Rationale:** `fusion-*` skills are battle-tested for narrow tasks
  (git, scraper, TCG model); rewriting them adds risk for no benefit.
  New skills target Phase 2 workflows specifically.
- **Owner:** Skill architecture.
- **Expiry trigger:** `fusion-*` skills become outdated or
  contradictory.
- **Related commits:** `fcb0147`, `68b4015`.
- **Status:** active.

### D-029 — AGENTS.md as agent contract
- **Date:** 2026-04-30
- **Decision:** `AGENTS.md` is the single contract every agent reads
  before acting. Overrides `CLAUDE.md` for runtime behaviour.
- **Alternatives:** Per-agent README files; runtime-injected system
  prompts.
- **Rationale:** Multi-agent project; operator can't re-explain
  context every session. One file = one source of truth.
- **Owner:** Operator + architecture.
- **Expiry trigger:** Single-agent-only project (won't happen).
- **Related commits:** `fcb0147`, `da0d93c` (this audit's CLA-06).
- **Status:** active.

### D-030 — Phase 2 docs-first (no code until specs settle)
- **Date:** 2026-05-01
- **Decision:** P2-001 through P2-010 are documentation/spec tasks.
  No code, no fixtures, no UI. P2-011+ are explicitly user-approval-
  gated.
- **Alternatives:** Build sample fixture alongside spec; spec-then-
  immediate-implement.
- **Rationale:** Variant ambiguity, raw/graded contamination, and
  source confidence have no second chances. Get the spec right first,
  then validate fixtures, then implement.
- **Owner:** Product strategy.
- **Expiry trigger:** Operator approves P2-011 → P2-012, etc.
- **Related commits:** `ee6b6c4` and the entire Phase 2 wave.
- **Status:** active.

### D-031 — Retired `accumulate-prices.js` + `priceHistory.json`
- **Date:** 2026-04-30
- **Decision:** Deleted `scripts/accumulate-prices.js` and
  `src/priceHistory.json`. JustTCG's 30d history makes the manual
  accumulator redundant.
- **Alternatives:** Keep both as long-term archive layer (the prior
  decision); switch to a database archive.
- **Rationale:** Redundant; the accumulator was zero-consumer code;
  retention adds confusion.
- **Owner:** Architecture.
- **Expiry trigger:** Long-term (>30d) history archive becomes a
  requirement; would design from scratch, not resurrect the deleted
  file.
- **Related commits:** `948e92f`.
- **Status:** active.

### D-032 — Set Rotation strict ordering (manual override allowed)
- **Date:** 2026-04-30
- **Decision:** Rotation is auto-picked by ISO-week % 3. Operator can
  override via `UPDATE_SETS` env var (e.g. `FB01,FB02,FB03`). `UPDATE_MODE=full`
  runs all 9.
- **Alternatives:** No override (rigid); state-file-tracked override.
- **Rationale:** Auto for routine cron; override for one-off cases
  (catch-up after missed run; testing the pipeline; emergency
  refresh).
- **Owner:** Pipeline.
- **Expiry trigger:** Backend introduces alert-driven refresh.
- **Related commits:** `a55378d`.
- **Status:** active.

### D-033 — Canonical premium-flag name `winnerPromo` (not `winner`)
- **Date:** 2026-05-07
- **Decision:** Across all Phase 2 specs and future validators, the
  premium flag for a winner-stamped / winner-distribution promo card is
  `winnerPromo`. The bare `winner` name is retired.
- **Alternatives:** Keep `winner` (shorter); use `winnerStamped`.
- **Rationale:** `winnerPromo` reads as a clear classification, pairs
  with `eventPromo` semantically, and matches the canonical schema in
  `docs/premium-metadata-schema.md` § 5. The bare `winner` would
  collide with English-prose uses.
- **Owner:** Premium metadata schema; trust contract.
- **Expiry trigger:** Never under current scope.
- **Related commits:** `0522bb8`.
- **Status:** active.

### D-034 — Canonical risk-tag name `rawGradedContamination` (not `gradedContamination`)
- **Date:** 2026-05-07
- **Decision:** The risk tag that flags rows where raw and graded sales
  may be mixed is `rawGradedContamination`. The shorter
  `gradedContamination` name is retired.
- **Alternatives:** Keep `gradedContamination` (shorter); use
  `rawVsGradedMix`.
- **Rationale:** `rawGradedContamination` is symmetric — it doesn't
  imply graded is the contaminant — and matches the canonical schema
  in `docs/premium-metadata-schema.md` § 7 and
  `docs/source-confidence-spec.md` § 8.
- **Owner:** Risk-tag vocabulary.
- **Expiry trigger:** Never under current scope.
- **Related commits:** `0522bb8`.
- **Status:** active.

### D-035 — Canonical field name `gradeCompany` (not `company`) for grading-company identifier
- **Date:** 2026-05-07
- **Decision:** Across all comps entities (`ebay_sold_comps`,
  `graded_comps`), the field identifying the grading company
  (PSA/BGS/CGC/TAG/other) is named `gradeCompany`.
- **Alternatives:** Keep `company` (shorter, was used in
  `graded-comps-spec.md`); use `grader`.
- **Rationale:** `gradeCompany` is explicit and consistent with the
  related `grade`, `gradeNumeric`, `gradeLabel` fields. The previous
  `graded_comps.company` would have collided with English uses of
  "company" and made cross-row joins to `ebay_sold_comps.gradeCompany`
  awkward.
- **Owner:** Comps schema.
- **Expiry trigger:** Never under current scope.
- **Related commits:** `110d895`.
- **Status:** active.

## 4. Decision count and tier summary

| Status | Count |
|--------|------:|
| active | 35 |
| revisited | 0 |
| superseded | 0 |
| closed | 0 |
| **Total** | **35** |

Six decisions explicitly marked **permanent** or **do not weaken**:
D-006, D-007, D-008, D-011, D-012, D-016.

## 5. Decisions NOT yet logged (open questions)

Open architectural questions that have NOT been decided yet — see
also `docs/open-questions.md` (CLA-09):

- Promo / event-card `cardCode` namespace (decision deferred to
  Codex's CDX-04 / ChatGPT's GPT-02 outputs).
- Cross-source agreement threshold (deferred to CDX-05 / GPT-03).
- Image-coverage strategy (deferred to CDX-03 / GPT-01).
- Set Rankings / Chase Radar UX (deferred to CDX-06 / GPT-04).
- Test coverage phase trigger (P3 in `test-coverage-gap-analysis.md`).
- Backend trigger event (gated by `phase-2-execution-checklist.md` § 7).

## 6. Update protocol

When a decision is made or revisited:

1. Add a new D-NNN entry (or update an existing one's status).
2. Add a one-line note to § 7 (Change log).
3. If the decision changes a guard, invariant, or trust label, also
   update `AGENTS.md` § 3 / § 6 and the relevant SKILL.md.

## 7. Change log

| Date | ID | Change | Notes |
|------|----|--------|-------|
| 2026-05-07 | init | Initial 32-decision log | Compiled from project history, AGENTS.md, Phase 2 specs, and observed pipeline behavior. |
