# FusionMetrics Open Questions Consolidation

**Compiled:** 2026-05-07
**Audit task:** CLA-09 of the Claude Code architectural-audit run
**Baseline commit:** `698b4cf docs: add architectural decision log`

## 1. Purpose

A single prioritized list of every unresolved architectural / product
question across the Phase 2 spec set, the audits in this run, and the
decision log. Each entry cites where the question came from, what it
blocks, and the recommended approach to resolving it.

This is a triage doc, not a decision doc. Resolutions land in
`docs/decision-log.md` once made.

## 2. Reading guide

- **Priority:** `P0` (blocks current Phase 2 work) /
  `P1` (blocks a specific upcoming P2-XXX) /
  `P2` (resolves during implementation) /
  `P3` (long-term).
- **Resolver:** who should decide. Operator (the human),
  ChatGPT (strategy synthesis), Claude / Codex (mechanical) or a
  mix.
- **Status:** `open` / `partially answered` / `in flight`.

## 3. P0 — Blocking current Phase 2

These three should be answered before P2-011 → P2-014 implementation
starts. They are not independent: variant matching is the through-line.

### Q-001 — Promo / event-card cardCode namespace
- **Status:** **CLOSED 2026-05-11.** See `docs/promo-namespace-decision.md`
  and `docs/decision-log.md` D-036.
- **Resolution:** Three-tier scheme. (1) Promo-treatment of an existing
  base card keeps the base `cardCode` and records treatment via
  `premium_metadata.premiumFlags`. (2) Promo tied to a specific base set
  with a new identity uses `<SET>-P###` (e.g. `FB01-P001`).
  (3) Standalone cross-set promo uses the `PR##` namespace
  (`PR01-001`). Validator changes deferred until the first promo card
  is ingested.

### Q-002 — Image coverage strategy
- **Status:** **CLOSED 2026-05-12** under the operator's "approving
  everything you are capable of implementing" mandate. See
  `docs/image-coverage-strategy.md` and `docs/decision-log.md` D-038.
- **Resolution:** Option E (icons-only) is the default through
  portfolio-MVP and the first month of public beta. Upgrade to
  Option C (third-party rights-cleared API — TCGplayer or
  PriceCharting) when any of three triggers fires: operator confirms
  DBSFW coverage at the chosen provider, a documented adoption-blocker
  user complaint appears, or a portfolio-grade external screenshot
  is required. Options A / B / D / F remain rejected. R-017 image
  licensing exposure closes alongside this decision.

### Q-003 — Cross-source variance threshold for `sourcesAgree = false`
- **Status:** **CLOSED 2026-05-11.** See
  `docs/cross-source-threshold-decision.md` and
  `docs/decision-log.md` D-037.
- **Resolution:** Base bands `< 15 % aligned`, `15–35 % mixed`,
  `> 35 % disagree`, with per-rarity adjustments (lower-priced cards
  loosen to 30 %/60 %; higher-priced cards tighten to 10 %/25 %).
  Minimum sample size 3 eligible observations; observations > 30 days
  excluded; `disagree` joins the existing hard-block flags for
  `overall = high`. Validator and UI implementation deferred to
  P2-014+.

## 4. P1 — Blocking a specific upcoming P2 task

### Q-010 — SB rarity vocabulary
- **Sources:** `sb-set-staging-spec.md` § 9
- **Question:** SB products may introduce rarity values not in the
  current FB vocabulary (`L`, `C`, `UC`, `R`, `SR`, `SCR`). Which new
  values to add, and how should `verify-data.js` invariant 4 be
  extended?
- **What it blocks:** P2-005 / P2-012 (SB fixture work).
- **Recommended resolver:** Operator after first SB source review.
  Should NOT be inferred from external listings.
- **Status:** open.

### Q-011 — GDR as rarity, premium flag, or both?
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-039.
- **Resolution:** GDR is a `premiumFlag` (`gdr`) layered onto an
  underlying canonical rarity (typically SR or SCR). The
  `verify-data.js` invariant 4 rarity enum stays at
  `L / C / UC / R / SR / SCR / SPR`; GDR-ness is carried in
  `premium_metadata.premiumFlags`.

### Q-012 — Treatment naming canonical source
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-040.
- **Resolution:** Bandai's official DBSFW card database is canonical
  for treatment names. Where Bandai is silent, fall back to the
  `premiumFlags` vocabulary in `docs/premium-metadata-schema.md` § 5.
  Community names ("AA", "FA") are normalized to canonical spelling
  at importer ingestion.

### Q-013 — First sold-comp source to sample
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-041.
- **Resolution:** Manual eBay (operator-curated CSV exports) is the
  first sold-comp source for both P2-013 sample fixture and the
  first production ingestion. PriceCharting / TCGplayer visible
  sold data / Cardmarket are deferred until manual eBay is in
  production and cross-source confidence demand is measured.

### Q-014 — Manipulation risk minimum comp count
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-042.
- **Resolution:** `manipulationRisk` stays `unknown` until ≥ 10
  eligible comps exist in the 30-day analysis window. "Eligible"
  excludes `lot` / `bundle` / `internationalShipping` /
  `rawGradedContamination` / `priceOutlier` rows and rows failing
  the row-level source-confidence filter. Below the threshold, the
  label is suppressed in UI and excluded from ranking features.

### Q-015 — Confidence level required to surface a premium badge in UI
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-043.
- **Resolution:** Two-tier rule. Descriptive flags (`altArt`,
  `manga`, `parallel`, `winnerPromo`, `eventPromo`, `gdr`, etc.)
  surface a badge at `confidence` ≥ `medium`. Ranking-driving
  labels (anything affecting sort order, Chase Radar / Set Rankings
  positioning, or rare-and-valuable annotation) require
  `confidence` = `high`. `low` never surfaces.

## 5. P2 — Resolves during implementation

### Q-020 — `boxTopHit` stored vs derived
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-044.
- **Resolution:** Derived at runtime from Box EV output. P2-012
  fixture intentionally omits `boxTopHit` rows; consumers compute
  it on demand from the current pricing + rarity model.

### Q-021 — Promo alias table (vs separate cardCodes)
- **Sources:** `premium-metadata-schema.md` § 14 q3
- **Question:** If promo variants get separate `cardCode` values
  (Q-001's likely outcome), should there be an alias table linking
  them back to the base cardCode for cross-source matching?
- **What it blocks:** Cross-source comps matching (P2-013+).
- **Recommended resolver:** Claude during P2-013/P2-014
  implementation, after Q-001 is decided.
- **Status:** open (depends on Q-001).

### Q-022 — Population data source (graded comps)
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-045.
- **Resolution:** Population data sourced from each grader's public
  population report (PSA pop report, BGS report, CGC census).
  Default is `populationKnown = false`; population-dependent UI
  surfaces suppress until a row is operator-verified. No automated
  scraping approved.

### Q-023 — Aggregation cadence (eBay sold comps)
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-046.
- **Resolution:** Aggregates (median, trimmed mean, count, IQR) per
  card per window are computed on demand by the consumer (client or
  importer-emit-time). The CSV / fixture / artifact stays at row
  grain. Emit-time pre-aggregation is the upgrade path if runtime
  cost exceeds 50ms aggregate at page load.

### Q-024 — Sealed price freshness threshold
- **Status:** **CLOSED 2026-05-12.** See `docs/decision-log.md` D-047.
- **Resolution:** Sealed-product prices are considered fresh for
  30 days from their `observedAt` timestamp. Beyond 30 days they
  are labeled "stale" and Box EV output flags the affected set
  with a freshness caveat. Single 30-day window shared with D-037
  (cross-source) and D-042 (manipulation-risk).

## 6. P3 — Long-term / contingent

### Q-030 — Backend trigger conditions confidence
- **Sources:** `phase-2-data-expansion-plan.md` § 9 +
  `phase-2-execution-checklist.md` § 7 (Backend Trigger Checklist)
- **Question:** The trigger criteria for backend introduction are
  documented but never tested against a measured signal. Will
  ~1,000 comp rows actually be the inflection point? Could static
  JSON scale to 10,000 with the lazy-load pattern?
- **What it blocks:** P2-017 (backend consideration).
- **Recommended resolver:** Defer until at least one trigger fires
  for real. Don't pre-decide.
- **Status:** monitored.

### Q-031 — Test framework choice
- **Sources:** `docs/test-coverage-gap-analysis.md` § 9
- **Question:** Vitest is the obvious choice but isn't yet approved.
  Adds 2 dev dependencies. Should the test framework decision wait
  until P2 implementation work is mostly done?
- **What it blocks:** Test Coverage Phase (P3 tier).
- **Recommended resolver:** Operator after P2-014.
- **Status:** open.

### Q-032 — Paid JustTCG tier upgrade trigger
- **Sources:** `decision-log.md` D-001 expiry trigger
- **Question:** What concrete condition would justify the $19/mo
  Starter tier upgrade?
- **What it blocks:** D-001 revisit.
- **Recommended resolver:** Operator. Recommended trigger: weekly
  rotation can't keep coverage above 1,121 entries even with rotation
  policy; or daily multi-source history becomes a feature
  requirement.
- **Status:** open.

### Q-033 — Cross-source first-pass expansion list
- **Sources:** `data-model-v2.md` § 8 / § 9 `source` enum:
  `justtcg, ebay, tcgplayer, pricecharting, cardmarket, manual, other`
- **Question:** The enum is forward-looking; in practice only
  `justtcg` is active. Which one is added next (eBay, TCGplayer,
  PriceCharting, Cardmarket)?
- **What it blocks:** First multi-source comp implementation
  (post-P2-013).
- **Recommended resolver:** Operator after Q-013 (first sold-comp
  source) is settled.
- **Status:** open.

### Q-034 — Set Rankings / Chase Radar visual treatment
- **Sources:** Codex CDX-06 task (planned); ChatGPT GPT-04 (planned)
- **Question:** Layout, copy, mobile behaviour, filter interaction
  with priceStatus / historyState / risk tags for a future Set
  Rankings or Chase Radar page.
- **What it blocks:** P2-015 (UI badges/filters) and any future
  Chase Radar surface.
- **Recommended resolver:** ChatGPT GPT-04 strategy spec → Codex
  doc commit.
- **Status:** open (queued in agent run plan).

### Q-035 — Monetization timeline
- **Sources:** `risk-register.md` R-052 (closed under current
  scope)
- **Question:** When does monetization become non-premature?
  Plausible signals (weekly returning users, time-on-site, deep-tab
  usage) are the inputs.
- **What it blocks:** Pricing page draft (ChatGPT GPT-10).
- **Recommended resolver:** Operator after at least 30 days of
  Plausible review (which blocks on R-020).
- **Status:** closed under current scope.

### Q-036 — Accounts / auth introduction
- **Sources:** D-013 expiry trigger
- **Question:** What single feature would justify adding accounts?
  Cross-device watchlist, alerts, custom dashboards are all
  candidates.
- **What it blocks:** Backend + auth phase.
- **Recommended resolver:** Operator after monetization decision
  (Q-035).
- **Status:** open / contingent.

### Q-037 — Long-term history archive
- **Sources:** D-031 expiry trigger; deleted
  `scripts/accumulate-prices.js`
- **Question:** If history-beyond-30-days becomes a requirement
  (e.g. for year-over-year analysis), how is it implemented?
  Re-add an accumulator? Backend table?
- **What it blocks:** Year-over-year analytics; future "rotation
  archive" UX.
- **Recommended resolver:** Operator. Recommendation: backend table
  if history > 90d, since the static-asset path becomes a
  multi-megabyte download.
- **Status:** open / contingent.

## 7. P-prioritized summary

| Priority | Open | Closed | IDs |
|----------|-----:|-------:|-----|
| P0 | 0 | 3 | closed: Q-001, Q-002, Q-003 |
| P1 | 1 | 5 | open: Q-010 · closed: Q-011 .. Q-015 |
| P2 | 1 | 4 | open: Q-021 · closed: Q-020, Q-022, Q-023, Q-024 |
| P3 | 7 | 1 | open: Q-030 .. Q-037 (less Q-035) · closed: Q-035 |
| **Total** | **9** | **13** | — |

As of 2026-05-12, Q-002 (image strategy) closes via D-038 along with
Q-011..Q-015 (P1) and Q-020 / Q-022 / Q-023 / Q-024 (P2). All P0
questions are now closed. Q-001 / Q-003 closed earlier (D-036 /
D-037). See `docs/decision-log.md` D-038..D-047 and the Resolved
section below.

## 7.5 Resolved (cross-reference)

| ID | Closed | Decision | Notes |
|----|--------|----------|-------|
| Q-001 | 2026-05-11 | D-036 | Promo namespace (three-tier scheme). |
| Q-002 | 2026-05-12 | D-038 | Image strategy (icons-only default; Option C upgrade path). |
| Q-003 | 2026-05-11 | D-037 | Cross-source variance thresholds. |
| Q-011 | 2026-05-12 | D-039 | GDR is a premium flag. |
| Q-012 | 2026-05-12 | D-040 | Bandai canonical for treatment names. |
| Q-013 | 2026-05-12 | D-041 | Manual eBay first sold-comp source. |
| Q-014 | 2026-05-12 | D-042 | Manipulation risk needs ≥10 eligible comps. |
| Q-015 | 2026-05-12 | D-043 | Two-tier confidence rule for badges. |
| Q-020 | 2026-05-12 | D-044 | `boxTopHit` derived at runtime. |
| Q-022 | 2026-05-12 | D-045 | Per-grader public reports; `populationKnown` default false. |
| Q-023 | 2026-05-12 | D-046 | Comps aggregates on demand. |
| Q-024 | 2026-05-12 | D-047 | Sealed-price freshness = 30 days. |
| Q-035 | (prior)    | —    | Monetization timeline (closed under current scope). |

## 8. Cross-reference to other audit docs

| Audit doc | Connection |
|-----------|------------|
| `docs/phase-2-consistency-audit.md` | Drift findings A1–G1 imply spec-tightening decisions, not open questions; not duplicated here. |
| `docs/risk-register.md` | R-017 (image licensing) and R-014 (JustTCG schema change) inform Q-002 and Q-033. |
| `docs/test-coverage-gap-analysis.md` | Maps to Q-031. |
| `docs/bundle-audit-2026-05-07.md` | Strategy choices imply decisions, not open questions. |
| `docs/phase-2-dashboard.md` | Mirrors the P2-task status; this doc covers the design questions inside those tasks. |
| `docs/decision-log.md` | Once a question here is answered, it becomes a D-NNN entry. |

## 9. What this doc does NOT include

- Implementation details (those live in the task itself, not as open
  questions).
- Bug reports or regressions (those live in the issue tracker or
  commit history).
- Marketing / launch / messaging questions (deferred to ChatGPT
  GPT-05 / GPT-08 / GPT-10 outputs when they land).
- Operational policy questions (those live in `AGENTS.md`).

## 10. Update protocol

When an open question is answered:

1. Move it to `docs/decision-log.md` as a new D-NNN entry.
2. Mark the row here as `closed` and add the D-NNN cross-reference
   in a "Resolved" section (to be added when the first closure
   happens).
3. If the answer changes downstream tasks, update the relevant spec
   docs and `docs/phase-2-execution-checklist.md`.

## 11. Recommended first three to answer (remaining)

All 3 originally-listed P0 questions are now closed (Q-001 / Q-002 /
Q-003 via D-036 / D-038 / D-037). The next three in priority order
are operator-only and require external context the agent layer
cannot supply:

1. **Q-010 (SB rarity vocabulary)** — operator decision after first
   SB source review. Should NOT be inferred from external listings;
   blocks SB fixture work in P2-005 / P2-012.
2. **Q-032 (Paid JustTCG tier upgrade trigger)** — operator
   decision. Recommended trigger: weekly rotation can't keep
   coverage above 1,121 even with rotation policy; or daily
   multi-source history becomes a feature requirement.
3. **Q-033 (Cross-source first-pass expansion list)** — operator
   decision after D-041 (manual eBay) is exercised end-to-end.
   Which automated source ingests next?
