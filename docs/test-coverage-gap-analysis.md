# FusionMetrics Test Coverage Gap Analysis

**Compiled:** 2026-05-07
**Audit task:** CLA-03 of the Claude Code architectural-audit run
**Baseline commit:** `3b4771b docs: add Phase 2 risk register`

## 1. Purpose

Document what is and isn't tested today, and propose a minimum Vitest
suite that would catch the regressions most likely to ship in the next
phase. **Nothing in this doc installs a dependency, changes CI, or
authors actual tests.** The proposed suite is marked as a future P3 task
gated by explicit operator approval.

## 2. What is tested today

Active automated checks in CI (`.github/workflows/ci.yml`):

| Check | What it asserts | What it would catch |
|-------|-----------------|---------------------|
| `npm run build` | Vite build completes without errors | Syntax errors, broken imports, JSON parse failures in bundled data |
| `node scripts/verify-data.js` | 9 data invariants (see § 3) | Schema violations on `cardData.json` and `livePrices.json`; missing `priceHistory30d.json` |

### 3. Invariants enforced by `verify-data.js`

From `scripts/verify-data.js` (current head):

1. `cardData.json` parses; array length = **1,258**.
2. Every card has truthy `code`, `set`, `rarity` string fields.
3. No duplicate `code` values across the 1,258 cards.
4. Every rarity ∈ `{L, C, UC, R, SR, SCR, SPR}`.
5. Every `set` matches `/^FB0[1-9]$/`.
6. `livePrices.json` parses; entry count ≥ **1,121** (97% of 1,156
   baseline coverage floor).
7. Every `marketPrice` is a finite positive number.
8. `livePrices.json` entries do **not** contain inline `history`
   (split-shape required).
9. `public/priceHistory30d.json` exists; every history point has a
   finite positive `p` and `t`.

These guard the data contract. They do not exercise any UI logic or
JavaScript runtime behavior.

## 4. Coverage gap inventory

The following areas have **zero automated tests** today.

### 4.1 Analytics model (`src/data.js`)

Behavior that ships in every render but isn't checked:

- `priceStatus` assignment (live vs estimated).
- `confidence` assignment (medium vs low).
- `marketPrice` resolution: live price wins over predicted; estimated
  cards must have `delta === 0` exactly.
- `priceTimestamp` is populated for live cards, `null` for estimated.
- `historyStateOf(points)` thresholds: ≥7 → `real`, 1–6 → `limited`,
  0 → `none`.
- `normalizeHistory` filters malformed `{p, t}` rows and sorts
  ascending by `t`.
- `loadPriceHistory30d` single-flight cache: two concurrent callers
  produce one fetch; success caches; failure resets `inFlight`.

**Regression risk:** medium-high. A single-line change in `data.js`
can flip ranking semantics across the whole app.

### 4.2 Watchlist v2 migration (`src/hooks/useWatchlist.js`)

Risky paths from R-019:

- v1 → v2 migration: v1 set of card codes becomes v2 items with
  `quantity = 1` and `entryPrice = current marketPrice`.
- `coerceQuantity`: clamps to ≥1, rejects non-numeric, rejects negative,
  floors fractional.
- `coerceEntryPrice`: rounds to 2 decimal places, rejects negative.
- `normalizeItem`: malformed rows produce no row (rather than corrupt
  storage).
- `toggle` on an existing code removes; on a new code adds with default
  entry price.
- `updateItem` preserves other fields when partial patch arrives.
- `clear` removes both v1 and v2 keys.
- Storage unavailable (private-browsing mode): hook still functions,
  no exception thrown.

**Regression risk:** high. localStorage migration is the single most
likely place to lose user portfolios silently.

### 4.3 CardDetail lazy-load states (`src/components/CardDetail.jsx`)

Five distinct branches that the UI must render correctly:

- `loading` — placeholder shown while fetch is in flight.
- `real` (≥7 points) — sparkline + "30d JustTCG history · N points"
  copy.
- `limited` (1–6 points) — sparkline or single-point copy + "Limited
  history" message.
- `none` (0 points) — "Not enough JustTCG history" copy.
- `unavailable` (fetch failure) — distinct "Price history unavailable"
  copy.

**Regression risk:** medium. Most of the time the path is `real`;
edge cases (a card with no priced history yet, or an offline user)
are easy to break silently.

### 4.4 Freshness-color thresholds (`src/components/CardDetail.jsx`)

Per `R-036` and the trust-fix wave:

- `<7 days` → green-muted.
- `7–21 days` → yellow-muted.
- `>21 days` → red-muted.
- Estimated card (no timestamp) → dim/grey, distinct copy.

**Regression risk:** medium. A wrong threshold ships immediately as a
visual bug nobody notices for weeks.

### 4.5 ProvenanceFooter behavior (`src/components/ProvenanceFooter.jsx`)

- Renders nothing on initial mount (no layout flash).
- One fetch per session for `/priceUpdateLog.json` (module-scope
  cache).
- Renders chip text with `lastMergedCount`, `lastGroup`, relative time.
- Fetch failure → muted "Refresh metadata unavailable" pill, does not
  block UI.
- Click opens modal listing last 12 history rows.
- Modal closes on backdrop click and ✕ button.

**Regression risk:** low. Component is small and self-contained.

### 4.6 Ranking exclusion (`src/tabs/ValueScanner.jsx`)

Per the trust contract:

- Sort = "Most Undervalued" must filter out `priceStatus === 'estimated'`
  before sorting by delta.
- Sort = "Most Overvalued" must do the same.
- Other sorts (price, demand, desirability) must NOT filter out
  estimated cards — they remain visible.
- Total row count surfaced in the header reflects the filtered count
  for ranking sorts.

**Regression risk:** high. This is the trust contract in code form;
a bug here directly violates the operating principle.

### 4.7 Set-Level Analytics (`src/tabs/MarketDynamics.jsx`)

- Per-set aggregates (median price, % priced, freshness mix).
- Set-level set-rotation freshness display.
- Hover/tooltip data integrity.

**Regression risk:** low–medium.

### 4.8 Box EV (`src/tabs/BoxEV.jsx`)

- EV computation: Σ(pullRate × cardsPerPack / rarityCount) × packs ×
  marketPrice, per rarity, summed.
- Data quality badge: warns when set rarity diversity < 4.
- Mobile narrow-width layout doesn't squeeze the Top Cards column.

**Regression risk:** medium. EV formula is small but every change is
quoted in user-facing copy.

### 4.9 Sparkline edge cases (`src/components/Sparkline.jsx`)

- `data.length < 2` → returns `null` (no render).
- Single-value series → no divide-by-zero.
- All-identical values → renders flat line, not NaN/Infinity path.

**Regression risk:** low. Defensive code is in place but unverified.

### 4.10 Methodology page presence (`src/tabs/Methodology.jsx`)

- Tab renders without console error.
- Required sections present: price sources, model methodology,
  estimates, financial-advice disclaimer.

**Regression risk:** low. But a missing disclaimer is the most direct
violation of the operating principle.

## 5. Recommended Vitest suite (~20 cases)

**Status:** spec only. Do not install Vitest or add dependencies until
the operator approves a Test Coverage Phase task (proposed P3 placement,
after Phase 2 implementation work).

### 5.1 Proposed file layout

```text
tests/
  data.test.js              # CLA-03-T01 .. T05
  useWatchlist.test.js      # CLA-03-T06 .. T10
  card-detail.test.jsx      # CLA-03-T11 .. T14 (requires JSDOM)
  provenance-footer.test.jsx # CLA-03-T15 .. T17
  value-scanner.test.jsx    # CLA-03-T18 .. T19
  history.test.js           # CLA-03-T20
```

### 5.2 Proposed test cases

| ID | File | Case | Why it catches a real regression |
|----|------|------|----------------------------------|
| T01 | `data.test.js` | `historyStateOf(7)` → `'real'`, `historyStateOf(6)` → `'limited'`, `historyStateOf(0)` → `'none'`. | Off-by-one shift in trust UI states. |
| T02 | `data.test.js` | `normalizeHistory([{p:1,t:200},{p:2,t:100}])` returns `[{price:2,ts:100},{price:1,ts:200}]`. | Sort order regression breaks every sparkline. |
| T03 | `data.test.js` | `normalizeHistory([{p:'a',t:1},{p:1,t:1},{p:-1,t:1}])` returns `[{price:1,ts:1}]`. | Schema-malformed rows poisoning analytics. |
| T04 | `data.test.js` | For a card with no live price, `marketPrice === predictedPrice` and `delta === 0` exactly. | Estimated-card trust rule violation. |
| T05 | `data.test.js` | `loadPriceHistory30d` called twice in parallel produces one `fetch`. | Cache regression doubles network cost. |
| T06 | `useWatchlist.test.js` | v1 storage `['FB01-001','FB02-002']` migrates to v2 items with `quantity=1` and entry price = current `marketPrice`. | Silent portfolio loss on app load. |
| T07 | `useWatchlist.test.js` | `coerceQuantity('abc')` → `1`; `coerceQuantity(-3)` → `1`; `coerceQuantity(2.7)` → `2`. | Bad input corrupts persisted P&L. |
| T08 | `useWatchlist.test.js` | `updateItem(code, { quantity: 5 })` preserves existing `entryPrice` and `addedAt`. | Partial patch overwrites lost. |
| T09 | `useWatchlist.test.js` | `clear()` removes both `fw-watchlist-v1` and `fw-watchlist-v2`. | Migration residue stays after explicit clear. |
| T10 | `useWatchlist.test.js` | localStorage throws on write → hook still returns usable state. | Private-browsing users get crashes. |
| T11 | `card-detail.test.jsx` | History loading state shows "Loading 30d history…" copy. | UI regressions in the loading state. |
| T12 | `card-detail.test.jsx` | History `none` state shows "Not enough JustTCG history" copy distinct from `unavailable`. | Critical distinction collapses. |
| T13 | `card-detail.test.jsx` | Fetch rejection → renders the `unavailable` two-line copy, not the `none` copy. | Network failure surfaces as "no data" lie. |
| T14 | `card-detail.test.jsx` | Live card with timestamp `Date.now() - 10 days` renders yellow freshness color. | Freshness threshold shift. |
| T15 | `provenance-footer.test.jsx` | First mount triggers one `fetch('/priceUpdateLog.json')`; second mount in same module life-cycle triggers zero. | Cache regression hammers the asset on tab switch. |
| T16 | `provenance-footer.test.jsx` | Fetch failure renders "Refresh metadata unavailable" pill; does not throw. | Failure surface blocks the rest of the UI. |
| T17 | `provenance-footer.test.jsx` | Click chip opens modal; modal shows up to 12 history rows. | Modal rendering bug or row-cap regression. |
| T18 | `value-scanner.test.jsx` | Sort = `'undervalued'` filters out cards where `priceStatus === 'estimated'`. | Trust contract violation (estimated in rankings). |
| T19 | `value-scanner.test.jsx` | Sort = `'price'` includes both live and estimated cards. | Over-restrictive filter regression. |
| T20 | `history.test.js` | A `priceHistory30d.json` payload with only `unknown`-typed values normalizes to empty arrays and the UI falls back to `none` cleanly. | Schema drift from JustTCG shape change. |

That's 20 cases across 6 files. Each test is targeted at a regression
that has either happened before, is observable in code review, or
directly maps to a trust-principle commitment.

### 5.3 Vitest setup notes (when approved)

- `vitest` and `@testing-library/react` are the obvious choices; both
  are lightweight relative to Jest.
- JSDOM is required for the `.jsx` tests; Vitest bundles support for it.
- No backend / network mock library needed; `fetch` can be mocked at
  the global level via Vitest's built-in spy.
- CI integration: add a `test` step to `.github/workflows/ci.yml` AFTER
  the build step. **Do not** add it to `verify-data.js` — keep that as
  the pure data contract check.

### 5.4 Implementation effort estimate

If approved as a separate task:

- One commit to add `vitest` + `@testing-library/react` +
  `@testing-library/jest-dom` as devDependencies and `vitest` config.
- One commit per test file (6 commits).
- One commit to wire the `test` step into CI.

Total: ~8 commits, ~2 hours of focused work for an agent that already
knows the codebase.

## 6. Why each gap matters

The 10 gap categories in § 4 collectively cover **every Phase 2 user-
facing surface**. A regression in any one of them either:

- **Violates the trust contract** (e.g. estimated cards leaking into
  rankings, fake freshness colors, missing financial-advice
  disclaimer), or
- **Silently corrupts persisted state** (Watchlist v2 migration), or
- **Breaks the lazy-load contract** (CardDetail history states), or
- **Hides degradation** (ProvenanceFooter / freshness color drift).

## 7. Closing note — P3-008 shipped

**Closed:** 2026-05-13 under P3-008 / Q-031.

FusionMetrics now ships a Vitest + React Testing Library suite with 20
focused regression cases covering the highest-risk gaps from this analysis:
data trust helpers, Watchlist v2 migration/storage paths, sample-gated public
artifact loaders, CardDetail history/freshness states, ProvenanceFooter
fallback/modal behavior, and ValueScanner ranking trust rules. CI now runs
`npm test` after `npm run build`.

Build + 9 invariants catches none of these.

## 7. Risks of not closing this gap

Tied to risk register entries:

- **R-019** (Watchlist v2 corruption) — six of the proposed tests (T06–T10)
  guard this directly.
- **R-015** (Fake investment certainty) — T04 and T18 enforce the
  estimated-card and ranking-exclusion rules in code.
- **R-014** (JustTCG schema change) — T13 and T20 verify the failure
  paths.
- **R-036** (Methodology disclosure gaps) — not directly tested in the
  proposed suite; would warrant a copy-presence test post-CLA-10.

## 8. Out of scope

This audit deliberately does NOT propose:

- End-to-end tests with Playwright (no headless browser dependency yet).
- Snapshot tests for entire JSX trees (brittle, low signal).
- Test coverage thresholds enforced in CI (premature; ship the suite
  first, calibrate later).
- Tests for `scripts/update-prices.js` (network-heavy, would require a
  fixture harness; defer to a later phase).
- Tests for `scripts/verify-data.js` itself (it's already the test
  layer; meta-testing adds little).
- Visual regression tests (defer to manual QA checklist).

## 9. Decision recommendation

**Tier this work P3 (Test Coverage Phase).** Do not start before:

1. Phase 2 P2-011 through P2-014 are complete (so the data layer is
   stable enough to test against).
2. R-001 (spec drift) is resolved (so test expectations are based on a
   canonical spec).
3. Operator explicitly approves adding `vitest` + RTL as
   devDependencies. This is the only dependency-add the proposed suite
   needs; AGENTS.md forbids new deps without approval.

When the Test Coverage Phase is approved, this doc becomes the spec for
its implementation. The 20 test cases above can be lifted into PR
descriptions as acceptance criteria, one file per commit.

## 10. Status

- **Today:** build + 9 invariants. ~5% of behaviors validated.
- **Proposed:** add 20 Vitest cases. Estimate ~40–55% of behaviors
  validated.
- **Not aimed at:** 100% coverage. The goal is to catch the regressions
  that would actually ship undetected — not to chase a number.
