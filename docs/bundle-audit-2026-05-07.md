# FusionMetrics Bundle Audit — 2026-05-07

**Audit task:** CLA-04 of the Claude Code architectural-audit run
**Baseline commit:** `e7b141d docs: add test coverage gap analysis`

## 1. Purpose

Document the current bundle, identify what's in it, and propose
reduction strategies. **Nothing in this doc edits app code, generated
data, or Vite config.** Every strategy is marked "spec only — needs
approval."

## 2. Current bundle measurements

Measured via `npm run build` against the baseline commit:

| Artifact | Raw | Gzip | Source |
|----------|-----|------|--------|
| `dist/assets/index-RD5j_OkY.js` | **647.93 kB** | **94.94 kB** | Vite build report |
| Same file on disk | 650,924 bytes | — | `ls -la dist/assets/` |
| `dist/index.html` | 3.68 kB | 1.39 kB | Vite build report |

Vite's chunk-size warning is `600 kB`; current bundle exceeds it by
**~48 kB raw**. Warning is non-blocking, but it tracks a real cost.

## 3. What's bundled vs lazy

### 3.1 Bundled (counts toward the ~648 kB total)

| Source | On-disk size | Estimated minified contribution |
|--------|-------------:|--------------------------------:|
| `src/cardData.json` (1,258 cards) | 507.4 kB | **~380 kB** |
| `src/livePrices.json` (1,156 entries, split-shape) | 122.4 kB | **~95 kB** |
| `react` + `react-dom` (production minified) | — | **~140 kB** |
| App code: `App.jsx`, 5 tab files, 8 components, 2 hooks, theme | — | **~30 kB** |
| Inferred total | — | **~645 kB** |

The actual bundle is 648 kB — well within rounding of the estimate.
**The single dominant contributor is `cardData.json` at ~58% of the
bundle**, followed by `livePrices.json` at ~15%.

### 3.2 Lazy-fetched (not in the bundle)

| Asset | On-disk size | Trigger |
|-------|-------------:|---------|
| `public/priceHistory30d.json` | 1,818 kB | First `CardDetail` open |
| `public/priceUpdateLog.json` | ~700 bytes | First `ProvenanceFooter` mount |

Lazy assets cost a network round-trip on first use but save the bytes
on initial load. This is the same pattern any reduction strategy should
follow.

### 3.3 What's NOT bundled by design

- Card images (external URLs; icon fallback for unmatched cards).
- Plausible analytics tag (`<script defer>` in `index.html`).
- Vercel runtime / serverless functions (none).

## 4. Reduction strategies

Five strategies catalogued. Each scored on:

- **Savings:** estimated raw and gzip drop.
- **Risk (1–5):** chance of breaking the trust contract, ranking
  semantics, or UI behavior during the refactor.
- **Effort (1–5):** rough engineering effort for an agent that knows
  the codebase.
- **Blocker:** prerequisite work before this can ship.

### S1 — Split `cardData.json` into core + extended chunks

**What:** Today `cardData.json` carries every card field (code, set,
rarity, character, icon, name, image, cardColor, cardType, trait,
verified, pullRate, googleTrends, etc.) in one bundled JSON. Most tabs
only need a "core" subset; CardDetail uses the full set.

Split into:

- `src/cardData.core.json` (bundled): `{code, set, rarity, name,
  cardColor, image}` — what's needed for table rows and rankings.
- `public/cardData.extended.json` (lazy-fetched): the remaining fields
  keyed by `cardCode`.

Lazy-fetch on `CardDetail` open with the same single-flight pattern
`loadPriceHistory30d` already uses.

**Savings:** ~250–300 kB raw / ~30–40 kB gzip.
**Risk:** 4/5. Touches `data.js`' `CARDS` construction, which is
consumed by every tab. Risk of breaking the trust contract if a tab
silently reads a missing extended field (e.g. CardDetail before
extended data lands).
**Effort:** 4/5. Multi-file refactor + new validator invariant +
new pipeline output split + new CardDetail loading state for extended
data.
**Blocker:** SB-set staging (P2-005 → P2-012) implicitly touches
`cardData.json` structure. Doing S1 before SB staging causes two
back-to-back schema migrations; doing it after means a settled v2 model
to migrate from.

### S2 — Code-split tabs (`React.lazy`)

**What:** Non-default tabs (Pricing Model, Market Dynamics, Box EV,
Watchlist, Methodology) become their own chunks loaded on first tab
switch. Today all five render-side components ship in the initial
bundle even though most users only open one or two.

```jsx
// proposed
const PricingModel   = lazy(() => import('./tabs/PricingModel.jsx'))
const MarketDynamics = lazy(() => import('./tabs/MarketDynamics.jsx'))
const BoxEV          = lazy(() => import('./tabs/BoxEV.jsx'))
const Watchlist      = lazy(() => import('./tabs/Watchlist.jsx'))
const Methodology    = lazy(() => import('./tabs/Methodology.jsx'))

// wrap <main> children in <Suspense fallback={<TabLoading />}>
```

**Savings:** ~30–50 kB raw / ~5–10 kB gzip in the initial bundle.
(Most of each tab's weight is shared components like `Sparkline`,
`MiniBar`, `RarityBadge` — these stay in the initial bundle because
ValueScanner uses them. The unique-per-tab logic is what splits out.)
**Risk:** 2/5. Standard React pattern. The biggest behavioral change
is a brief tab-switch loading state; falls back cleanly if the chunk
fails to load.
**Effort:** 2/5. One-file change to `App.jsx` plus a small `<Suspense>`
fallback component. Vite handles the chunking automatically.
**Blocker:** None. Could ship today behind operator approval. A small
loading flicker on first tab switch is the only user-visible change.

### S3 — Lazy-load `livePrices.json`

**What:** Move `src/livePrices.json` → `public/livePrices.json`. Make
`data.js`'s `CARDS` export an async-init pattern, or have each tab
subscribe to a live-prices `useLivePrices()` hook that lazy-loads on
first mount.

**Savings:** ~100 kB raw / ~15 kB gzip.
**Risk:** 4/5. `CARDS` is currently a synchronous exported array
consumed by every tab in their `useMemo` aggregations. Making it async
means either:

- All tabs gain a loading state (5 places).
- Or `CARDS` ships immediately with all `priceStatus = 'estimated'`
  and live prices "patch in" once loaded — risk of a visible flash
  where every card looks estimated for ~200 ms.

Trust contract is preserved either way, but the patch-in path needs
careful UI handling to avoid a confusing first paint.
**Effort:** 4/5. Refactor `data.js`, every tab consumer, plus a
loading affordance.
**Blocker:** Should happen AFTER S2 (code-split tabs) so the patch-in
behavior is observed in one tab at a time, not all five at once. Also
after R-001 (Phase 2 spec drift) is resolved.

### S4 — JSON key-shortening on `cardData.json`

**What:** `cardData.json` repeats long keys 1,258 times each
(`googleTrends`, `cardColor`, `cardType`, `rarityColor`,
`rarityName`, etc.). A custom format with short keys + a per-card
header that maps short → long would shrink the raw size meaningfully.

Two flavors:

- **Static map:** keys hard-coded in the build pipeline. Smallest, most
  brittle.
- **Header-driven:** first row of the JSON declares the key map; reader
  uses it to expand. Self-describing.

**Savings:** ~50–80 kB raw / ~5–10 kB gzip. (Gzip already dedupes
repeated key strings, which is why the gzip savings are modest.)
**Risk:** 3/5. The data contract changes; `data.js`' card construction
must decode; validators must understand the format; future
hand-debugging of `cardData.json` is harder because keys are short.
**Effort:** 3/5. Build-time script + reader change + validator.
**Blocker:** Optimization for optimization's sake. Skip unless S1
doesn't happen and gzip pressure becomes a real production constraint.

### S5 — Tree-shake unused theme tokens

**What:** `src/theme.js` exports 24 color/font tokens. Likely some are
no longer referenced after the trust-fix wave (`yellowDim`,
`blueDim`, `purple`, `cyan` are candidates worth grepping). Removing
unused tokens reduces a few constants.

**Savings:** ~1–2 kB raw / ~200–500 bytes gzip. Trivial.
**Risk:** 1/5. Token removal only.
**Effort:** 1/5. `grep -rn` for each token; remove unreferenced.
**Blocker:** Not worth the engineering time alone, but reasonable as
a side-effect of any other theme work.

## 5. Side-by-side comparison

| Strategy | Savings raw | Savings gzip | Risk | Effort | Blocker |
|----------|------------:|-------------:|-----:|-------:|---------|
| **S1** core/extended `cardData` split | 250–300 kB | 30–40 kB | 4 | 4 | After SB staging |
| **S2** code-split tabs | 30–50 kB | 5–10 kB | 2 | 2 | None |
| **S3** lazy-load `livePrices.json` | ~100 kB | ~15 kB | 4 | 4 | After S2 + R-001 |
| **S4** JSON key-shortening | 50–80 kB | 5–10 kB | 3 | 3 | Low value vs. S1 |
| **S5** theme tree-shake | 1–2 kB | <1 kB | 1 | 1 | None |

## 6. Recommended order

If/when bundle reduction is approved as a phase:

1. **S2 first.** Low risk, fast, real gain. Buys back the 30–50 kB and
   establishes the code-split habit. Ship in one commit; smoke-test via
   `npm run dev` + tab switching.
2. **S5 alongside S2.** Free cleanup; remove unused theme tokens in the
   same or adjacent commit.
3. **S3 next, but only after Phase 2 P2-014 is complete.** P2-014
   touches `data.js`' v2 model migration; lazy-loading `livePrices.json`
   layers cleanly on top of that work.
4. **S1 last.** Largest gain but largest risk. Bundle the change with
   the SB-set ingestion that's already going to touch `cardData.json`
   so the operator absorbs one schema migration, not two.
5. **S4 only if needed.** If the bundle still pressure-points after S1
   + S2 + S3, then key-shortening becomes a meaningful next step.

Combined potential after S1 + S2 + S3 + S5:
- Raw: ~648 kB → ~200–270 kB (savings 380–450 kB).
- Gzip: ~95 kB → ~40–55 kB (savings 40–55 kB).

Both numbers are estimates; actual results depend on Vite's chunking
behavior and any pipeline changes during Phase 2.

## 7. What this audit deliberately did NOT do

- Edit `vite.config.js`, `src/App.jsx`, `src/data.js`, or any other
  app/build file.
- Add a new validator script.
- Change generated data files.
- Trigger `npm run build` other than for sanity (already passing).
- Install or recommend installing `rollup-plugin-visualizer`. (It's
  the obvious next step once a strategy is approved, but adding a
  devDep needs explicit approval per `AGENTS.md` § 9.)
- Propose bundle-size budgets enforced in CI. That's downstream of
  ship-once-and-measure.

## 8. Decision criteria

A bundle-reduction phase is worth starting when **any** of:

- Mobile users on slow connections become a meaningful share of
  Plausible traffic (currently unmeasured — see R-020).
- The bundle crosses **~1 MB raw** (e.g. SB01+SB02 land and inflate
  `cardData.json` past the current 507 kB).
- Box EV / Methodology / Watchlist v2 grow materially in code size.
- Operator reports first-paint latency as a real complaint.

Until then, the **648 kB raw / 95 kB gzip** point is acceptable for a
portfolio-grade dashboard. Vercel's edge gzip + browser cache makes
repeat loads near-instant.

## 9. Open questions

- What's the actual Plausible-measured median time-to-first-paint
  today? Once R-020 is addressed, this becomes measurable.
- Does `rollup-plugin-visualizer` show any single-file surprise
  (e.g. a dev-time import accidentally surviving production)? An
  attribution scan is the natural follow-up to this audit.
- Is there appetite for a CI-enforced bundle-size budget once a
  strategy ships? Probably yes, but defer until after S2.

## 10. Status

- **Today:** 648 kB raw / 95 kB gzip. Within tolerance. Vite warns
  but doesn't block.
- **Proposed near-term action:** S2 (code-split tabs) when approved.
  No code changes from this audit.
- **Tier:** P2 (tracked, not urgent). Becomes P1 if SB-set expansion
  pushes the bundle past 1 MB raw.

## 11. Build verification recorded for this audit

```
✓ built in 1.53s
dist/assets/index-RD5j_OkY.js  647.93 kB │ gzip: 94.94 kB
(!) Some chunks are larger than 600 kB after minification.
```

Build is healthy. No regression introduced by this audit (docs only).
