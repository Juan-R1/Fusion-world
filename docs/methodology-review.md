# Methodology Page Review (Read-Only)

**Reviewed:** 2026-05-07
**Audit task:** CLA-10 of the Claude Code architectural-audit run
**Baseline commit:** `e90be55 docs: consolidate Phase 2 open questions`
**File reviewed:** `src/tabs/Methodology.jsx` (117 lines)

## 1. Purpose

Audit the live Methodology & Data Sources page against the trust
principle (*make FusionMetrics unable to lie by accident*). Identify
copy gaps, propose specific edits.

**This doc does NOT edit `Methodology.jsx`.** Implementation is a
separate operator-approved task.

## 2. What's present today

The page renders:

- **Header**: Title "How FusionMetrics reads the market," subtitle
  "FusionMetrics is built to separate live market data from model
  estimates. The dashboard is a research tool, not financial advice."
- **4 fact tiles**: Price source = JustTCG; Card scope = FB01-FB09;
  Live prices = `1156 / 1258`; History = Real 30d data.
- **5 info sections**: Price Sources, Freshness, Price History,
  Set-Level Analytics, Model Limits.
- **External spot-check callout**: 9 of 10 cards aligned with
  external sources; 1 unclear due to variant ambiguity.

The page is mobile-responsive (`auto-fit, minmax(...)` grids),
dark-themed in line with the rest of the app, and uses the same
typography tokens.

## 3. Trust-completeness audit

The page is mostly honest. It correctly discloses:

- ✅ JustTCG is the live price source.
- ✅ Estimated cards exist and are excluded from rankings.
- ✅ "Research tool, not financial advice" — present in subtitle.
- ✅ Carried-forward data is preserved, not refreshed.
- ✅ Price history `unavailable` vs `not enough` distinction.
- ✅ Chase Dependency is a concentration metric, not an investment
  rating.
- ✅ Demand and supply scores are not observed market time series.
- ✅ Box EV doesn't model variant-specific odds, fees, taxes,
  shipping, liquidity, or sealed-product variance.

## 4. Missing disclosures (the trust gaps)

These are commitments the codebase makes but the Methodology page
doesn't surface. Each one should be added.

### M-001 — Pricing model R² = 0.32
- **Source of fact:** `src/data.js` lines 49 `const CHAR_PREMIUM_BETA = 0.0803`
  and inline comment "OLS, R²=0.32".
- **Gap:** The model's modest explanatory power (R² = 0.32 means ~68%
  of per-card variance is unexplained) is documented in code comments
  but not surfaced to users.
- **Why it matters:** A user looking at a card's `predictedPrice` may
  assume it's authoritative. The R² is the single number that
  describes how much to trust it.
- **Severity:** **High.** Direct trust-principle gap.

### M-002 — Smoothed UC rarity base
- **Source of fact:** `src/data.js` line 47 comment
  "smoothed (27-card sample was below C; enforced C < UC < R)".
- **Gap:** The Uncommon rarity's price baseline was smoothed upward
  from a noisy 27-card sample. The model's UC predictions are not
  pure regression output.
- **Why it matters:** Anyone interpreting UC card deltas should know
  the baseline was hand-corrected.
- **Severity:** Medium.

### M-003 — Extrapolated SPR rarity base
- **Source of fact:** `src/data.js` line 51 comment "extrapolated via
  log-linear pull-rate trend".
- **Gap:** SPR predictions are extrapolated from neighboring rarity
  classes — no real SPR sample backs them.
- **Why it matters:** SPR is the most premium rarity and the model is
  most uncertain about it. Predictions for SPR cards should carry an
  extra caveat.
- **Severity:** Medium-High. Directly affects the highest-value cards.

### M-004 — Single-source dependency
- **Source of fact:** Implied throughout `update-prices.js` and the
  active data contract.
- **Gap:** The page says "Current live prices come from JustTCG
  market data" but doesn't explicitly say JustTCG is the **only**
  source. A future user expecting Manabox / TCGplayer corroboration
  has no way to know.
- **Why it matters:** Source diversity is itself a trust signal. If a
  card's JustTCG price is wrong, FusionMetrics has no cross-check.
- **Severity:** Medium.

### M-005 — Refresh cadence and rotation explanation
- **Source of fact:** `scripts/update-prices.js` ROTATION_GROUPS.
- **Gap:** Page mentions "set rotation, so some sets update sooner
  than others" but doesn't say the cycle is 3 weeks or which sets are
  in each group.
- **Why it matters:** A user looking at FB04 (group B) on the wrong
  week sees data that may be 14 days old; freshness color tells them
  *that* it's old, but not *why* it's old.
- **Severity:** Medium.

### M-006 — Coverage guard floor (1,121)
- **Source of fact:** `scripts/update-prices.js` MIN_TOTAL = 1121.
- **Gap:** The pipeline refuses to ship degraded data; users have no
  way to know that when they see "1156 / 1258" the floor is enforced.
- **Why it matters:** This is the most operationally honest part of
  the system; it deserves user-facing mention.
- **Severity:** Low — operational, but worth mentioning.

### M-007 — Card metadata source (Bandai)
- **Source of fact:** `scripts/scrape-official-fw.js` and
  `scripts/known-cards.json`.
- **Gap:** The page doesn't say where card names, rarities, and
  metadata come from. They come from a Bandai-scrape pipeline.
- **Why it matters:** Source provenance — users should know they're
  seeing official Bandai card data, not scraped marketplace titles.
- **Severity:** Low.

### M-008 — Delta semantics
- **Source of fact:** `src/data.js` line 123
  `const delta = ((marketPrice - predictedPrice) / predictedPrice) * 100`.
- **Gap:** Every Value Scanner card shows a delta percentage. The
  Methodology page doesn't define what delta means.
- **Why it matters:** A user who doesn't know delta is
  "(market − model) / model" can't read the rankings.
- **Severity:** Medium.

### M-009 — Free-tier quota / why rotation exists
- **Source of fact:** `AGENTS.md` § 4, `phase-2-data-expansion-plan.md`.
- **Gap:** Honest disclosure would say "We're on JustTCG's free
  tier; the rotation policy keeps us under the 100/day limit."
- **Why it matters:** Optional. Users may not care; it's a
  transparency win regardless.
- **Severity:** Low — nice-to-have, not critical.

### M-010 — Financial-advice disclaimer prominence
- **Source of fact:** subtitle copy.
- **Gap:** The "research tool, not financial advice" line is present
  but tucked into the subtitle. A standalone "Not financial advice"
  callout near the bottom would harden the disclosure in a way
  scanners would catch.
- **Why it matters:** Trust-principle defense.
- **Severity:** Medium — current copy is acceptable, but explicit
  emphasis is better.

## 5. Specific proposed edits

These are **suggestions for a future operator-approved task**. Do
not edit `Methodology.jsx` from this audit doc.

### Proposed edit 1 — Add "Pricing Model" section

Insert as a new section after "Price History":

```jsx
{
  title: 'Pricing Model',
  items: [
    'When a card lacks a live JustTCG price, FusionMetrics uses a model estimate based on the card\'s rarity and a character-popularity score.',
    'The model is a rarity-stratified regression calibrated against ~1,156 real prices. R² ≈ 0.32 — about two-thirds of per-card variance is unexplained.',
    'The Uncommon (UC) rarity baseline is smoothed upward because the natural UC sample was noisy and produced a lower price than Common.',
    'The Special Rare (SPR) baseline is extrapolated because no live SPR samples were available; SPR predictions are the least trustworthy.',
    'Estimated cards therefore have a meaningful confidence floor; that is why they are excluded from undervalued / overvalued rankings.',
  ],
},
```

Covers M-001, M-002, M-003 in one cohesive section.

### Proposed edit 2 — Strengthen Price Sources section

Replace:
```
'Current live prices come from JustTCG market data.',
```

With:
```
'Current live prices come from JustTCG market data. JustTCG is currently the only live source; FusionMetrics does not yet cross-check against TCGplayer, eBay sold comps, or other marketplaces.',
```

Covers M-004.

### Proposed edit 3 — Strengthen Freshness section

Add a new bullet:

```
'The refresh cycle is three weeks: groups A (FB01–FB03), B (FB04–FB06), and C (FB07–FB09) each refresh on a rolling schedule.',
```

Covers M-005.

### Proposed edit 4 — Add a "Delta" definition

Add as a new bullet to the existing Pricing Model section (or to
Set-Level Analytics if Pricing Model isn't added):

```
'"Delta" on every card is calculated as (Market Price − Model Price) ÷ Model Price × 100. Negative deltas mean the live price is below the model; positive means above.',
```

Covers M-008.

### Proposed edit 5 — Add a "Coverage" section

New section after "Pricing Model" or merged into "Price Sources":

```jsx
{
  title: 'Coverage',
  items: [
    `FusionMetrics covers ${liveCount} live-priced cards out of ${cards.length} total. The pipeline refuses to publish a refresh that drops below 1,121 live prices, to prevent silent coverage degradation.`,
    'Cards without a live price still appear in the dashboard with model-estimated values, clearly labeled.',
  ],
},
```

Covers M-006 and the visibility of estimated cards.

### Proposed edit 6 — Standalone disclaimer callout

Replace the current orange "External spot check" container with a
**two-callout** layout: external spot-check stays as is; add a second
muted callout below or beside it that explicitly says:

```
'Not financial advice. FusionMetrics is a research tool. Prices are observations from a single source (JustTCG) plus a transparent model. Treat all values as approximate and never as a buy or sell recommendation.',
```

Covers M-010.

### Proposed edit 7 — Card metadata provenance (optional)

Add to "Price Sources" or to a new "Card Data" section:

```
'Card metadata (names, rarities, colors, traits) comes from Bandai\'s official Fusion World card list.',
```

Covers M-007. Optional.

## 6. Reading-level assessment

The current copy is readable at roughly a 9th-grade level — short
sentences, minimal jargon, no marketing language. **No change
needed.**

Jargon that survives the edit but is acceptable for the target
audience (collectors/players/investors who use price tools):

- "directionally aligned" — fine.
- "Chase Dependency" — defined in-line. Fine.
- "carried-forward" — defined in-line. Fine.
- "delta" — currently NOT defined. See proposed edit 4.

## 7. Mobile readability assessment

Inspected via the JSX structure (no live dev server in this audit):

- Container `maxWidth: 980` + `margin: '0 auto'` — fine.
- Section grid `repeat(auto-fit, minmax(260px, 1fr))` — wraps to a
  single column below ~280 px. **Good.**
- Fact tile grid `minmax(160px, 1fr)` — wraps to single column below
  ~180 px on iPhone SE. **Good.**
- Body font 13 px, micro-label 11 px — readable but **on the edge**
  for older eyes. Consider bumping body to 14 px on mobile if it
  doesn't break layout.
- `lineHeight: 1.65` on body copy and `1.7` on the subtitle —
  appropriate for reading density.
- No animations, no horizontal scroll, no off-screen content.

**Mobile is acceptable as-is.** A `useIsMobile` size bump would be
polish, not a fix.

## 8. Recommended order of edits

If/when implementation is approved (likely Codex on a single commit):

1. Add the "Pricing Model" section (edits 1, 4).
2. Strengthen "Price Sources" (edit 2).
3. Strengthen "Freshness" (edit 3).
4. Add the "Coverage" section (edit 5).
5. Add the second disclaimer callout (edit 6).
6. (Optional) Add card-metadata provenance line (edit 7).

Estimated effort: 30 minutes; one commit; ~30–50 lines added to
`Methodology.jsx`.

## 9. What this audit deliberately did NOT do

- Edit `src/tabs/Methodology.jsx` — that's a follow-up commit.
- Test the live page in `npm run dev` (CLA-XX run is doc-only).
- Add any copy that implies certainty or claims a return.
- Touch any other UI file.
- Propose a UI-state-machine refactor.

## 10. Status

- **Today's Methodology page:** mostly honest, missing 3 high-severity
  trust disclosures (R², smoothed UC, extrapolated SPR) and 4
  medium-severity items.
- **Recommended near-term action:** ship proposed edits 1–6 in a
  single operator-approved commit titled
  `feat: Methodology — disclose model limits, delta, and coverage`.
- **Tier:** P1 (material trust gap; should land before public-beta
  push).
