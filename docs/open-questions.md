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
- **Status:** **PROPOSAL PENDING OPERATOR REVIEW (2026-05-11).** See
  `docs/image-coverage-strategy.md`. Claude-authored recommendation
  is icons-only for portfolio-MVP and first month of public beta;
  upgrade to a third-party rights-cleared API (TCGplayer or
  PriceCharting) when any of three triggers fire. Mirror Bandai and
  hot-link options explicitly rejected due to copyright exposure.
- **Operator action:** confirm or counter-propose per the doc's § 11.
  When confirmed, add D-038 to `docs/decision-log.md` and close this
  question.

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
- **Sources:** `premium-metadata-schema.md` § 14 q1
- **Question:** GDR is a real product distinction in some TCG
  releases. Treat it as (a) a new rarity value, (b) a `premiumFlag`,
  or (c) both?
- **What it blocks:** P2-004 fixture (premium metadata) and possibly
  Q-010.
- **Recommended resolver:** Operator + ChatGPT (domain expertise on
  GDR product semantics).
- **Status:** open.

### Q-012 — Treatment naming canonical source
- **Sources:** `premium-metadata-schema.md` § 14 q2
- **Question:** Which official or public source should be canonical
  for treatment names ("alt art" vs "alternate art" vs "AA",
  "manga" vs "manga-style", etc.)?
- **What it blocks:** Validator for P2-012; premium-flag UI labels
  in P2-015.
- **Recommended resolver:** Operator + ChatGPT GPT-04 (UX copy spec).
- **Status:** open.

### Q-013 — First sold-comp source to sample
- **Sources:** `data-model-v2.md` § 18 q4
- **Question:** Which sold-comp source should be sampled first:
  manual eBay, PriceCharting, TCGplayer's visible sold data, or
  another public reference?
- **What it blocks:** P2-013 (eBay CSV fixture).
- **Recommended resolver:** Operator decision, informed by the
  External Source Approval Checklist (`phase-2-execution-checklist.md`
  § 8). Manual eBay is the current default per
  `ebay-comps-import-spec.md`.
- **Status:** partially answered (manual eBay is current default;
  decision is whether to expand sample to other sources for
  cross-source confidence).

### Q-014 — Manipulation risk minimum comp count
- **Sources:** `data-model-v2.md` § 18 q6
- **Question:** What minimum comp count is required before
  `manipulationRisk` can be anything other than `unknown`?
- **What it blocks:** Source confidence implementation; risk-tag
  surfacing in UI.
- **Recommended resolver:** Operator + ChatGPT GPT-03 alongside
  Q-003. Recommended starting point: ≥10 eligible comps in the
  selected window before any manipulation-risk label other than
  `unknown`.
- **Status:** open.

### Q-015 — Confidence level required to surface a premium badge in UI
- **Sources:** `premium-metadata-schema.md` § 14 q4
- **Question:** Should premium badges show for `medium` confidence
  metadata, or only `high`? `low` should never show, that's settled.
- **What it blocks:** P2-015 UI badge implementation.
- **Recommended resolver:** Operator + ChatGPT GPT-04 (UX spec).
  Recommendation: `medium` is sufficient for most badges; `high`
  required for "Set Chase" or other ranking-driving labels.
- **Status:** open.

## 5. P2 — Resolves during implementation

### Q-020 — `boxTopHit` stored vs derived
- **Sources:** `premium-metadata-schema.md` § 14 q5
- **Question:** Should `boxTopHit` collector tag be stored in
  premium metadata or derived at runtime from Box EV output?
- **What it blocks:** P2-012 fixture shape.
- **Recommended resolver:** Codex during P2-012 implementation.
  Recommendation: derive at runtime; recompute when Box EV inputs
  change. Storing it would require re-computation discipline.
- **Status:** open.

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
- **Sources:** `graded-comps-spec.md` § 10
- **Question:** Should population reports come from PSA's public
  population report, Beckett's, CGC's, or manual review? Population
  counts can become stale.
- **What it blocks:** P2-008 fixture work (graded comps with
  population data).
- **Recommended resolver:** Operator after first graded-comp samples
  are reviewed.
- **Status:** open.

### Q-023 — Aggregation cadence (eBay sold comps)
- **Sources:** `ebay-comps-import-spec.md` § 11
- **Question:** Are median / trimmed-mean / volume metrics computed
  per-card per-window (7d / 30d / 90d) at fixture load, or on demand?
- **What it blocks:** P2-014 importer + UI integration.
- **Recommended resolver:** Codex during P2-014 implementation.
  Recommendation: compute on demand for the first cycle; pre-compute
  later if perf demands.
- **Status:** open.

### Q-024 — Sealed price freshness threshold
- **Sources:** `sealed-products-spec.md` § 11
- **Question:** How fresh must a sealed-product price be before
  it's used as Box EV input? "Approximate" is the current copy
  framing; a threshold (e.g. 14 days) would make freshness explicit.
- **What it blocks:** P2-009 → P2-012 fixture work for sealed
  products.
- **Recommended resolver:** Codex during P2-012 implementation.
  Recommendation: 30 days, mirroring price-history freshness
  conventions.
- **Status:** open.

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
| P0 | 1 | 2 | open: Q-002 · closed: Q-001, Q-003 |
| P1 | 6 | 0 | Q-010 .. Q-015 |
| P2 | 5 | 0 | Q-020 .. Q-024 |
| P3 | 8 | 0 | Q-030 .. Q-037 |
| **Total** | **20** | **2** | — |

As of 2026-05-11, Q-001 (promo namespace) and Q-003 (cross-source
threshold) are closed by Claude's "take charge" run — see
`docs/promo-namespace-decision.md`, `docs/cross-source-threshold-decision.md`,
and `docs/decision-log.md` D-036 / D-037. The only remaining P0 is
Q-002 (image strategy), which is being authored as a Claude
recommendation in this same run; it lands at
`docs/image-coverage-strategy.md` and stays "active proposal" until
the operator confirms or counter-proposes.

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

## 11. Recommended first three to answer

In order:

1. **Q-001 (promo namespace)** — Codex CDX-04 / ChatGPT GPT-02
   outputs should arrive before this audit's next pass. Operator
   chooses among the proposals; decision lands in `decision-log.md`.
2. **Q-002 (image strategy)** — ChatGPT GPT-01 + Codex CDX-03 will
   produce the option analysis. Operator chooses; decision lands.
3. **Q-003 (cross-source threshold)** — ChatGPT GPT-03. Operator
   chooses; placeholder thresholds in
   `source-confidence-spec.md` § 7 are replaced.

All three are tractable within a single operator session.
