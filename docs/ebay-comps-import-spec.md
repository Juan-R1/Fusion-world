# FusionMetrics Manual eBay Sold Comps Import Spec

## 1. Purpose

This document defines a safe manual CSV process for researching eBay sold comps
before FusionMetrics adds any automated eBay integration.

This is a spec only. It does not approve scraping, eBay API calls, importers,
generated artifacts, backend work, UI panels, alerts, or investment scoring.

## 2. Core Rule

Manual eBay comps are evidence, not truth. They must be source-linked,
variant-reviewed, raw/graded separated, and confidence-labeled before they can
influence any user-facing metric.

## 3. Proposed Staging Location

Future staging paths, not approved for creation yet:

```text
data-staging/ebay-comps/ebay-sold-comps.csv
data-staging/ebay-comps/README.md
```

Do not create these paths until the user approves fixture work. Do not write
manual comps directly into app data files.

## 4. CSV Columns

Recommended header:

```csv
listingId,cardCode,setCode,title,soldPrice,shipping,totalPrice,currency,soldDate,condition,rawOrGraded,gradeCompany,grade,variant,variantMatch,quantity,itemType,outlierFlag,confidence,sourceUrl,reviewer,reviewedAt,notes
```

## 5. Field Definitions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `listingId` | string | Yes | Stable eBay listing ID when available. If unavailable in manual research, use a documented placeholder pattern only in draft fixtures. |
| `cardCode` | string | Yes | Must match canonical card code or be routed to review. |
| `setCode` | string | Yes | Should match the card's set. |
| `title` | string | Yes | Raw listing title exactly enough for review. |
| `soldPrice` | number | Yes | Positive sale price excluding shipping unless eBay/source bundles it. |
| `shipping` | number | Recommended | Use `0` only if confirmed free/included; otherwise leave blank for review. |
| `totalPrice` | number | Recommended | `soldPrice + shipping` when both are known. |
| `currency` | string | Yes | ISO currency code, usually `USD` for first pass. |
| `soldDate` | ISO date | Yes | `YYYY-MM-DD`. |
| `condition` | string | Recommended | Raw condition text such as `Near Mint`; use `unknown` if unclear. |
| `rawOrGraded` | enum | Yes | `raw`, `graded`, `sealed`, or `unknown`. |
| `gradeCompany` | nullable enum | Required if graded | `PSA`, `BGS`, `CGC`, `TAG`, `other`, or blank for raw. |
| `grade` | nullable string | Required if graded | Preserve exact grade text, e.g. `10`, `9.5`, `Black Label`. |
| `variant` | enum/string | Yes | `base`, `altArt`, `manga`, `godRare`, `gdr`, `promo`, `reprint`, `foil`, `sealed`, `unknown`, or reviewed source wording. Variant vocabulary here is intentionally broader than `docs/sb-set-staging-spec.md` § 7 because eBay listings carry less structured variant metadata. `gdr` is lowercase to match the `godRare` / `altArt` style. |
| `variantMatch` | enum | Yes | `exact`, `likely`, `ambiguous`, `mismatch`, or `excluded`. |
| `quantity` | integer | Yes | Number of cards/products in the listing. Single-card comps should be `1`. |
| `itemType` | enum | Yes | `single`, `lot`, `sealed`, `gradedCard`, `bundle`, `proxyCustom`, `unknown`. |
| `outlierFlag` | boolean | Yes | `true` if sale should be excluded or reviewed separately. |
| `confidence` | enum | Yes | `high`, `medium`, `low`, or `excluded`. |
| `sourceUrl` | URL | Yes | Required for traceability. |
| `reviewer` | string | Recommended | Initials or agent name for manual review accountability. |
| `reviewedAt` | ISO date/time | Recommended | Review timestamp. |
| `notes` | string | Optional | Short caveat or match rationale. |

## 6. Allowed Enum Values

### `rawOrGraded`

- `raw`
- `graded`
- `sealed`
- `unknown`

### `variantMatch`

| Value | Meaning | Analytics use |
|-------|---------|---------------|
| `exact` | Card code, set, variant, condition class, and raw/graded state match. | Eligible. |
| `likely` | Strong match but one minor uncertainty remains. | Eligible with lower confidence. |
| `ambiguous` | Listing may mix base/promo/reprint/alt-art or raw/graded meaning. | Do not aggregate by default. |
| `mismatch` | Listing is probably a different card/variant. | Exclude. |
| `excluded` | Listing is intentionally excluded from analytics. | Exclude. |

### `confidence`

| Value | Meaning |
|-------|---------|
| `high` | Exact card and variant match, clean title, single item, source URL present, normal price context. |
| `medium` | Likely match with minor title/source ambiguity. |
| `low` | Useful research row but too ambiguous for direct pricing. |
| `excluded` | Not used in aggregates. |

### `itemType`

- `single`
- `lot`
- `sealed`
- `gradedCard`
- `bundle`
- `proxyCustom`
- `unknown`

## 7. Manual Research Query Strategy

Use normal public browsing only. Do not scrape. Do not bypass login, paywalls,
or platform controls.

Recommended query components:

- Exact card name.
- Exact card code.
- Set code and set name when useful.
- Variant/treatment keywords such as `alt art`, `manga`, `GDR`, `God Rare`,
  `promo`, `winner`, or `foil` only when they are source-backed.
- Raw/graded separation terms such as `PSA 10`, `BGS`, `CGC`, or `raw`.

Recommended exclusions:

- `lot`
- `proxy`
- `custom`
- `reprint` unless researching reprints intentionally
- `digital`
- `damaged`
- `played` when Near Mint comps are the target
- unrelated languages/regions unless intentionally studied

## 8. Matching Rules

Match in this order:

1. Exact card code in title or listing details.
2. Exact card name plus set/product context.
3. Variant/treatment match.
4. Raw vs graded state.
5. Condition.
6. Quantity.
7. Price sanity check against nearby comps.

Rules:

- If card code and title disagree, mark `variantMatch = ambiguous` or
  `mismatch`.
- If a listing mixes multiple cards, mark `itemType = lot` and
  `confidence = excluded` unless a single-card value is source-clear.
- If listing title says PSA/BGS/CGC/TAG, mark `rawOrGraded = graded` even if
  the card is otherwise the same.
- If base, promo, manga, or alt-art variants cannot be separated, mark
  `variantMatch = ambiguous`.
- If source images/details are not visible enough to verify the variant, do not
  use `high` confidence.

## 9. Raw vs Graded Separation

Raw and graded comps must never be aggregated together.

Raw comp eligibility:

- `rawOrGraded = raw`
- `quantity = 1`
- `itemType = single`
- `variantMatch` is `exact` or `likely`
- `confidence` is `high` or `medium`
- Not an outlier unless an outlier-specific metric is being computed

Graded comp eligibility:

- `rawOrGraded = graded`
- `gradeCompany` is present
- `grade` is present
- `quantity = 1`
- `variantMatch` is `exact` or `likely`
- `confidence` is `high` or `medium`

## 10. Outlier Rules

Set `outlierFlag = true` when:

- Sale price is materially far from nearby comparable sales.
- Listing title suggests bundle/lot value.
- Condition is damaged or unclear.
- Variant is ambiguous.
- Shipping dominates the total price.
- Auction appears suspicious, relisted, cancelled, or incomplete.
- The listing is a proxy/custom card.
- The sale is graded but the target metric is raw.

Outlier rows should remain traceable but excluded from default aggregates.

## 11. Initial Metrics Enabled Later

After manual fixtures and validators are approved, eligible rows can support:

- Median sold price.
- Trimmed mean sold price.
- Min/max after outlier exclusion.
- Last sold date.
- Sale count.
- 7d / 30d / 90d volume when enough observations exist.
- Source variance versus JustTCG.
- Low-volume flag.
- Variant ambiguity flag.
- Raw vs graded spread, only after graded spec is complete.

Do not compute buy/sell recommendations from these metrics.

## 12. Aggregation Rules

Default aggregate filters:

- Include only `confidence = high` or `medium`.
- Include only `variantMatch = exact` or `likely`.
- Exclude `outlierFlag = true`.
- Exclude `itemType` other than `single` for raw singles.
- Separate raw, graded, and sealed.
- Separate variants unless a written rule explicitly merges them.

If fewer than three eligible comps exist, label the result as thin data.

## 13. Source URL and Auditability

Every row needs a `sourceUrl`. If a source URL expires or becomes unavailable,
the row can remain as historical manual research only if:

- The original listing ID is present.
- The review date is present.
- Notes explain what was visible during review.
- The row is not promoted to `high` confidence without durable evidence.

## 14. Automation Later

Automation is not approved now.

Before any eBay API or automation work:

- Confirm official API availability and allowed use.
- Review ToS and rate limits.
- Define query volume limits.
- Validate manual CSV samples.
- Write variant matching rules.
- Write a dedicated validator.
- Get explicit user approval.

No scraping is approved by this document.

## 15. UI Integration Later

Potential future UI surfaces:

- CardDetail sold comps section.
- Source Confidence panel.
- Premium Chase Radar context.
- Watchlist source variance warnings.

Required UI caveats:

- Sold comps are historical observations, not guaranteed sale value.
- Thin data must be visible.
- Variant ambiguity must be visible.
- Raw and graded markets must be separated.
- Fees, taxes, shipping, and liquidity are not fully modeled unless explicitly
  stated.

## 16. Validation Requirements Before Import

A future CSV validator must check:

- Required headers exist.
- Required values are present.
- Numeric values are finite and non-negative or positive as appropriate.
- Dates are valid.
- Enums are valid.
- URLs are present for non-draft rows.
- `cardCode` exists in canonical card data or is routed to review.
- Graded rows include grade company and grade.
- Raw rows do not include graded fields.
- Excluded rows are not used in aggregates.
- Duplicate `listingId` rows are blocked unless a documented correction flow
  exists.

## 17. Stop Conditions

Stop eBay comps work if:

- The task requires scraping or API calls without approval.
- The task requires generated data edits before validator approval.
- Matching rules cannot separate variants.
- Raw and graded rows would be mixed.
- A metric would imply guaranteed sale value, profit, or investment advice.
- Source URLs are missing.
- A task requires backend/database work before trigger criteria are met.

Next safe task after this spec: `P2-007 Design source confidence scoring spec`.
