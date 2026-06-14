# AGENTS.md — FusionMetrics Multi-Agent Instructions

This repo is worked on by multiple coding agents (Claude Code, ChatGPT, OpenAI
Codex, occasionally others). This file is the contract every agent reads
**before** touching anything. It exists so the human operator does not have to
re-explain context, constraints, or commands every session.

If anything below conflicts with `CLAUDE.md`, this file wins for agent-runtime
behaviour; `CLAUDE.md` remains the long-form project-history doc.

---

## 1. Project summary

**FusionMetrics** is a market-analytics dashboard for the Dragon Ball Super:
Fusion World TCG. It tracks 1,258 cards across sets FB01–FB09 with live prices
and 30-day price history sourced from JustTCG. The trust-complete MVP
foundation is in place; the active phase is **honest product / analytics
expansion**.

- **Stack:** React 18, Vite 5, plain JavaScript, JSON data files, GitHub
  Actions, Vercel deployment.
- **Live URL:** https://fusion-metrics-jet.vercel.app/
- **Active branch:** `claude/dbfw-market-analytics-1qh5D` (do all work here).
- **Default branch:** `main` (do not push without explicit approval).

---

## 2. Current status

| Area | State |
|------|-------|
| Cards | 1,258 across FB01–FB09 |
| Live price coverage (known-good baseline) | 1,156 / 1,258 |
| Coverage guard floor | 1,121 (97% of 1,156) |
| Per-set guard | 90% of previous per-set count |
| Data shape | **split shape required** — `src/livePrices.json` (current prices only) + `public/priceHistory30d.json` (cardCode → `[{p,t}]`) |
| Refresh metadata | `public/priceUpdateLog.json` |
| Pipeline mode | Rotation (3 sets/run, ~25 reqs) is default; full mode (~67 reqs) is manual override |
| CardDetail price history | Lazy-loaded via `fetch('/priceHistory30d.json')`, proven, cached in-memory |
| Provenance / freshness | Footer + modal complete; per-card freshness badge complete |
| Methodology | Methodology & Data Sources tab complete with R²=0.32 / smoothed UC / extrapolated SPR / single-source disclosures |
| Sample-gated UI consumption | P2-015 premium badges + P2-016 comps panel both ship; refuse `_isSample: true` |
| Watchlist | v2 (localStorage) with quantity / entryPrice / currentValue / P&L; CSV export shipped (P3-006) |
| Test suite | 53-case Vitest suite (12 files): data.js invariants, Watchlist v1→v2 migration, sample-gate refusal, CompsPanel raw/graded separation, ValueScanner ranking, CardDetail, ProvenanceFooter, setAggregates (15), SetRankings + ChaseRadar UI, App-shell code-split, a11y assertions, mobile-layout audit. CI runs `npm test` after build. |
| Production error capture | P3-004 — `src/lib/errorCapture.js` fires Plausible `js-error` events when `window.plausible` is defined |
| Workflow failure alerts | P3-005 — `update-prices.yml` + `update-cards.yml` open a GitHub issue on failure |
| Pricing model constants | Recalibrated 2026-05-12 against 1156 prices (R²=0.318); next recalibration 2026-08-12 |
| External spot-check | Operator-driven, manual; protocol in `docs/cross-source-spot-check-protocol.md` |
| Current JS bundle | Initial chunk ~681 kB raw / ~94 kB gzip after tab code-split (R-021) + React 19 upgrade (D-054, +14.5 kB gzip vs React 18). Tabs lazy-load as separate chunks (BoxEV ~18 kB, CardDetail ~19 kB, Watchlist ~12 kB, etc.). The ~681 kB shared chunk is React 19 + data.js + inlined cardData.json, which the shell needs eagerly. Still well under the 750 kB raw hard stop. |
| Phase 2 progress | 17 / 18 complete; only P2-017 (backend) remains, operator-gated by Backend Trigger Checklist |
| Phase 3 progress | P3-001–P3-010, P3-012–P3-016 done (incl. Set Rankings + Chase Radar tabs implemented, premium-metadata SCR+SR+Leader tier promoted, Vite 8 / R-055, FB10 pre-stage). Only operator-gated work remains: P3-011 (eBay fill — needs API credentials) + the eBay ingester + restoration chain. |
| Tabs (7) | Value Scanner · Pricing Model · Box EV · Set Rankings · Chase Radar · Watchlist · Methodology. (Market Dynamics retired D-049; returns with real demand/supply data.) |
| Branch discipline | All work on `claude/dbfw-market-analytics-1qh5D`; PRs to `main` (PR #1 merged 2026-05-12; PR #2 standing for ongoing Phase 3 work) |
| Session brief | `scripts/session-brief.sh` auto-fires via `.claude/settings.json` SessionStart hook |

---

## 3. Non-negotiable data trust rules

Operating principle: **make FusionMetrics unable to lie by accident.**

1. **No synthetic market movement.** Sparklines render real JustTCG history
   only. Fake price-history generation is permanently removed.
2. **No synthetic demand sparklines.** There is no observed demand-history
   source; do not invent one.
3. **Estimated cards stay visible** but are **excluded from undervalued /
   overvalued rankings**. Their `marketPrice` equals `predictedPrice` exactly
   (no RNG noise; delta = 0).
4. **Trust labels must survive every change:**
   - `priceStatus`: `'live'` | `'estimated'`
   - `confidence`: `'medium'` (live) | `'low'` (estimated)
   - `hasLivePrice`: legacy alias used by Watchlist / BoxEV / ValueScanner.
5. **Coverage guard cannot be weakened.** Floor stays at **1,121**; per-set
   floor stays at **90%**. Any change that lowers either is rejected.
6. **Never write partial degraded files.** If guard fails, the script must
   `process.exit(1)` and write nothing. The bot's `add-and-commit` step then
   sees no diff and skips its commit.
7. **History UI states are exhaustive:**
   `loading` / `real` (≥7 points) / `limited` (1–6) / `none` (0) /
   `unavailable` (fetch failed). `unavailable` is **distinct** from `none`.

---

## 4. API / quota rules (JustTCG)

- **Tier:** assume **free tier** unless the human operator says otherwise.
- **Observed limits:** ~100 requests/day, ~1,000 requests/month, 20 cards/page.
- **Full FB01–FB09 refresh:** ~67 requests. Quota-risky on free tier.
- **Default mode is rotation (3 sets, ~25 reqs).** Full mode is operator-only.
- **Daily reset:** 00:00 UTC.
- **Never trigger `mode=full` without explicit operator approval.**
- **Never re-trigger the workflow on a hot quota.** If a run hits 401/429, wait
  for reset; do not burn budget retrying.
- The fetch layer in `scripts/update-prices.js` already classifies 401/403
  (auth, no retry), 429 (Retry-After honored, max 3 backoffs), 5xx/network
  (max 2 retries, 15s/30s). Don't reinvent these.

---

## 5. Build and validation commands

```bash
# Local validation — run BOTH before any commit that touches code:
npm run build                 # Vite 8 (Rolldown). Initial chunk ~631 kB raw / ~80 kB gzip; tabs code-split into lazy chunks. npm run preview serves the production build on :4173.
node scripts/verify-data.js   # 9 invariants; must say "split shape required"

# Optional dev server for UI smoke tests:
npm run dev

# Session brief — auto-runs via .claude/settings.json SessionStart hook,
# but you can invoke it manually anytime:
bash scripts/session-brief.sh
# Prints: branch + HEAD + drift vs origin/main + verify-data result +
# recent commits + Phase 3 task counts + sample-gate state. Reading
# the brief is the cheapest way to ground a session without scrolling
# git history. (R-002 mitigation.)

# Trigger the price refresh manually (operator only — quota-aware):
gh workflow run update-prices.yml --ref claude/dbfw-market-analytics-1qh5D \
  -f mode=rotation -f sets=FB01,FB02,FB03
gh run watch
```

Do **not** run the workflow as part of automated agent work. Only the human
operator triggers it.

---

## 6. File boundaries and high-risk files

**High-risk — change only with explicit task approval, one file per commit
when possible:**

- `scripts/update-prices.js` — fetch + rotation + merge + coverage guard.
- `scripts/verify-data.js` — CI gate. 9 invariants.
- `src/data.js` — analytics model + lazy-loader contract.
- `.github/workflows/update-prices.yml` — quota / inputs / `add:` line.
- `.github/workflows/ci.yml` — build gate.

**Do not edit by hand (machine-generated):**

- `src/cardData.json`
- `src/livePrices.json`
- `public/priceHistory30d.json`
- `public/priceUpdateLog.json`

**Retired / deleted legacy outputs:**

- old accumulator script — do not recreate without a new long-term-history plan.
- old bundled history file — no longer active; history lives in
  `public/priceHistory30d.json`.

**Touch only when the task explicitly names them:**

- `src/components/CardDetail.jsx`
- `src/tabs/ValueScanner.jsx`
- `src/tabs/MarketDynamics.jsx`
- `src/tabs/BoxEV.jsx`
- `src/tabs/Watchlist.jsx`

**Documentation only — never reformat in passing:**

- `CLAUDE.md`, `STATUS.md`, `AGENTS.md`, files under `.claude/skills/`.

---

## 7. Standard workflow for coding agents

1. **Read first:** `git status`, `git log --oneline -10`, the section of
   `AGENTS.md` and skills relevant to the task. Confirm working tree is clean
   or that any pending diff is expected.
2. **Confirm scope:** restate which files you will touch and which you will
   not. Stop and ask if scope is unclear.
3. **Edit minimally.** Prefer surgical edits to full rewrites. When rewriting
   a file, do it via a single Write to keep the change atomic.
4. **Validate locally:** `npm run build` and `node scripts/verify-data.js`
   both pass before committing.
5. **Commit on the active branch** (`claude/dbfw-market-analytics-1qh5D`)
   with a conventional prefix (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`).
6. **Push.** Retry up to 4 times with exponential backoff on network errors;
   on non-fast-forward, fetch + rebase, never force-push.
7. **Stop and report.** Do not chain into the next task without operator
   approval.

---

## 8. Required final response format

After any task that produces a commit, end the reply with:

1. Files changed (paths only).
2. Commit hash.
3. Build result (pass/fail; bundle size if it shifted).
4. `verify-data` result line.
5. Working tree status (clean / dirty).
6. Exact commands the operator should run next.

If the task fails or hits a blocker, replace items 2–4 with the failure mode
and what was reverted, then ask before retrying.

---

## 9. What not to do without explicit approval

- **Reality verification first.** Before any review, audit, or "what's
  the state" task, run `git fetch --all`, `git pull --ff-only` if your
  local branch is behind origin, then `git status` and
  `git log --oneline -10`. Operator prompt memory is not canonical;
  the repo is. Two May 2026 review sessions described work that
  existed on origin but not locally — confirm before drawing
  conclusions.
- Do **not** trigger `gh workflow run` on any workflow.
- Do **not** push to `main` or any branch other than the active dev branch.
- Do **not** force-push, amend pushed commits, or skip pre-commit hooks.
- Do **not** edit machine-generated JSON.
- Do **not** weaken any coverage guard, invariant, or trust label.
- Do **not** reintroduce synthetic sparklines, demand sparklines, or RNG
  noise on `marketPrice`.
- Do **not** add new dependencies. The repo is intentionally lean (React,
  ReactDOM, Vite plugin only).
- Do **not** run `mode=full` price refreshes.
- Do **not** add secrets to any committed file.
- Do **not** commit generated data changes from local development runs.
- Phase 2 data expansion work must consult and update
  `docs/phase-2-execution-checklist.md`.

---

## 10. Current recommended task sequence

> **Source of truth for in-flight work:** `docs/phase-2-dashboard.md`.
> If an operator prompt conflicts with the dashboard, the dashboard
> wins. If the dashboard conflicts with `docs/phase-2-execution-checklist.md`,
> the checklist wins.

In strict order. Do one task per commit; stop after each.

1. **Finish public-demo QA.** Search/filter smoke tests, CardDetail history
   cache check, Watchlist clear-all, and mobile modal/readability pass.
2. **Public launch package.** Screenshots, setup polish, caveats, and portfolio
   narrative.
3. **Image coverage strategy.** Research source and safe pipeline before
   touching generated data.
4. **Automated UI smoke tests.** Add only with explicit approval; keep focused
   on app load, tabs, CardDetail, provenance, and Watchlist localStorage.
5. **Watchlist refinements.** CSV export and small local-only UX improvements
   later, without accounts or cloud sync.
6. **Later only:** eBay sold comps, manipulation / outlier detection,
   long-term history archive, paid API tier, accounts, alerts, and AI
   prediction.

Do not frame the next phase as copying another product. The next phase is
honest product / analytics expansion built on the trust model above.
