# FusionMetrics Phase 2 Data Expansion Plan

## 1. Executive Summary

FusionMetrics is currently a portfolio-ready MVP for Dragon Ball Super: Fusion
World market analytics. It has a trust-complete frontend foundation: live
JustTCG prices, real 30-day JustTCG history, provenance, freshness labels,
Value Scanner, Pricing Model, Market Dynamics, Box EV, Watchlist v2, and a
Methodology page.

Portfolio MVP means the app can demonstrate the product concept and trust
architecture clearly. It does not mean FusionMetrics is a full market
intelligence product yet. Full product maturity requires broader card coverage,
premium chase metadata, source diversity, sold comps, graded comps, sealed
product data, source confidence, manipulation/outlier handling, and eventually
backend persistence if user-specific or large relational data justifies it.

The Phase 2 operating rule is: expand data quality before expanding investment
claims. FusionMetrics should remain unable to lie by accident.

## 2. Current Baseline

| Area | Current state |
|------|---------------|
| App stack | React + Vite + JavaScript |
| Deployment shape | Static frontend with JSON data artifacts |
| Card scope | FB01-FB09 |
| Total cards | 1,258 |
| Live prices | 1,156 |
| 30d history entries | 1,156 |
| Current price source | JustTCG |
| Data shape | Split shape required |
| Current price file | `src/livePrices.json` current prices only |
| 30d history file | `public/priceHistory30d.json` real JustTCG history |
| Provenance file | `public/priceUpdateLog.json` refresh metadata |
| Backend | None |
| Accounts / cloud watchlists | None |
| eBay sold comps | None |
| Graded comps | None |
| SB01 / SB02 | Not covered |

## 3. Honest Readiness Percentages

| Area | Estimate | Notes |
|------|----------|-------|
| Portfolio MVP | 95% | Strong demo, clear trust story, current screenshots are usable. |
| Public beta | 80% | Needs image coverage strategy, deployment check, and repeatable UI smoke tests. |
| Full FusionMetrics vision | 25% | Strong foundation, but most market intelligence data is missing. |
| Investor-grade market intelligence | 15% | No sold volume, graded comps, source variance, or manipulation checks yet. |
| Data coverage maturity | 45% | FB01-FB09 are covered, but starter sets, promos, sealed, and premium variants are missing. |
| Source diversity maturity | 10% | JustTCG is the active source; only one manual spot-check exists. |
| Premium chase coverage maturity | 20% | Some chase cards exist in FB sets, but there is no formal premium metadata layer. |
| eBay comps maturity | 5% | Research concept only; no CSV/import/spec exists yet. |
| Graded comps maturity | 0% | No PSA/BGS/CGC/TAG data model or UI exists. |
| Backend/database maturity | 5% | Watchlist is localStorage; no server-side persistence. |
| Monetizable v1 readiness | 20% | Value proposition is promising, but data depth and account/alert systems are not ready. |

## 4. Missing Data Categories

| Category | Current status | Why it matters | Likely source | Difficulty | Risk | Backend needed now? |
|----------|----------------|----------------|---------------|------------|------|---------------------|
| SB01 / SB02 / future SB sets | Missing | Starter products and chase cards expand the card universe. | Bandai official card list, JustTCG if supported, manual staging | Medium | Schema and set-code assumptions may need updates. | No |
| Promos / event cards | Missing or incomplete | Promo variants cause major price and matching ambiguity. | Bandai, event lists, JustTCG, manual CSV | High | Variant collision with base card codes. | Not initially |
| Manga / manga-adjacent / God Rare / GDR / alt art | Missing as structured metadata | Premium chase cards drive collector behavior and investor interest. | Manual metadata first, later market sources | High | Hype labels can overclaim value. | No |
| Sealed products | Missing | Box EV needs real sealed prices and product metadata. | Manual CSV, JustTCG if available, TCGplayer/eBay later | Medium | Sealed markets are volatile and source-specific. | Not initially |
| eBay sold comps | Missing | Needed for source variance, liquidity, and real sale validation. | Manual CSV first, official eBay API later if approved | High | ToS, matching, outliers, graded contamination. | Later |
| Graded comps | Missing | Needed for raw-to-grade spread and premium market intelligence. | Manual CSV, PriceCharting, eBay sold, PSA/BGS/CGC sources | High | Grade/company/population normalization. | Later |
| Source confidence | Missing | Users need to know when sources disagree or volume is thin. | Derived from JustTCG + comps + freshness | Medium | False confidence if formulas are too simple. | Not initially |
| Manipulation / outlier risk | Missing | Thin markets are easy to distort. | Derived from sold comps, source variance, volume | High | Requires enough observations to avoid noise. | Later |
| Image coverage | Low | Portfolio and user trust suffer without real card images. | Rights-safe image source or official image pipeline | Medium | Licensing/source reliability. | No |
| Liquidity / sales velocity | Missing | Price without volume can mislead. | eBay/TCGplayer sold data where available | High | Requires sold comp history. | Later |

## 5. Target Data Model

Start with docs and CSV schemas. Move to generated JSON artifacts only after
validators exist. Move to a database only after trigger criteria are met.

### `cards`

- `cardCode`
- `name`
- `setCode`
- `setName`
- `rarity`
- `color`
- `type`
- `traits`
- `character`
- `imageUrl`
- `tags`
- `premiumFlags`

### `sets`

- `setCode`
- `name`
- `releaseDate`
- `productType`
- `cardCount`
- `sealedProducts`
- `dataCoverage`

### `premium_metadata`

- `cardCode`
- `premiumFlags`
- `collectorTags`
- `riskTags`
- `gradeUpside`
- `notes`
- `source`
- `updatedAt`

### `card_market_snapshots`

- `cardCode`
- `source`
- `price`
- `timestamp`
- `condition`
- `variant`
- `confidence`

### `price_history`

- `cardCode`
- `source`
- `date`
- `price`
- `volume`
- `confidence`

### `ebay_sold_comps`

- `listingId`
- `cardCode`
- `title`
- `soldPrice`
- `shipping`
- `soldDate`
- `condition`
- `rawOrGraded`
- `gradeCompany`
- `grade`
- `variantMatch`
- `confidence`
- `outlierFlag`
- `sourceUrl`

### `graded_comps`

- `cardCode`
- `company`
- `grade`
- `salePrice`
- `saleDate`
- `source`
- `confidence`

### `sealed_products`

- `productCode`
- `setCode`
- `productType`
- `name`
- `marketPrice`
- `source`
- `timestamp`

### `source_confidence`

- `cardCode`
- `sourcesAgree`
- `sourceVariance`
- `lowVolumeFlag`
- `staleFlag`
- `variantAmbiguityFlag`
- `manipulationRisk`

### `watchlist_positions`

Current state remains local-only. A backend table may be introduced later only
after account/cloud-sync work is explicitly approved.

## 6. Recommended Staging Strategy

1. Docs/spec first.
2. Manual CSV/import first.
3. Generated JSON artifacts second.
4. Backend/database later.
5. No scraping until explicitly approved.
6. No generated data edits until schema and validator exist.
7. Every new artifact needs a validator before it can become product input.

Recommended sequence:

1. `docs/data-model-v2.md`
2. `docs/premium-metadata-schema.md`
3. `docs/sb-set-staging-spec.md`
4. `docs/ebay-comps-import-spec.md`
5. `docs/source-confidence-spec.md`
6. `docs/expanded-data-validation-plan.md`
7. Approved staging folder and sample fixtures.
8. Importers and UI only after fixture/spec approval.

## 7. eBay Sold Comps Strategy

Do not scrape yet. Start with manual CSV research.

Required field categories:

- Listing identity: `listingId`, `sourceUrl`, `title`.
- Card identity: `cardCode`, `setCode`, `variant`, `variantMatch`.
- Sale data: `soldPrice`, `shipping`, `soldDate`, `currency`.
- Condition data: `condition`, `rawOrGraded`, `gradeCompany`, `grade`.
- Quality data: `confidence`, `outlierFlag`, `notes`.

Rules:

- Raw and graded sales must be separated.
- Base, promo, reprint, manga, alt-art, and event variants must be separated or
  flagged as ambiguous.
- Every comp must include a source URL.
- Lots, proxies, custom cards, damaged cards, and unclear listings must be
  excluded or flagged.
- Confidence levels should be explicit: `high`, `medium`, `low`, `excluded`.
- Outliers should be flagged before any median/average calculation.
- Official API automation may be considered later only after ToS/rate limits,
  field mapping, and manual samples are reviewed and approved.

Initial metrics:

- Median sold price.
- Trimmed mean sold price.
- Sale count.
- Last sold date.
- 7d / 30d / 90d volume where enough data exists.
- Source variance vs JustTCG.
- Low-volume and outlier flags.

## 8. Premium Chase Metadata Strategy

Premium chase data should be metadata first, not a hype score.

Suggested fields:

- `premiumFlags`: `manga`, `mangaAdjacent`, `godRare`, `gdr`, `altArt`,
  `sealedChase`, `gogetaChase`, `eventPromo`, `winner`, `serialized`.
- `collectorTags`: character tier, fan-demand tier, art appeal, set chase role,
  nostalgia tag, fusion tag.
- `riskTags`: variant ambiguity, low volume, stale price, reprint risk, graded
  contamination, source disagreement.
- `gradeUpside`: raw price reference, graded comp reference, estimated grading
  fee assumption, spread confidence.

Rules:

- No hype-only scoring.
- No guaranteed-return copy.
- No buy/sell recommendations.
- Premium labels must be explainable as metadata, source-backed tags, or
  clearly labeled heuristics.

## 9. Backend / Database Recommendation

### Static JSON now

Pros:

- Cheap, simple, deployable, and already guarded.
- Excellent for portfolio/demo and controlled public beta.
- Keeps data contract visible and reviewable.

Cons:

- Poor fit for large comps datasets, user accounts, alerts, and daily
  multi-source history.

### Staged CSV/JSON next

Pros:

- Best next step.
- Allows manual eBay comps, premium metadata, and sealed products without
  committing to backend complexity.
- Validators can protect data quality before UI consumption.

Cons:

- Requires discipline around schemas, fixtures, and generated artifacts.

### Supabase/Postgres or Neon/Postgres later

Pros:

- Good fit for relational comps, source confidence, account watchlists, alerts,
  and queryable history.

Cons:

- Adds auth, migrations, backups, cost, security, and operational burden.

Backend is not approved yet. Trigger it only when at least one is true:

- Comps exceed roughly 1,000 rows.
- Account/cloud Watchlist is approved.
- Alerts are approved.
- Daily multi-source history is approved.
- Static artifacts become too slow or too large.
- User authentication is required.

## 10. Product Roadmap

### Phase 0: Current MVP

Goal: trust-complete portfolio MVP.

Complete:

- FB01-FB09 JustTCG prices.
- Real 30d JustTCG history.
- Split data shape.
- Provenance and freshness.
- Value Scanner, Pricing Model, Market Dynamics, Box EV, Watchlist v2,
  Methodology.
- Launch docs and screenshot plan.

### Phase 1: Data Foundation Expansion

Goal: define expanded data safely before product UI.

Features:

- v2 data model spec.
- Premium metadata schema.
- SB01/SB02 staging schema.
- Expanded validation plan.

Backend needed: no.

Risk: schema churn and premature generated-data edits.

### Phase 2: Source Expansion

Goal: add cross-source evidence without scraping or overclaiming.

Features:

- Manual eBay sold comps CSV spec.
- Source confidence spec.
- Graded comps spec.
- Sealed products spec.

Backend needed: not initially.

Risk: variant mismatch, raw/graded contamination, source licensing.

### Phase 3: Investor Utility

Goal: turn stronger data into cautious user value.

Features:

- Chase Radar planning.
- CardDetail comps panel after comps artifact exists.
- Watchlist export/import.
- Source variance and low-volume flags.
- Manipulation/outlier warnings.

Backend needed: maybe later.

Risk: fake precision and investment overclaiming.

### Phase 4: Backend / Accounts

Goal: durable user-specific product features.

Features:

- Cloud watchlists.
- Alerts.
- Saved filters.
- User portfolios.

Backend needed: yes.

Risk: privacy, security, auth, migrations, support burden.

### Phase 5: Monetization

Goal: monetize only after validated user value.

Features:

- Premium alerts.
- CSV exports.
- Advanced comps.
- Source-confidence analytics.
- Newsletter/community.

Backend needed: likely yes.

Risk: legal expectations, data licensing, and support obligations.

## 11. Risks And Stop Conditions

Risks:

- Variant mismatch can poison comps and confidence scores.
- Raw and graded sales can contaminate each other.
- eBay ToS/API/rate limits may block automation.
- Premium chase labels can become fake investment certainty.
- Generated data corruption can break the known-good MVP.
- Backend work too early can slow product learning.
- Image/source licensing can create launch risk.

Stop conditions:

- A task requires scraping without approval.
- A task requires generated data edits before schema/validator approval.
- A task weakens `verify-data.js` or coverage guards.
- A task adds backend/database work before trigger criteria are met.
- A task implies guaranteed returns, buy/sell certainty, or investment advice.
- A task needs external API credentials or workflow runs.
