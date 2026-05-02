# FusionMetrics Sealed Products Spec

## 1. Purpose

This document defines how FusionMetrics should stage sealed product metadata
and sealed price references without changing current Box EV formulas or
overstating sealed-product investment conclusions.

This is a spec only. It does not approve sealed data fixtures, importers,
generated artifacts, UI changes, backend work, scraping, API calls, or EV
formula changes.

## 2. Core Rule

Sealed product prices are source-specific market references, not guaranteed
buy/sell values. Box EV remains approximate and variance-heavy.

## 3. Current Baseline

The current Box EV tab uses a user-entered box price and existing card prices.
It does not have an active sealed product data source. It also intentionally
uses simplified pull-rate assumptions and labels its outputs as approximate.

Phase 2 sealed product work should add source-backed product identity and price
references first. It should not change EV formulas until a separate task is
approved.

## 4. Proposed Staging Location

Future staging paths, not approved for creation yet:

```text
data-staging/sealed-products/sealed-products.csv
data-staging/sealed-products/README.md
```

Do not create these paths until fixture work is approved. Do not write sealed
products into app data files by hand.

## 5. Product Entity

Recommended CSV header:

```csv
productCode,setCode,productType,name,language,region,packCount,cardsPerPack,containsSetCodes,marketPrice,currency,source,sourceUrl,timestamp,condition,availability,confidence,reviewer,reviewedAt,notes
```

## 6. Field Definitions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `productCode` | string | Yes | Stable internal key, e.g. `FB01-BOOSTER-BOX-EN`. |
| `setCode` | nullable string | Recommended | Primary linked set when applicable. |
| `productType` | enum | Yes | `boosterBox`, `starterDeck`, `case`, `pack`, `bundle`, `premiumSet`, `other`. |
| `name` | string | Yes | Product display name. |
| `language` | nullable string | Recommended | Example: `EN`, `JP`, `unknown`. |
| `region` | nullable string | Optional | Example: `US`, `JP`, `EU`, `unknown`. |
| `packCount` | nullable integer | Recommended | Required for booster boxes when source-backed. |
| `cardsPerPack` | nullable integer | Recommended | Required when Box EV uses product context later. |
| `containsSetCodes` | semicolon string | Recommended | One or more set codes included in product. |
| `marketPrice` | nullable number | Recommended | Positive current sealed price when source-backed. |
| `currency` | string | Recommended | ISO currency code. |
| `source` | string | Recommended | Source name, e.g. JustTCG, TCGplayer, eBay manual, LGS manual. |
| `sourceUrl` | URL | Recommended | Required before active artifact use. |
| `timestamp` | ISO datetime | Recommended | Observation time. |
| `condition` | string | Optional | Sealed condition, e.g. `sealed`, `case fresh`, `damaged box`, `unknown`. |
| `availability` | enum | Optional | `available`, `sold`, `preorder`, `outOfStock`, `unknown`. |
| `confidence` | enum | Yes | `high`, `medium`, `low`, `unknown`, or `excluded`. |
| `reviewer` | string | Recommended | Manual review accountability. |
| `reviewedAt` | ISO datetime | Recommended | Review timestamp. |
| `notes` | string | Optional | Short caveat only. |

## 7. Product-Type Vocabulary

| Value | Meaning |
|-------|---------|
| `boosterBox` | Standard booster box for a set. |
| `starterDeck` | Starter deck product such as future SB products. |
| `case` | Sealed case containing boxes/decks. |
| `pack` | Single sealed booster pack. |
| `bundle` | Mixed product bundle. |
| `premiumSet` | Premium collection/product with special contents. |
| `other` | Reviewed product that does not fit above categories. |

Unknown product types should fail validation.

## 8. Product-Code Rules

Product codes should be stable, readable, and source-independent.

Suggested pattern:

```text
<SET_OR_PRODUCT>-<TYPE>-<LANG_OR_REGION>
```

Examples:

- `FB01-BOOSTER-BOX-EN`
- `FB01-BOOSTER-PACK-EN`
- `SB01-STARTER-DECK-EN`
- `FB03-BOOSTER-CASE-EN`

Rules:

- Do not reuse card codes as product codes.
- Do not collapse boxes, packs, cases, and starter decks into one product.
- If a product contains multiple sets, use a product-family code and list
  `containsSetCodes`.
- If language/region materially affects market price, keep separate products.

## 9. Source Rules

Acceptable first-pass source categories:

- Manual public product page review.
- JustTCG product page if available.
- TCGplayer product page if available and approved for manual reference.
- eBay sold comps only through the approved sold-comps process.
- Local game store/manual source only if notes clearly identify limitations.

Do not use random SEO blogs as product price sources. Do not scrape.

## 10. Confidence Rules

| Confidence | Requirements |
|------------|--------------|
| `high` | Exact sealed product, source URL, current timestamp, clear condition, source price is directly for that product. |
| `medium` | Product match is likely but one caveat exists, such as region/language uncertainty. |
| `low` | Useful research row but price/source/product match is ambiguous. |
| `unknown` | Product identity exists but no reliable price reference exists. |
| `excluded` | Bundle, damaged, wrong language/region, unclear product, suspicious listing, or not a sealed product. |

Hard blockers for `high`:

- Missing source URL.
- Missing timestamp.
- Product type mismatch.
- Region/language ambiguity when it affects price.
- Damaged/opened product.
- Bundle or lot contamination.

## 11. Box EV Integration Rules

Sealed product data may later improve Box EV UX, but must not silently change
meaning.

Potential future uses:

- Pre-fill selected set box price from source-backed sealed product price.
- Show sealed price freshness.
- Show source confidence for sealed input.
- Show multiple source-specific sealed prices when available.

Rules:

- Current Box EV pull assumptions must remain unchanged unless separately
  approved.
- If sealed product price is used, label the source and timestamp.
- If the user edits the box price, label it as user override.
- Do not imply opening a box has guaranteed expected value.
- Do not compare sealed products across languages/regions without caveats.

## 12. Starter Deck Integration Rules

Starter decks such as SB01/SB02 are not booster boxes.

Rules:

- Do not run booster-box EV formulas on starter decks.
- Starter deck products may have fixed contents or product-specific chase
  inserts; model only after source-backed contents are reviewed.
- Link starter deck sealed products to SB set staging, not to FB booster logic.
- Label product type clearly before any UI use.

## 13. Sealed Sold Comps vs Active Listings

Separate:

- Current listed/market price.
- Sold comps.
- Manual store price.
- User-entered price.

Active listings are not sold comps. Sold comps must go through the eBay/manual
comps process and should include sale date, source URL, and outlier review.

## 14. Validation Requirements

A future sealed-products validator must check:

- Required headers exist.
- Required fields are present.
- Product codes are unique.
- Product types use approved vocabulary.
- Linked `setCode` values exist or are staged.
- `containsSetCodes` values exist or are staged.
- Prices are finite positive numbers when present.
- Pack/card counts are positive integers when present.
- Dates/timestamps are valid.
- Source URL is present for non-draft priced rows.
- Confidence labels are valid.
- Hard blockers prevent `high` confidence.
- Starter decks are not marked as booster boxes.

## 15. UI Integration Later

Potential future UI:

- Box EV source-backed sealed price selector.
- Sealed product price freshness label.
- Set Detail sealed product summary.
- Watchlist sealed position support, only after Watchlist scope approval.

Required copy:

- "Sealed price source: [source], refreshed [date]."
- "Box EV is approximate and uses simplified pull assumptions."
- "User-entered box price overrides source reference."
- "Sealed prices do not include fees, taxes, shipping, liquidity, or variance."

## 16. Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Product mismatch | Box, case, pack, starter deck, and bundle prices differ. | Product-type validation and product codes. |
| Region/language mismatch | Same product may price differently by market. | Separate language/region fields. |
| Active listing confusion | Listings are not sold prices. | Separate source type and comps workflow. |
| Box EV overclaim | Sealed EV can invite fake precision. | Keep approximate labels and formulas unchanged. |
| Starter deck misuse | Starter decks are not booster boxes. | Product type rules and Box EV guardrails. |
| Damaged/opened product | Condition materially affects sealed price. | Condition/confidence/outlier rules. |

## 17. Stop Conditions

Stop sealed product work if:

- A task requires changing Box EV formulas without explicit approval.
- A task requires generated data edits before validators exist.
- A task requires scraping/API calls without approval.
- Product identity is ambiguous.
- Active listings would be treated as sold comps.
- Starter deck data would be run through booster-box logic.
- A task would imply sealed-product investment certainty.

Next safe task after this spec: `P2-010 Design validation guard plan for expanded data`.
