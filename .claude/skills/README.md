# FusionMetrics Skills Library

Project-scoped Skills auto-discovered by Claude Code at session start.

## 1. Skill inventory

### Phase 2 / current skills (`fusionmetrics-*`)

| # | Skill | Category | When |
|---|-------|----------|------|
| 1 | fusionmetrics-pipeline | Pipeline | JustTCG updates, rotation, coverage guard, split price/history shape, generated data |
| 2 | fusionmetrics-qa | QA / Validation | Before commits, after build/workflow runs, smoke-testing UI, deciding if a task is done |
| 3 | fusionmetrics-product | Product strategy | Methodology copy, Set Rankings, Box EV, Watchlist, investor tools, public launch, roadmap |
| 4 | fusionmetrics-watchlist | Watchlist code | localStorage v2, portfolio fields, migration, entry price, quantity, local P/L, clear-all |
| 5 | fusionmetrics-mobile-ux | Mobile / narrow UX | Mobile layout, table overflow, modal readability, footer overlap, responsive cards |
| 6 | fusionmetrics-launch | Launch readiness | Screenshots, README, demo script, public-demo checklist, case study, recruiter-facing story |

### Legacy `fusion-*` skills (still active)

| # | Skill | Category | When |
|---|-------|----------|------|
| 7 | fusion-feature-ship | Core Workflow | Shipping any new tab/feature (strict-format output) |
| 8 | fusion-dashboard-patterns | Feature Implementation | Writing React/Vite UI code that should match existing patterns |
| 9 | fusion-tcg-model | Domain Logic | Analytics math / price model / rarity-stratified logic |
| 10 | fusion-data-pipeline | Maintenance | Bandai scraper, JustTCG price fetcher, card-data merge |
| 11 | fusion-git-flow | Maintenance | Every commit/push (branch rules, non-FF recovery) |
| 12 | fusion-llm-handoff | Handoff | Pasted external-LLM prompts that need normalization |
| 13 | fusion-qa-verify | Testing & Docs | Before commits, after data refresh, "does this actually work" |

The `fusionmetrics-*` skills are the current preferred set for Phase 2
work. The `fusion-*` skills remain active for narrower domain tasks
(domain math, git workflow, scraper, prompt normalization). When a
trigger could route to either family, prefer the `fusionmetrics-*`
variant for current Phase 2 work and the `fusion-*` variant for legacy
narrow tasks.

Invoke any skill with `/<skill-name>` in a Claude Code session, e.g.
`/fusionmetrics-qa` or `/fusion-git-flow`.

## 2. When-to-invoke matrix

Map the work you're about to do to the right skill. If multiple match,
invoke them in order.

| Trigger | Primary skill | Secondary | Files commonly touched |
|---------|---------------|-----------|------------------------|
| **JustTCG fetch / quota / rotation** | fusionmetrics-pipeline | fusion-data-pipeline | `scripts/update-prices.js`, `scripts/verify-data.js`, `.github/workflows/update-prices.yml` |
| **Price file shape / split shape / coverage guard** | fusionmetrics-pipeline | — | `src/livePrices.json`, `public/priceHistory30d.json`, `public/priceUpdateLog.json` |
| **Verifying a commit before push** | fusionmetrics-qa | fusion-qa-verify | any code/data change |
| **Build/verify output interpretation** | fusionmetrics-qa | — | terminal output |
| **Smoke-testing UI in the browser** | fusionmetrics-qa | fusionmetrics-mobile-ux | running dev server |
| **Watchlist v2 migration / portfolio fields** | fusionmetrics-watchlist | — | `src/hooks/useWatchlist.js`, `src/tabs/Watchlist.jsx` |
| **Mobile / narrow-width layout** | fusionmetrics-mobile-ux | fusion-dashboard-patterns | any `src/tabs/*.jsx`, `src/components/*.jsx` |
| **Public-demo / portfolio launch / screenshots** | fusionmetrics-launch | — | `STATUS.md`, `docs/screenshot-plan.md`, `docs/demo-script.md` |
| **Methodology copy / trust language / Box EV phrasing** | fusionmetrics-product | — | `src/tabs/Methodology.jsx`, `src/tabs/BoxEV.jsx` |
| **Roadmap / Set Rankings / Chase Radar UX** | fusionmetrics-product | — | spec docs in `docs/` |
| **Pasted prompt from ChatGPT / Gemini / Codex CLI** | fusion-llm-handoff | — | none until prompt is parsed |
| **Any commit / push / rebase / non-FF recovery** | fusion-git-flow | — | `git` operations |
| **Analytics math / pricing model / EV formulas** | fusion-tcg-model | fusionmetrics-product | `src/data.js`, `src/tabs/BoxEV.jsx` |
| **Bandai scraper / card-data ingest** | fusion-data-pipeline | fusionmetrics-pipeline | `scripts/scrape-official-fw.js`, `scripts/fetch-cards.js`, `scripts/merge-known-cards.js` |
| **Shipping a brand-new tab/feature end-to-end** | fusion-feature-ship | fusion-dashboard-patterns | many |
| **Writing new React/Vite UI matching existing patterns** | fusion-dashboard-patterns | — | `src/tabs/*.jsx`, `src/components/*.jsx` |

## 3. Phase 2 task → skill map

Cross-reference for the 17 Phase 2 tasks (see
`docs/phase-2-execution-checklist.md` and
`docs/phase-2-dashboard.md`).

| Phase 2 task | Primary skill | Why |
|--------------|---------------|-----|
| P2-001 plan / P2-002 checklist | fusionmetrics-product | Product strategy + planning docs |
| P2-003 data-model-v2 | fusionmetrics-product | Schema-as-product decision |
| P2-004 premium metadata | fusionmetrics-product | Premium classification rules |
| P2-005 SB staging | fusionmetrics-pipeline | Future generated data pipeline |
| P2-006 eBay comps spec | fusionmetrics-product | Data sourcing strategy |
| P2-007 source confidence | fusionmetrics-product | Trust labeling rules |
| P2-008 graded comps | fusionmetrics-product | Cross-source schema |
| P2-009 sealed products | fusionmetrics-product | Box EV inputs strategy |
| P2-010 expanded validation plan | fusionmetrics-pipeline | Validator gates |
| P2-011 staging directory scaffold | fusionmetrics-pipeline | Pipeline scaffolding |
| P2-012 premium metadata fixture | fusionmetrics-pipeline | Generated data prep |
| P2-013 eBay CSV fixture | fusionmetrics-pipeline | Generated data prep |
| P2-014 importer | fusionmetrics-pipeline | Pipeline code |
| P2-015 UI badges/filters | fusionmetrics-product + fusionmetrics-watchlist | UI surface |
| P2-016 CardDetail comps panel | fusionmetrics-product + fusionmetrics-mobile-ux | UI surface, mobile-aware |
| P2-017 backend | fusionmetrics-pipeline + fusionmetrics-product | Architecture + strategy |

## 4. Skill activation order (typical session)

For a new Phase 2 implementation task:

1. **fusion-llm-handoff** if the prompt came from another LLM (parse and
   validate before acting).
2. **fusionmetrics-product** to confirm scope matches Phase 2 product
   intent.
3. **fusionmetrics-pipeline** if generated-data or pipeline code is
   touched.
4. **fusionmetrics-watchlist** / **fusionmetrics-mobile-ux** as
   applicable to the file cluster.
5. **fusionmetrics-qa** before committing to confirm validation passes
   and trust copy is unchanged.
6. **fusion-git-flow** for the commit / push step.
7. **fusionmetrics-launch** only when the task is launch-readiness, not
   feature work.

## 5. Skill update protocol

When a skill needs an update:

- The skill's own `SKILL.md` file is the canonical content.
- Bump its `version` field in the YAML frontmatter so callers know the
  contract changed.
- If the skill's *scope* changes materially, also update the row in
  § 1 above and any matrix entries in § 2 that reference it.
- If a new skill is added, append a row in § 1 and at least one row in
  § 2.

This README is a navigation surface; the skills are the contracts.
