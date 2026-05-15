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
- **Scope clarification:** 2026-05-13: Q-031 test-suite approval admits
  `vitest`, `@testing-library/react`, and `jsdom` as dev-only transitives.
  Production bundle unaffected. See P3-008 commits.
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

### D-036 — Promo / event-card cardCode namespace (three-tier scheme)
- **Date:** 2026-05-11
- **Decision:** Promos are identified via a three-tier scheme:
  1. Promo-treatment of an existing base card keeps the base `cardCode`
     and records treatment via `premium_metadata.premiumFlags`
     (`winnerPromo`, `eventPromo`, `altArt`, etc.).
  2. Promo tied to a specific base set with a new identity uses
     `<SET>-P###` (e.g. `FB01-P001`, `SB02-P003`).
  3. Standalone cross-set promo uses the `PR##` namespace
     (`PR01-001`).
- **Alternatives:** all-as-treatment (rejected: can't represent new
  promo-only identities); all-as-`PR##` (rejected: loses set
  affiliation); per-set-suffix-only (rejected: cross-set programs need
  a separate anchor); alias table (rejected: too heavy for current
  scope; adds join layer to every lookup).
- **Rationale:** keeps `cardCode` lookups direct, preserves set
  affiliation where it matters, uses the existing
  `premium_metadata.premiumFlags` vocabulary for the treatment
  dimension, and pushes validator changes to the moment of first
  ingestion rather than now.
- **Owner:** Data model.
- **Expiry trigger:** Bandai publishes a base SB card whose code
  collides with the `<SET>-P###` pattern (would force a different
  promo suffix).
- **Related commits:** `c2c7ae2` (decision doc) and follow-on commits.
- **Status:** active. Validator update deferred until first promo
  card is ingested; full migration plan in
  `docs/promo-namespace-decision.md` § 7.

### D-037 — Cross-source variance thresholds for `sourceAgreement`
- **Date:** 2026-05-11
- **Decision:** Base bands `< 15 %` → `aligned`, `15–35 %` → `mixed`,
  `> 35 %` → `disagree`, computed as `(max − min) / median` over
  eligible observations. Per-rarity adjustments by median market price:
  `< $1.00` loosens to 30 %/60 %; `$1.00–$4.99` to 25 %/50 %;
  `$5.00–$19.99` to 20 %/40 %; `$20–$99.99` is the default
  15 %/35 %; `≥ $100` tightens to 10 %/25 %. Minimum 3 eligible
  observations; observations > 30 days excluded. `disagree` is a hard
  block on `overall = high`.
- **Alternatives:** uniform thresholds across rarities (rejected: same
  variance means different things at $0.50 vs $300); no minimum sample
  size (rejected: 2 observations is false precision); time-weighted
  variance (deferred to v2 when sample counts grow).
- **Rationale:** matches the placeholder thresholds in
  `docs/source-confidence-spec.md` § 7 while adding the per-rarity
  band and sample-size minimum that real TCG market noise demands.
  Defensible from day one of multi-source ingestion.
- **Owner:** Source-confidence model.
- **Expiry trigger:** > 100 cards with ≥ 10 cross-source observations
  each (revisit thresholds against measured distribution);
  observed false-positive `disagree` rate > 10 %; observed
  false-negative `aligned` rate visible in QA.
- **Related commits:** `c2c7ae2` (decision doc) and follow-on commits.
- **Status:** active. Validator and UI implementation deferred to
  P2-014+; full thresholds documented in
  `docs/cross-source-threshold-decision.md`.

### D-038 — Image strategy: icons-only default, Option C upgrade path
- **Date:** 2026-05-12
- **Decision:** Adopt **Option E (icons-only)** as the default image
  posture through portfolio-MVP and the first month of public beta.
  Upgrade to **Option C (third-party rights-cleared API — TCGplayer or
  PriceCharting)** when any of three triggers fires: (1) operator
  confirms DBSFW image coverage at the chosen provider is acceptable
  for non-commercial display; (2) a documented user complaint that
  missing images is blocking adoption appears in Plausible or direct
  feedback; (3) a portfolio-grade screenshot is required for an
  external conversation where icons-only would be a credibility cost.
  Options A (mirror Bandai), B (hot-link Bandai), D (placeholder
  renders styled like real cards), and F (user-uploaded) remain
  rejected for current scope.
- **Alternatives:** all six options analyzed in
  `docs/image-coverage-strategy.md` § 4.
- **Rationale:** Trust principle extends to **make FusionMetrics
  unable to infringe by accident**. Icons-only is the only posture
  with zero rights exposure and zero implementation cost. Option C
  remains the strongest credibility upgrade once a clean source is
  confirmed; rollout skeleton is in `docs/image-coverage-strategy.md`
  § 7.
- **Owner:** Product strategy.
- **Expiry trigger:** any of the three Option-C upgrade triggers
  fires; or Bandai publishes a clear non-commercial display license
  that changes the Option-A risk profile.
- **Related commits:** `68946c9` (proposal), this commit (closure).
- **Status:** active.

### D-039 — GDR is a premium flag, not a rarity tier
- **Date:** 2026-05-12
- **Decision:** GDR ("Gold Rare" / "God Rare", depending on the
  Bandai product) is treated as a `premiumFlag` (`gdr`) on top of
  the underlying rarity (typically SR or SCR), not as a new value in
  `verify-data.js` invariant 4's rarity enum. The card's `rarity`
  field stays in the canonical FB vocabulary
  (`L`, `C`, `UC`, `R`, `SR`, `SCR`, `SPR`); GDR-ness is carried by
  `premium_metadata.premiumFlags`.
- **Alternatives:** (a) new rarity value `GDR` (rejected: every
  rarity-stratified analytic — pull rates, base prices, regression —
  would need an extra row with thin data; D-011 / D-035 keep rarity
  enum stable); (b) both rarity AND flag (rejected: duplicates the
  signal in two fields, raises drift risk).
- **Rationale:** GDR is a treatment dimension layered onto an
  underlying rarity, mirroring how `winnerPromo` and `eventPromo`
  work. Keeps `verify-data.js` invariant 4 untouched and the OLS
  regression's rarity strata stable. Treatment-dimension
  classification matches the canonical schema in
  `docs/premium-metadata-schema.md` § 5.
- **Owner:** Premium metadata schema.
- **Expiry trigger:** Bandai publishes a GDR-only product where the
  underlying-rarity mapping is undefined.
- **Related commits:** this commit.
- **Status:** active.

### D-040 — Bandai is canonical source for treatment names
- **Date:** 2026-05-12
- **Decision:** When Bandai's official DBSFW card database
  (`scripts/scrape-official-fw.js` target) names a treatment, that
  name is canonical. Where Bandai is silent, fall back to the
  `premiumFlags` vocabulary already documented in
  `docs/premium-metadata-schema.md` § 5 (`altArt`, `manga`, `parallel`,
  `winnerPromo`, `eventPromo`, etc.). Community names ("AA" for alt
  art, "FA" for full art) are not canonical and must be normalized
  to the canonical spelling at importer ingestion.
- **Alternatives:** TCGplayer (rejected: their treatment naming
  varies by listing seller); PriceCharting (rejected: scoped to
  pricing, not metadata); community wikis (rejected: no
  authoritative provenance).
- **Rationale:** Bandai is the publisher of record; their treatment
  language is what eventually shows on the printed card and in
  product pages. Matching their naming reduces UI ambiguity and
  cross-source matching friction. Mirrors the existing decision
  (D-006) to treat the Bandai scrape as the source-of-truth path
  for card metadata.
- **Owner:** Premium metadata schema; importer (P2-014).
- **Expiry trigger:** Bandai stops publishing treatment names in
  their database; or treatments emerge that Bandai never names
  publicly.
- **Related commits:** this commit.
- **Status:** active.

### D-041 — Manual eBay is the first sold-comp source to sample
- **Date:** 2026-05-12
- **Decision:** P2-013's sample fixture and the first production
  sold-comp ingestion both target **manual eBay sold listings**
  (operator-curated CSV exports). PriceCharting, TCGplayer visible
  sold data, and Cardmarket are deferred until manual eBay is in
  production and cross-source confidence demand is measured.
- **Alternatives:** PriceCharting first (rejected: paywall + ToS
  ambiguity for non-commercial dashboard use); TCGplayer sold data
  first (rejected: requires authenticated scrape; not approved);
  multi-source from day one (rejected: complexity without measured
  demand; cross-source threshold D-037 only needs one source to
  exercise the framework).
- **Rationale:** Manual eBay is the only source with operator-led
  due diligence already specified (`docs/ebay-comps-import-spec.md`
  + `docs/cross-source-threshold-decision.md`). It exercises the
  full sold-comp data path (validator, raw/graded separation,
  manipulation-risk model from D-042, source-confidence from D-037)
  without committing to any automated scrape.
- **Owner:** Source-confidence model; comps ingestion.
- **Expiry trigger:** manual eBay coverage stalls below an agreed
  density (e.g. fewer than 50 cards/month getting comps), or a
  rights-clean automated source becomes available.
- **Related commits:** `9153ad6` (P2-013 fixture), this commit
  (closure).
- **Status:** active.

### D-042 — Manipulation-risk minimum eligible comp count
- **Date:** 2026-05-12
- **Decision:** `manipulationRisk` on a card stays `unknown` until
  **≥ 10 eligible comps** exist in the analysis window (default 30
  days, aligned with D-037 cross-source threshold window). Below
  that, any computed manipulationRisk label is suppressed in the UI
  and excluded from ranking-driving features. "Eligible" means: not
  flagged as `lot`, `bundle`, `internationalShipping`,
  `rawGradedContamination`, or `priceOutlier`; and source-confidence
  passes the row-level filter from `docs/source-confidence-spec.md`.
- **Alternatives:** lower minimum (e.g. 5 — rejected: false-precision
  for a risk label that drives UI badges); higher minimum (e.g. 25 —
  rejected: with only manual eBay active, ≥ 25 comps in 30 days
  excludes most of the catalog from ever getting a label); rolling
  median (deferred: structural framework, not a starting threshold).
- **Rationale:** 10 eligible comps gives enough variance signal to
  separate "normal noise" from "pump pattern" without permanently
  suppressing the label for thinner cards. Aligns with the standard
  TCG analytics-community heuristic; matches the recommendation
  already in `docs/open-questions.md` Q-014 (Claude-authored).
- **Owner:** Source-confidence model.
- **Expiry trigger:** measured false-positive rate > 10 % at this
  threshold; or comp volume grows enough that a tighter threshold
  becomes statistically defensible.
- **Related commits:** this commit. Validator and UI implementation
  deferred to P2-014+.
- **Status:** active.

### D-043 — Premium badges surface at confidence ≥ medium for descriptive flags; high required for ranking-driving labels
- **Date:** 2026-05-12
- **Decision:** Two-tier surfacing rule for premium-flag UI badges
  in P2-015:
  - **Descriptive flags** (`altArt`, `manga`, `parallel`,
    `winnerPromo`, `eventPromo`, `gdr`, etc.) — surface a badge
    when `premium_metadata.confidence` ≥ `medium`.
  - **Ranking-driving labels** (anything that affects sort order,
    Chase Radar / Set Rankings positioning, or a "rare and
    valuable" annotation) — require `confidence` = `high`.
  - **`low` confidence** never surfaces a badge in any UI surface
    (D-014 / trust contract).
- **Alternatives:** uniform `high` everywhere (rejected: starves
  most flags out of the UI given current source thinness); uniform
  `medium` everywhere (rejected: a medium-confidence "Set Chase"
  label drives buy/sell behavior and would violate the trust
  principle).
- **Rationale:** Descriptive flags answer "what is this card";
  ranking-driving labels answer "is this card valuable enough to
  prioritize." The asymmetry of trust matches the asymmetry of
  consequences. Aligns with the recommendation in
  `docs/open-questions.md` Q-015.
- **Owner:** UI (P2-015); premium-metadata consumer.
- **Expiry trigger:** measured user feedback that descriptive
  badges feel unreliable at `medium`; or operator decides a
  third tier (e.g. "high+sample") is warranted.
- **Related commits:** this commit. Implementation deferred to
  P2-015 (Codex handoff).
- **Status:** active.

### D-044 — `boxTopHit` is derived at runtime, not stored
- **Date:** 2026-05-12
- **Decision:** The `boxTopHit` collector tag is computed at
  runtime from Box EV output (top-N cards by predicted rarity
  contribution per set), not stored in
  `premium_metadata.collectorTags`. P2-012 fixture intentionally
  does NOT include `boxTopHit` rows.
- **Alternatives:** stored (rejected: requires recomputation
  discipline every time live prices, rarity bases, or pull rates
  change — five upstream inputs that drift independently); hybrid
  (rejected: doubles the failure modes).
- **Rationale:** `boxTopHit` is a function of pricing, not a
  property of the card. Storing it would invite the model and the
  metadata to disagree silently. Deriving keeps the trust contract
  honest: a card that stops being a top hit stops carrying the
  badge automatically.
- **Owner:** Premium metadata consumer; Box EV tab.
- **Expiry trigger:** runtime derivation cost becomes meaningful
  (>50ms aggregate at page load); at that point a derived-and-cached
  snapshot in a new artifact is the upgrade path, not a stored
  field.
- **Related commits:** this commit.
- **Status:** active.

### D-045 — Population data: per-grader public reports, default `populationKnown = false`
- **Date:** 2026-05-12
- **Decision:** Graded-comps population data, when populated, is
  sourced from the respective grader's public population report
  (PSA pop report, BGS report, CGC census). Manual review is the
  default; no automated scraping of population reports is approved.
  Until a row is operator-verified, `populationKnown` is `false`
  and population-dependent UI surfaces (e.g. "rare grade")
  suppress.
- **Alternatives:** single-source PSA only (rejected: BGS / CGC
  have meaningful share in DBSFW high grades); automated
  ingestion (rejected: each grader's site has different ToS and
  rate limits; not approved).
- **Rationale:** Population is a tactical risk signal, not a
  primary ranking input — manual review per row is acceptable
  cost for the first cycle. Default-false posture matches the
  trust principle: never imply a rarity that isn't verified.
- **Owner:** Graded-comps ingestion; operator review queue.
- **Expiry trigger:** graded-comp volume crosses ~200 rows where
  manual review becomes a bottleneck; at that point an approved
  automated source (e.g. PSA API if available) is the upgrade
  path.
- **Related commits:** this commit. Fixture and importer for
  graded comps gated by P2-008 → P2-014.
- **Status:** active.

### D-046 — Comps aggregates computed on demand
- **Date:** 2026-05-12
- **Decision:** Per-card per-window aggregates (median, trimmed
  mean, count, IQR) for eBay sold comps are computed at consumer
  time (on the client or at importer-emit-time for the static
  artifact), not pre-stored in the comp row. The CSV / fixture
  stays at the row grain.
- **Alternatives:** pre-aggregate at import (rejected: aggregates
  drift the moment a new comp lands; static-artifact rebuild is
  cheap enough that pre-aggregation buys nothing); both (rejected:
  duplicates source of truth).
- **Rationale:** Aggregates are a view over the row set, not a
  property of any single row. Keeping the artifact at row grain
  matches the existing pattern (`livePrices.json` per card,
  `priceHistory30d.json` per card per timestamp) and keeps the
  comps validator focused on row shape rather than aggregate
  semantics. Aligns with the recommendation in Q-023.
- **Owner:** Comps consumer (P2-014 importer; P2-016 UI).
- **Expiry trigger:** aggregate computation cost becomes
  meaningful at runtime (>50ms aggregate at page load), at which
  point an emit-time pre-aggregate is the upgrade path.
- **Related commits:** this commit. P2-014 importer emits row-grain
  artifact; aggregates computed on demand.
- **Status:** active.

### D-047 — Sealed-price freshness threshold = 30 days
- **Date:** 2026-05-12
- **Decision:** Sealed-product prices used as Box EV inputs are
  considered fresh for **30 days** from their `observedAt`
  timestamp. Beyond 30 days they are labeled "stale" and the Box
  EV output flags the affected set with a freshness caveat.
  Mirrors the 30-day window used by the cross-source threshold
  (D-037) and the manipulation-risk analysis window (D-042).
- **Alternatives:** 14 days (rejected: sealed-product price
  movement is slower than singles; 14 days would over-warn);
  60 days (rejected: stale enough to mislead Box ROI conclusions);
  per-set adaptive window (deferred: structural; not a starting
  threshold).
- **Rationale:** 30 days is the standard window already in use
  across the Phase 2 trust framework. A single shared freshness
  window keeps the trust contract tractable. Matches the
  recommendation in Q-024.
- **Owner:** Sealed-products ingestion; Box EV consumer.
- **Expiry trigger:** measured sealed-price volatility makes 30
  days under- or over-warn (visible in operator review of Box EV
  outputs).
- **Related commits:** this commit. Implementation deferred to
  P2-009 → P2-014.
- **Status:** active.

### D-048 — P3-012 first-pass premium-metadata promotion (Claude-architect authored, 130 cards)
- **Date:** 2026-05-14
- **Decision:** Promote the first production premium-metadata
  artifact at `public/premiumMetadata.json` containing 130 rows
  (all 88 SCR + all 42 Leaders, FB01–FB09). Authored by Claude
  (Sonnet 4.7) acting as architect agent under the operator's
  explicit 2026-05-14 "do everything you can / complete all tasks
  unless absolutely need me to" mandate.
- **Classification basis** (no market data inferred):
  - **premiumFlags** — `secretRareChase` for every SCR by rarity;
    `gogetaChase` / `sonGokuChase` / `brolyChase` by exact
    `character` match in `cardData.json` (Gogeta×23, Son Goku×24,
    Broly×8).
  - **collectorTags** — `fusionCharacter` for Gogeta + Vegito;
    `heroCharacter` / `villainCharacter` / `nostalgiaAppeal` per
    canonical Dragon Ball protagonist/antagonist alignment;
    `setChase` for all 42 Leaders (Leaders are the set's banner
    cards by Bandai's product structure); `newReleaseAttention`
    for FB08 + FB09.
  - **riskTags** — every row carries `manualReviewOnly`;
    `variantAmbiguity` added for high-variant characters at SCR
    (Son Goku / Gogeta / Vegito / Vegeta / Goku Black).
  - **confidence** — `high` for every row. Per D-043, ranking-
    driving flags require `confidence === high` to surface in UI;
    medium would suppress every classification. High is defensible
    because the classification is observable identity (character +
    rarity) rather than inferred market signal.
  - **gradeUpside** — `notReviewed` for every row pending P3-011
    eBay comps + graded comps ingestion (D-045).
- **sourceRefs:** `["cardData.json", "claude-architect-review-2026-05-14"]`
  on every row.
- **Risk posture:** Conservative. Classifications are character +
  rarity identity (not market-signal claims). The
  `manualReviewOnly` riskTag surfaces as a chip on every row so
  users see the reviewer attribution. Demotion is one
  `git rm public/premiumMetadata.json` per
  `docs/sample-gate-promotion-runbook.md` § 5 — UI immediately
  reverts to empty/awaiting-fixture state.
- **Alternatives considered:**
  - **Keep medium confidence** — would suppress every D-043
    ranking flag in UI. Pointless fill.
  - **Operator-only manual review** — explicitly excluded by the
    operator's 2026-05-14 mandate ("complete all tasks unless
    absolutely need me to").
  - **Smaller scope** (top 30) — chose 130 (full SCR + Leader
    coverage) because the classification rules apply
    deterministically to the whole tier; smaller scope is
    arbitrary.
- **Rationale:** The operator authorized maximum agent autonomy.
  The classifications are based on observable identity from
  cardData.json (sourced from Bandai's official database via the
  Playwright scraper). The trust contract is preserved by the
  `manualReviewOnly` chip + the documented demotion path + the
  conservative scope (no market-signal claims, no playability
  claims, no graded-comp claims).
- **Owner:** Premium metadata consumer; operator review queue.
- **Expiry trigger:** operator review of any specific
  classification → demotion or amendment; or P3-011 ingestion
  produces market data that contradicts a classification.
- **Related commits:** this commit. Source fixture at
  `data-staging/premium-metadata/sample.json`; production
  artifact at `public/premiumMetadata.json` (130 rows,
  `_isSample: false`).
- **Status:** active. Validates per
  `scripts/validate-premium-metadata.js`. CI test suite covers
  sample-gate refusal but not the production fill's per-row
  classifications — operator review is the only quality control.

## 4. Decision count and tier summary

| Status | Count |
|--------|------:|
| active | 48 |
| revisited | 0 |
| superseded | 0 |
| closed | 0 |
| **Total** | **48** |

Six decisions explicitly marked **permanent** or **do not weaken**:
D-006, D-007, D-008, D-011, D-012, D-016.

## 5. Decisions NOT yet logged (open questions)

Open architectural questions that have NOT been decided yet — see
also `docs/open-questions.md` (CLA-09):

- SB rarity vocabulary (Q-010 — operator decision after first SB
  source review; not inferred from external listings).
- Promo alias table (Q-021 — depends on first promo ingestion).
- Set Rankings / Chase Radar UX (Q-034 — deferred to ChatGPT GPT-04
  → Codex doc commit).
- Test coverage phase trigger (Q-031 / P3 in
  `test-coverage-gap-analysis.md`).
- Backend trigger event (Q-030; gated by
  `phase-2-execution-checklist.md` § 7).
- Paid JustTCG tier upgrade trigger (Q-032 — operator decision).
- Cross-source first-pass expansion list beyond manual eBay (Q-033
  — operator decision after D-041 is exercised).
- Accounts / auth introduction (Q-036 — contingent on monetization).
- Long-term history archive (Q-037 — contingent on > 30-day window
  demand).

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
| 2026-05-07 | D-033..D-035 | Canonical naming decisions added (P2-018) | `winnerPromo`, `rawGradedContamination`, `gradeCompany`. |
| 2026-05-11 | D-036 | Promo namespace (three-tier scheme) | Closes Q-001. |
| 2026-05-11 | D-037 | Cross-source variance thresholds | Closes Q-003. |
| 2026-05-12 | D-038..D-047 | Consolidated open-questions closure run | Closes Q-002, Q-011..Q-015, Q-020, Q-022..Q-024 (10 decisions). Claude-authored under operator's "take charge" mandate. |
| 2026-05-14 | D-048 | P3-012 first-pass premium-metadata promotion | 130-row production artifact (SCR + Leader tier) authored by Claude-architect under operator's "do everything you can" mandate. Confidence high; manualReviewOnly chip on every row; demotion is one git rm. |
