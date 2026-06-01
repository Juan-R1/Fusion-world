# Pipeline Hardening — Findings (2026-05-31)

**Status:** READ-AND-PROPOSE only. **No pipeline scripts were edited.**
Each finding lists a code excerpt + a proposed one-liner fix. The
operator approves before any pipeline edit (pipeline scripts are
trust-contract-central per AGENTS.md § 6).

**Scope reviewed:** `scripts/update-prices.js` (478 lines),
`scripts/scrape-official-fw.js` (314), `scripts/calibrate-model.js`
(185).

**Overall assessment:** the pipeline is in good shape. update-prices
already has typed errors, bounded backoffs, Retry-After honoring, and
a merged-output coverage guard. The findings below are polish +
future-proofing, not bug fixes. Ranked P1 (do before FB10) → P3
(nice-to-have).

---

## P1 — Do before FB10 onboarding

### P1-1 · Coverage-floor constants are buried inside `main()`
**File:** `scripts/update-prices.js` ~line 395
```js
const MIN_TOTAL          = 1121          // 1156 × 0.97 floor
const PER_SET_FLOOR_RATIO = 0.90
```
**Risk:** FB10 onboarding (D-052 / `docs/fb10-onboarding-prestage.md`
§ 3) must raise `MIN_TOTAL` once FB10 prices stabilize. Buried inside
`main()` it's easy to miss — and a stale floor either false-fails
during the FB10 ramp or silently under-guards afterward.
**Proposed fix:** hoist both to the top-level config block (next to
`MIN_SPACING_MS`) with a comment pointing at the FB10 doc:
```js
// Coverage guard — see docs/fb10-onboarding-prestage.md § 3 before
// changing MIN_TOTAL when a new set lands.
const MIN_TOTAL           = 1121   // 97% of the 1156 live-price baseline
const PER_SET_FLOOR_RATIO = 0.90
```

### P1-2 · Rotation groups will change at FB10; no pointer to the decision
**File:** `scripts/update-prices.js` ~line 48
```js
const ROTATION_GROUPS = {
  A: ['FB01', 'FB02', 'FB03'],
  B: ['FB04', 'FB05', 'FB06'],
  C: ['FB07', 'FB08', 'FB09'],
}
```
**Risk:** D-052 pre-decided FB10 joins group C. Without a comment, a
future agent may restructure into 4 groups and break the ISO-week % 3
selection contract (D-003).
**Proposed fix:** one comment line:
```js
// 3 groups, ISO-week % 3 (D-003). FB10 → group C per D-052; do not
// restructure without revisiting the week-selection math.
```

---

## P2 — Worth doing; not urgent

### P2-1 · Scraper swallows errors silently in several places
**File:** `scripts/scrape-official-fw.js` lines 182, 227–228, 235
```js
await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
...
if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await btn.click().catch(() => {});
}
```
**Risk:** best-effort `.catch(() => {})` is partly intentional for a
scraper, but a silently failed "load more" click or network-idle wait
can degrade scrape completeness with zero signal. The monthly workflow
then merges a thinner set.
**Proposed fix:** log at debug level inside the catches rather than
swallowing — e.g. `.catch(e => console.error('  debug: networkidle wait skipped:', e.message))`.
The merge step (`merge-known-cards.js`) already guards against partial
sets, so this is diagnostics, not correctness.

### P2-2 · Scraper magic timeouts scattered as inline literals
**File:** `scripts/scrape-official-fw.js` — `20000`, `60000`, `30000`,
`90000`, `2000`, `1000`, `300` appear inline across navigation/wait
calls.
**Risk:** tuning scrape patience (when Bandai's site is slow) means
hunting through the file. No correctness risk.
**Proposed fix:** a top-level timeout config block:
```js
const T = { NAV: 90_000, DETAIL_NAV: 60_000, NETWORK_IDLE: 30_000,
            BTN_VISIBLE: 2_000, SETTLE: 2_000, POLITE_DELAY: 300 }
```

### P2-3 · calibrate-model.js has no guard on malformed input files
**File:** `scripts/calibrate-model.js` lines 29–30
```js
const cardData   = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/cardData.json'),  'utf8'))
const livePrices = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/livePrices.json'), 'utf8'))
```
**Risk:** if either file is malformed, the operator gets a raw
`SyntaxError` stack instead of a clear message. Low — operator-run,
files are machine-generated.
**Proposed fix:** wrap in a try/catch that prints
`ERROR: could not read <file> — <message>` and exits 1.

---

## P3 — Nice-to-have

### P3-1 · calibrate-model.js could assert fitted constants are finite
Before printing the fitted β / rarity bases, assert `Number.isFinite`
on each and warn if the regression degenerated (zero variance). The
1,156-card dataset makes this near-impossible today, but a future
thin-data run (e.g. a brand-new set with few prices) could print NaN
constants that someone might paste into `src/data.js`.

### P3-2 · Percentile calc uses nearest-rank, not interpolation
**File:** `scripts/calibrate-model.js` lines 75–76 — `p10`/`p90` use
`Math.floor(length * q)`. Fine for a diagnostic table; noted only so a
future reader doesn't mistake it for a precise quantile.

### P3-3 · Domain constants in calibrate-model.js lack a provenance comment
`0.55` and `0.003` (pull-rate bounds), `100` (googleTrends max), the
`9 + 1` scaling — these are domain magic numbers. A short comment
block citing where they come from (the rarity pull-rate table in
`src/data.js`) would help future maintainers.

---

## What this review deliberately did NOT do
- Edit any pipeline script (operator-approval-gated).
- Change the OLS model math, the coverage-guard thresholds, or the
  rotation contract.
- Touch the workflow YAML.

## Recommended sequencing
1. P1-1 + P1-2 as a single small commit **before** FB10 work begins —
   they directly de-risk the FB10 onboarding sequence.
2. P2-1..P2-3 opportunistically, one commit each, when the relevant
   script is next touched for another reason.
3. P3 items only if a thin-data set ever makes them real.

## Cross-references
- `docs/fb10-onboarding-prestage.md` § 3 (coverage floor), § 2 (rotation).
- `docs/decision-log.md` D-002, D-003 (rotation), D-052 (FB10 group).
- `AGENTS.md` § 6 (pipeline scripts are high-risk; edit only with
  explicit task approval).
