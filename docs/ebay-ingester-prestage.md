# eBay Browse API Ingester — Pre-Stage Doc

**Created:** 2026-05-15
**Status:** Pre-stage. Activates the moment the operator has eBay API
credentials. Single Codex run ships the ingester end-to-end.
**Closes when activated:** P3-011 (manual eBay fill) becomes obsolete;
this ingester replaces it. R-018 single-source dependency moves from
mitigated → resolved. The Demand / Sup. Sat. / Market Dynamics
restoration paths in D-049 unlock immediately.

> **Operator action gate:** Confirm eBay developer account is approved
> AND you have `EBAY_APP_ID` + `EBAY_CERT_ID` (the `dev_id` is
> optional; only needed for Trading API, not Browse API). Add both
> to GitHub Actions secrets. Then paste the prompt in § 7 to Codex.

## 1. What this ingester does

Replaces the empty `public/ebayCompsSummary.json` sample-gated state
with **real eBay sold/active-listing data** for every priced card in
the catalog. Same row-grain shape that `scripts/import-ebay-comps.js`
emits today; the validator (`scripts/validate-ebay-comps.js`) keeps
gating. Production UI (`src/lib/ebayComps.js` + `CompsPanel.jsx`)
starts rendering real rows automatically — no UI code change needed.

It also produces two new aggregate artifacts that restore the
synthetic surfaces D-049 retired:

| Artifact | Restores | Source field |
|----------|----------|--------------|
| `public/ebayCompsSummary.json` | CardDetail CompsPanel rows | per-listing sold-price rows |
| `public/ebayDemand.json` | Demand % gauge + Value Scanner Demand column | `watchCount` from active listings, normalized per card |
| `public/ebaySupply.json` | Sup. Sat. % gauge + Value Scanner Sup. Sat. column | active-listing count per card, normalized vs catalog median |

After this lands, the Market Dynamics tab can be restored as a
separate follow-up Codex run with real inputs.

## 2. API choice — Browse API only

| Endpoint | What it gives us | Free tier | Use |
|----------|------------------|-----------|-----|
| `/buy/browse/v1/item_summary/search` | Active listings (price, watchCount, condition, image) | **5,000 calls/day** | ✅ Demand + Supply aggregates |
| `/buy/marketplace_insights/v1_beta/item_sales/search` | Sold listings (price, sold date, condition) | Requires special approval (rarely granted to new accounts) | ⏸ Use if approved; otherwise defer |
| Finding API (legacy) | Sold listings via `findCompletedItems` | Deprecated; new keys can't use it | ❌ Don't try |

**Default plan: Browse API only.** If `marketplace_insights` is
approved later, add a second commit to wire sold-listing comps. For
v1, "comps" means **closed/recent active listings**, not literal
sold prices — document the limitation explicitly in Methodology.

## 3. Quota math

- Free tier: 5,000 Browse API calls/day per app.
- Target: 1,258 cards × 1 search query each = 1,258 calls per full
  refresh.
- Plus per-card detail calls for top results: ~3 calls/card = ~3,800
  detail calls.
- **Total per full refresh: ~5,000 calls.** Right at the edge.

**Decision: 3-set rotation, same pattern as JustTCG (D-002, D-003).**

- ~140 cards per set × 3 sets = 420 cards per weekly run.
- 420 search + ~1,200 detail = ~1,620 calls per run.
- 3.2× quota headroom. Survives retries comfortably.
- Auto-pick rotation group via `getISOWeek(date) % 3`, same logic as
  `update-prices.js`.
- Operator override via `EBAY_UPDATE_SETS` env var.

## 4. Search query strategy

eBay's search isn't structured around cardCode. The mapping is the
hardest part of the ingester. Strategy:

```
query = `"${cardName}" "${cardCode}" Bandai Fusion World`
```

Example for FB01-139 Vegito:
```
"Vegito" "FB01-139" Bandai Fusion World
```

**Filters applied to every search:**
- `category_ids=2536` (Trading Card Games)
- `condition_ids=1000` (New) OR `4000` (Used — NM/LP)
- `filter=buyingOptions:{FIXED_PRICE|AUCTION}`
- `filter=conditionIds:{1000|2500|3000|4000}` (NM through LP only;
  exclude HP/poor)
- `sort=newlyListed`
- `limit=20` per call

**Variant matching** lives in the response handler, not the query:
- Title contains "alt art" / "AA" / "alternate" → `variant: 'altArt'`
- Title contains "winner" → flag for review
- Title contains "lot" / "x4" / "x10" → `itemType: 'lot'` → exclude
  from aggregates per D-042
- Title contains "PSA" / "BGS" / "CGC" with grade number → graded
  row (raw/graded separation per D-041)

## 5. Schema mapping — eBay response → our row format

| Our field | eBay source |
|-----------|-------------|
| `listingId` | `itemId` (e.g. `v1|123456789012|0`) |
| `cardCode` | from our search query (we already know which card we asked about) |
| `setCode` | derived from cardCode prefix |
| `title` | `title` |
| `soldPrice` (or activePrice for v1) | `price.value` |
| `shipping` | `shippingOptions[0].shippingCost.value` |
| `totalPrice` | sum |
| `currency` | `price.currency` |
| `soldDate` (or listedDate) | `itemCreationDate` (for active) |
| `condition` | `condition` |
| `rawOrGraded` | derived from title (PSA/BGS/CGC pattern) |
| `gradeCompany` | from title parse |
| `grade` | from title parse |
| `variant` | derived from title heuristic |
| `variantMatch` | `exact` / `likely` / `ambiguous` / `mismatch` per heuristic confidence |
| `quantity` | 1 (single listings); derived for lots |
| `itemType` | `single` / `lot` / `gradedCard` per title parse |
| `outlierFlag` | derived from per-card price IQR |
| `confidence` | `high` if exact variant match; `medium` if likely; `low` if ambiguous |
| `sourceUrl` | `itemWebUrl` |
| `reviewer` | `ebay-browse-api-v1` (constant; documents automation source) |
| `reviewedAt` | ISO timestamp at fetch time |
| `notes` | empty for automated rows |

## 6. Decision-log entries to add (Codex authors during the run)

- **D-050** — eBay Browse API admitted as second pricing source.
  Pairs with D-001 (JustTCG single-source) and D-041 (manual eBay
  was first sold-comp source; now superseded by automated Browse
  API).
- **D-051** — Variant matching rules canonical. Title-heuristic
  based; documents the `exact`/`likely`/`ambiguous`/`mismatch`
  state machine.
- **D-052** — Browse API "comps" mean recent listings, NOT literal
  sold prices, until `marketplace_insights` access is approved.
  Methodology page must say this explicitly.

## 7. Codex prompt — paste this when credentials are live

```text
Ship the FusionMetrics eBay Browse API ingester. Operator confirmed
EBAY_APP_ID and EBAY_CERT_ID are in GitHub Actions secrets. This
replaces the empty sample-gated comps state with real eBay data and
restores the Demand + Sup. Sat. surfaces D-049 retired. Single
Codex run; four commits.

Read first:
- AGENTS.md (§ 3 trust rules, § 6 file boundaries, § 4 quota
  rules)
- CLAUDE.md § 7.1 non-negotiables
- docs/ebay-ingester-prestage.md (THIS doc — the canonical
  pre-stage plan; follow every § verbatim)
- docs/ebay-comps-import-spec.md (canonical row shape)
- docs/source-confidence-spec.md (confidence model)
- docs/decision-log.md (D-001 quota; D-002 rotation; D-006/D-007
  no-synthetic; D-009 estimated-card exclusion; D-014 only show
  real; D-041 manual-eBay-first; D-042 ≥10 eligible comps;
  D-046 aggregates on demand; D-049 synthetic strip)
- scripts/update-prices.js (the template — same rotation +
  rate-limit + coverage-guard pattern)
- scripts/import-ebay-comps.js (existing sample importer — your
  output goes through the same validator pattern)
- scripts/validate-ebay-comps.js (gates every row)
- src/lib/ebayComps.js (existing sample-gate loader — should NOT
  need edits; the new artifact uses the production filename, so
  the loader will accept it automatically)

Preflight:
  bash scripts/session-brief.sh
  git fetch --all && git pull --ff-only
  node scripts/verify-data.js
  npm test
Confirm: clean tree, 9 invariants, current test suite passing.

────────────────────────────────────────────────────────────────────
COMMIT 1 — feat: eBay Browse API client + variant matcher
────────────────────────────────────────────────────────────────────

Allowed files:
- scripts/lib/ebay-client.js (NEW — OAuth2 token cache; rate-limit
  honoring fetch with Retry-After; typed errors AuthError /
  RateLimitedError / ApiError; same shape as JustTCG client in
  update-prices.js)
- scripts/lib/ebay-variant-matcher.js (NEW — pure functions:
  parseGrade, parseVariantHint, classifyItem; deterministic;
  unit-testable)
- tests/ebay-variant-matcher.test.js (NEW — at least 8 cases:
  PSA 10 grade parse; BGS 9.5 parse; lot detection; alt art
  detection; raw NM parse; ambiguous title; international shipping
  flag; bundle detection)

Forbidden: every other file. No network calls in tests; mock
fetch.

Validation:
  npm test (all cases + the 23 existing pass)
  node --check scripts/lib/ebay-client.js
  node --check scripts/lib/ebay-variant-matcher.js

Commit message: feat: eBay Browse API client + variant matcher

────────────────────────────────────────────────────────────────────
COMMIT 2 — feat: scripts/fetch-ebay-comps.js — main ingester
────────────────────────────────────────────────────────────────────

Allowed files:
- scripts/fetch-ebay-comps.js (NEW — main entry; reads
  EBAY_APP_ID + EBAY_CERT_ID from env; 3-set rotation per
  ISO-week % 3; per-card search + parse + validate; emits three
  artifacts atomically OR none [if any artifact fails validation,
  abort the run and keep prior data])
- scripts/verify-ebay-data.js (NEW — analog of verify-data.js but
  for the three eBay artifacts; ≥3 invariants: schema shape,
  cardCode existence, raw/graded separation enforced)
- public/ebayCompsSummary.json (initial empty production artifact
  with `_isSample: false`, empty `byCardCode: {}`, just so the
  loader gate is satisfied while the first cron run produces real
  data — first weekly run replaces this with the populated
  artifact)
- public/ebayDemand.json (same — empty initial)
- public/ebaySupply.json (same — empty initial)

Forbidden: every other file in this commit. ESPECIALLY:
src/cardData.json, src/livePrices.json, public/priceHistory30d.json,
public/priceUpdateLog.json, scripts/update-prices.js, scripts/
verify-data.js, src/* (UI), src/lib/* (UI loaders).

Coverage-guard invariants (NON-NEGOTIABLE):
- absolute floor: ≥ 300 cards with comps after a full 3-week
  rotation (catastrophic-drop guard)
- per-set floor: ≥ 50% of previous-run count for the touched sets
  (rejects partial degraded writes)
- raw/graded separation: every row must satisfy the constraint
  from scripts/validate-ebay-comps.js
- aggregates on demand (D-046): do NOT pre-compute median/IQR;
  store row grain only

Rate-limit budget per run:
- Target: ~1,600 calls per weekly rotation run
- Hard cap: 3,500 calls (60% of free-tier daily quota)
- On 429: honor Retry-After header; backoff 90s/180s/360s
- On 401: refresh OAuth token once; if still 401, abort and
  alert (R-005 secret-rotation handling)

Validation:
  node --check scripts/fetch-ebay-comps.js
  node --check scripts/verify-ebay-data.js
  node scripts/verify-data.js (9 invariants — unchanged)
  node scripts/verify-ebay-data.js (≥3 invariants on empty initial
  artifacts — must pass)
  npm test
  npm run build (bundle should not grow materially — artifacts
  are lazy-fetched)

Commit message: feat: eBay Browse API ingester (3-set rotation, free
  tier safe, row-grain emit)

────────────────────────────────────────────────────────────────────
COMMIT 3 — feat: .github/workflows/update-ebay.yml — weekly cron
────────────────────────────────────────────────────────────────────

Allowed files:
- .github/workflows/update-ebay.yml (NEW — schedule: weekly Tuesday
  05:00 UTC; manual workflow_dispatch with EBAY_UPDATE_SETS input;
  steps: npm ci → fetch-ebay-comps.js → verify-ebay-data.js →
  verify-data.js → npm test → commit if changed → push)
- docs/decision-log.md (EDIT — add D-050, D-051, D-052 per the
  pre-stage doc)
- docs/risk-register.md (EDIT — R-018 status moves from "monitored"
  to "mitigated" with the multi-source ingester wired)

Forbidden: every other file in this commit. Do NOT modify
deploy.yml, ci.yml, update-prices.yml, or update-cards.yml.

Failure alert step (mandatory): same `if: failure()` pattern as
P3-005 (opens a GitHub issue titled "update-ebay.yml failed:
$(date -u +%FT%TZ)" with body linking to the run; no secrets).

Validation:
  npm run build
  node scripts/verify-data.js
  npm test
  Lint workflow YAML mentally — workflows are not run in CI but
  syntax must parse.

Commit message: feat: update-ebay.yml weekly cron (D-050 eBay
  Browse API as second source)

────────────────────────────────────────────────────────────────────
COMMIT 4 — docs: Methodology refresh + STATUS + checklist
────────────────────────────────────────────────────────────────────

Allowed files:
- src/tabs/Methodology.jsx (EDIT — add a new section "eBay Browse
  API source" explaining: recent-listing data not literal sold
  comps until marketplace_insights approved (D-052); variant
  matching is title-heuristic (D-051); 3-set rotation matches
  JustTCG cadence; sample-gate still active for any artifact
  carrying `_isSample: true`)
- STATUS.md (EDIT — date 2026-05-15; phase header refreshed;
  TL;DR notes eBay ingester shipped; yellow flags refreshed:
  R-018 moves to mitigated)
- docs/phase-3-execution-checklist.md (EDIT — add P3-016 row
  "eBay Browse API ingester" with Complete status + ledger row;
  P3-011 marked superseded by P3-016)

Forbidden: every other file in this commit.

Validation:
  npm run build
  node scripts/verify-data.js
  npm test

Commit message: docs: Methodology + STATUS + checklist refresh
  post-eBay ingester

────────────────────────────────────────────────────────────────────
FINAL RESPONSE
────────────────────────────────────────────────────────────────────

1. Four commit SHAs.
2. Test count + runtime (should be ~31 tests now: 23 existing + 8
   new variant-matcher cases).
3. Bundle delta (should be near-zero; lazy artifacts).
4. Confirm: public/ebayCompsSummary.json, public/ebayDemand.json,
   public/ebaySupply.json all present at root level with
   `_isSample: false`.
5. STOP. Do not push. Do NOT trigger the new workflow manually —
   first cron run is the operator's call.
6. Operator's next step after merge: optionally trigger
   update-ebay.yml manually via gh CLI to populate the artifacts
   for the first time without waiting for Tuesday's cron.

STOP CONDITIONS:
- Any test fails.
- verify-data.js drops below 9 invariants.
- npm audit reveals a new advisory introduced by any added code.
- Any forbidden file appears in any commit's diff.
- Bundle grows > 10 kB raw.
- eBay client makes a real network call during test runs.
- Workflow step would expose EBAY_APP_ID or EBAY_CERT_ID in any
  log line.
```

## 8. After the ingester ships — restoration sequence

Per D-049 restoration roadmap:

1. **Demand % gauge + Value Scanner Demand column** — returns via
   a small Codex follow-up that reads `public/ebayDemand.json`
   and re-adds the gauge/column. 1 commit.
2. **Sup. Sat. % gauge + Value Scanner Sup. Sat. column** — same
   pattern with `public/ebaySupply.json`. 1 commit.
3. **Market Dynamics tab** — Codex re-implements `src/tabs/
   MarketDynamics.jsx` against real demand × supply inputs.
   1–2 commits.
4. **Watchlist Highest-Demand sort** — small Codex follow-up.
   1 commit.

Each restoration is a separately reviewable PR. The operator
controls timing — none ship before they want them to.

## 9. What this pre-stage does NOT do

- Apply for the eBay developer account — operator did that.
- Add API credentials to secrets — operator does that.
- Trigger the first cron run — operator's call after merge.
- Re-implement the retired UI surfaces (Demand gauge, Supply
  gauge, Market Dynamics tab) — separate Codex prompts after
  ingester data exists.
- Touch JustTCG ingestion path — completely independent.
- Apply for `marketplace_insights` access — separate operator
  task; defer until Browse API is producing reliable v1 data.

## 10. Operator checklist before pasting the Codex prompt

- [ ] eBay developer account approved.
- [ ] App created in eBay developer portal.
- [ ] `App ID (Client ID)` copied — this becomes `EBAY_APP_ID`.
- [ ] `Cert ID (Client Secret)` copied — this becomes `EBAY_CERT_ID`.
- [ ] Both added to GitHub Actions secrets at
  `Settings → Secrets and variables → Actions`.
- [ ] Optional: `marketplace_insights` access requested (separate
  application; usually denied for new accounts; revisit later).

When all checked, paste the § 7 prompt to Codex.

## 11. Cross-references

- `docs/decision-log.md` — D-001 (JustTCG single-source baseline);
  D-002 (3-set rotation); D-005 (lazy-load pattern); D-018
  (no synthetic price movement); D-041 (manual eBay first source
  — superseded by this when ingester ships); D-049 (synthetic
  strip — restoration paths unblock when this lands).
- `docs/risk-register.md` R-018 (single-source dependency —
  this is the structural exit).
- `docs/sample-gate-promotion-runbook.md` — same promotion path
  applies if you want to test with a sample fixture first.
- `docs/ebay-comps-import-spec.md` § 6 — canonical row shape this
  ingester emits.
- `scripts/update-prices.js` — reference template for client +
  rotation + coverage guard.

## 12. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-15 | Initial pre-stage doc | Activates when credentials land; single Codex prompt in § 7. |
