# FB10 (and Future Set) Onboarding — Pre-Stage Doc

**Created:** 2026-05-31
**Trigger:** Operator signal that a new Fusion World set is releasing.
**Status:** Pre-stage. Activates when Bandai publishes the FB10 card
list AND JustTCG begins pricing it. Most steps are pipeline-gated
(scraper + API), not pure agent work — this doc sequences them so
onboarding is one coordinated run, not a scramble.

> **The honest constraint:** FB10 card data cannot be fabricated. Real
> names, rarities, characters, and prices come from Bandai's official
> database (via the Playwright scraper) and JustTCG (via the price
> pipeline). This doc prepares the *path*; the *data* arrives when
> those sources publish. Inventing FB10 cards to "get ahead" would
> violate the core trust contract (make FusionMetrics unable to lie
> by accident).

## 1. What changes when a 10th set lands

FusionMetrics was architected around 9 sets (FB01–FB09). FB10 touches
six subsystems:

| Subsystem | What changes | File(s) |
|-----------|--------------|---------|
| Card generation | `SETS` array + per-set number ranges + `ARTS` names gain an FB10 entry | `scripts/fetch-cards.js` |
| Card metadata source | Scraper must target the FB10 Bandai page; merge into `known-cards.json` | `scripts/scrape-official-fw.js`, `scripts/merge-known-cards.js` |
| Live prices | JustTCG must list FB10; rotation must include it | `scripts/update-prices.js` |
| **Rotation cadence** | **9→10 sets breaks the clean 3×3 ISO-week rotation — D-002 expiry trigger fires** | `scripts/update-prices.js`, `docs/decision-log.md` D-002 |
| Coverage guards | Absolute floor (1,121) was set against a 1,156 baseline; +~140 FB10 cards shifts the denominator | `scripts/verify-data.js` |
| Pricing model | Recalibrate so FB10 rarity/character data informs the OLS fit | `scripts/calibrate-model.js`, `src/data.js` |
| Premium metadata | FB10 SCR/SR/Leader chase cards need classification | `data-staging/premium-metadata/`, runbook |
| Bundle | `cardData.json` grows ~140 cards (~5–8 kB gzip) | `vite.config.js` chunk warning |

## 2. The rotation problem (decide BEFORE FB10 prices land)

**D-002 expiry trigger has fired:** *"more than 9 sets exist."*

Current rotation (D-002 / D-003): ISO-week % 3 picks one of three
groups — A=FB01-03, B=FB04-06, C=FB07-09. Clean because 9 = 3×3.
Each set refreshes every 3 weeks; ~25 JustTCG calls per run fits the
free tier.

With 10 sets, options:

| Option | Scheme | Calls/run | Full-cycle | Notes |
|--------|--------|----------:|-----------:|-------|
| **A** | 4 groups of ~2-3 sets, ISO-week % 4 | ~30 | 4 weeks | FB10 joins a group; slightly slower full cycle |
| **B** | Keep 3 groups, FB10 joins group C (FB07-10) | ~33 for C | 3 weeks | Group C does 4 sets = more calls on its week; still under free tier |
| **C** | 5 groups of 2, ISO-week % 5 | ~17 | 5 weeks | Lowest per-run quota; slowest freshness |
| **D** | Paid JustTCG tier ($19/mo), full refresh | ~75 | weekly | Resolves Q-032; only if traffic justifies |

**Recommended default: Option B** (FB10 joins group C). Minimal code
change — extend the group-C set list. Group C's heavier week
(~33 calls) is still well under the ~100/day free-tier ceiling.
Revisit toward Option A or D when sets 11–12 arrive or traffic grows.

This decision should be logged as a new D-NNN entry the moment FB10
is confirmed, BEFORE the first FB10 price run.

## 3. Coverage-guard math (decide BEFORE the first FB10 verify-data run)

`scripts/verify-data.js` enforces an absolute floor of 1,121 live
prices (97% of the 1,156 baseline). When FB10 adds ~140 cards:

- New total: ~1,398 cards.
- FB10 won't have full JustTCG coverage on day one (new sets lag).
- If the floor stays at 1,121, a healthy state passes — but the
  *meaning* drifts (1,121 of 1,398 is 80%, not 97%).

**Recommended:** when FB10 lands, raise the absolute floor to ~97%
of the NEW expected live-priced baseline once FB10 prices stabilize
(e.g. floor ≈ 1,260 if FB10 reaches ~140 priced). Until FB10 prices
stabilize, keep the floor at 1,121 so the guard doesn't false-fail
during the ramp. Document the floor change as a D-NNN entry.

**Do NOT** lower the floor below 1,121 under any circumstance — that
would weaken the guard (trust-contract violation).

## 4. Onboarding sequence (when FB10 is live)

Ordered; each step gates the next.

### Step 1 — Confirm Bandai published FB10 (operator)
Verify the official card database has the FB10 set page. Note the
set name, total card count, and rarity breakdown.

### Step 2 — Scrape + merge (pipeline, operator-triggered)
```
# operator triggers the monthly card-DB workflow, or runs locally:
node scripts/scrape-official-fw.js   # targets FB10 Bandai page
node scripts/merge-known-cards.js    # FB10 entries → known-cards.json
```
Stop condition: if the scraper returns fewer cards than the set's
stated total, do NOT merge a partial set — investigate first
(matches the existing scraper-reliability guard).

### Step 3 — Extend fetch-cards.js (agent-doable once data exists)
Add the FB10 entry to the `SETS` array (code, name, total, spr),
the per-set number range, and the `ARTS` name list. Regenerate:
```
node scripts/fetch-cards.js          # writes src/cardData.json
node scripts/verify-data.js          # confirm new total
```
Commit: `feat: FB10 — extend card generation (NNN cards)`

### Step 4 — Rotation decision (agent-doable; § 2 above)
Implement the chosen rotation option in `update-prices.js`. Log the
D-NNN decision. Commit: `feat: FB10 rotation (D-NNN, option B)`

### Step 5 — First FB10 price run (operator-triggered)
```
# operator only — never agent-triggered:
gh workflow run update-prices.yml -f mode=rotation -f sets=FB10
```
Then `accumulate` the first FB10 history snapshot on the next run.

### Step 6 — Recalibrate the model (agent-doable after prices land)
```
node scripts/calibrate-model.js      # FB10 prices now in the fit
```
Update `src/data.js` constants if drift exceeds the recalibration
thresholds (per D-003 cadence rules). Commit:
`chore: recalibrate model with FB10 (drift report)`

### Step 7 — Coverage-floor adjustment (agent-doable; § 3 above)
Once FB10 prices stabilize, raise the absolute floor. Commit:
`chore: raise coverage floor for FB10 (D-NNN)`

### Step 8 — Premium-metadata for FB10 chase cards (agent-doable)
Classify FB10 SCR/SR/Leader cards using the D-048 character+rarity
rules. Validate → import → promote via the sample-gate runbook.
Add to the existing 169-row fill. Commit:
`feat: premium metadata — FB10 chase tier`

### Step 9 — Docs sweep
Update STATUS.md, AGENTS.md § 2, README data-source table, the
methodology page's set count, and this doc's status to "shipped."

## 5. What's agent-doable vs operator-gated

| Step | Owner |
|------|-------|
| 1 Confirm published | Operator |
| 2 Scrape + merge | Operator-triggered pipeline |
| 3 Extend fetch-cards | **Agent** (once known-cards.json has FB10) |
| 4 Rotation decision + impl | **Agent** |
| 5 First price run | Operator (never agent-triggered) |
| 6 Recalibrate | **Agent** (after prices land) |
| 7 Coverage floor | **Agent** |
| 8 Premium metadata | **Agent** |
| 9 Docs sweep | **Agent** |

So once the operator confirms FB10 is published, scrapes it, and runs
the first price fetch, the agent can carry steps 3, 4, 6, 7, 8, 9 in
a coordinated multi-commit run.

## 6. Pre-flight the agent CAN do today (before FB10 exists)

Nothing that touches data — but the rotation decision (§ 2) and the
coverage-floor policy (§ 3) can be pre-decided and logged as
"pending FB10" decisions so step 4 and step 7 are mechanical when the
time comes. This doc IS that pre-decision capture.

## 7. SB (starter-deck) sets — related but separate

`docs/sb-set-staging-spec.md` (P2-005) already specs SB-set staging.
SB sets use a different code namespace (`SB01`, `SB02`) and may
introduce rarity values not in the FB vocabulary (Q-010, still open).
FB10 is a mainline booster set and reuses the FB vocabulary, so it's
simpler than an SB set. Onboarding an SB set additionally requires
resolving Q-010 (SB rarity vocabulary) first.

## 8. Bundle watch

`cardData.json` is inlined in the build. FB10 adds ~140 cards
(~5–8 kB gzip). Combined with the Vite 8 OXC raw-size increase
(R-055 note), this nudges toward the code-splitting work
(R-021 / bundle-audit S2). If FB10 + FB11 both land before
code-splitting, prioritize the split.

## 9. Cross-references

- `docs/decision-log.md` D-001 (JustTCG tier), D-002 (rotation —
  expiry trigger fires at >9 sets), D-003 (ISO-week selection),
  D-005 (lazy-load), Q-032 (paid-tier trigger).
- `docs/risk-register.md` R-021 (bundle bloat), R-035 (cron drift).
- `docs/sb-set-staging-spec.md` — the starter-set cousin.
- `docs/operator-handbook.md` — where the FB10 Codex prompt should
  be staged once FB10 is confirmed published.
- `scripts/fetch-cards.js` — the `SETS` array extension point.

## 10. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-31 | Initial pre-stage doc | Authored on operator signal that a new set is releasing. Activates when Bandai + JustTCG publish FB10. |
