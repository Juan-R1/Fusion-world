# FusionMetrics Graded Comps Spec

## 1. Purpose

This document defines how FusionMetrics should model graded-card sales and
grade context in Phase 2 without contaminating raw card prices or implying
guaranteed grading profit.

This is a spec only. It does not approve graded data fixtures, importers,
generated artifacts, backend work, UI panels, scraping, API calls, or grading
arbitrage features.

## 2. Core Rule

Raw and graded markets are different markets. They must be stored, validated,
aggregated, and displayed separately.

## 3. Proposed Staging Location

Future staging paths, not approved for creation yet:

```text
data-staging/graded-comps/graded-comps.csv
data-staging/graded-comps/README.md
```

Do not create these paths until fixture work is approved. Do not write graded
comps directly into app data files.

## 4. Relationship to eBay Sold Comps

Graded comps can be:

- Direct manual rows in a graded-specific CSV.
- A normalized view derived from `ebay_sold_comps` rows where
  `rawOrGraded = graded`.
- Manual research from other public sources if allowed and source-linked.

Rules:

- The same sale should not be counted twice across raw eBay comps and graded
  comps.
- If a graded sale originates from eBay, preserve the eBay `listingId` and
  `sourceUrl`.
- If a row cannot verify the card variant and grade company, use low confidence
  or exclude it.

## 5. CSV Columns

Recommended header:

```csv
compId,cardCode,setCode,title,company,grade,gradeNumeric,gradeLabel,salePrice,shipping,totalPrice,currency,saleDate,source,sourceUrl,listingId,condition,variant,variantMatch,populationKnown,populationCount,certNumberVisible,outlierFlag,confidence,reviewer,reviewedAt,notes
```

## 6. Field Definitions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `compId` | string | Yes | Stable internal ID. Can be source-prefixed, e.g. `ebay-1234567890`. |
| `cardCode` | string | Yes | Must match canonical card data or be routed to review. |
| `setCode` | string | Yes | Card's set/product code. |
| `title` | string | Yes | Raw listing/source title. |
| `company` | enum | Yes | `PSA`, `BGS`, `CGC`, `TAG`, or `other`. |
| `grade` | string | Yes | Preserve exact grade text from source. |
| `gradeNumeric` | nullable number | Recommended | Normalized numeric grade when clear, e.g. `10`, `9.5`. |
| `gradeLabel` | nullable string | Optional | Label such as `Gem Mint`, `Black Label`, `Pristine`. |
| `salePrice` | number | Yes | Positive sale price excluding shipping unless source bundles it. |
| `shipping` | number | Recommended | Use `0` only when confirmed free/included. |
| `totalPrice` | number | Recommended | `salePrice + shipping` when both are known. |
| `currency` | string | Yes | ISO currency code. |
| `saleDate` | ISO date | Yes | Sale date. |
| `source` | enum/string | Yes | eBay, PriceCharting, manual, auction house, other. |
| `sourceUrl` | URL | Yes | Required for traceability. |
| `listingId` | nullable string | Recommended | Source listing ID when available. |
| `condition` | string | Optional | Usually implied by grade; preserve source text if present. |
| `variant` | enum/string | Yes | Base, manga, altArt, promo, reprint, GDR, unknown, etc. |
| `variantMatch` | enum | Yes | `exact`, `likely`, `ambiguous`, `mismatch`, or `excluded`. |
| `populationKnown` | boolean | Yes | Whether a population count is source-backed. |
| `populationCount` | nullable integer | Optional | Source-backed population count for this card/company/grade if known. |
| `certNumberVisible` | boolean | Recommended | Whether the cert number was visible enough for review. |
| `outlierFlag` | boolean | Yes | True when sale should be excluded/reviewed separately. |
| `confidence` | enum | Yes | `high`, `medium`, `low`, or `excluded`. |
| `reviewer` | string | Recommended | Manual review accountability. |
| `reviewedAt` | ISO datetime | Recommended | Review timestamp. |
| `notes` | string | Optional | Short caveat or rationale. |

## 7. Grade Company Vocabulary

| Value | Meaning | Notes |
|-------|---------|-------|
| `PSA` | Professional Sports Authenticator | Preserve exact PSA grade. |
| `BGS` | Beckett Grading Services | BGS subgrades/Black Label need notes when visible. |
| `CGC` | Certified Guaranty Company | Preserve exact label wording. |
| `TAG` | TAG Grading | Preserve grade text and source context. |
| `other` | Other grading company | Usually lower confidence unless source is reviewed. |

Unknown company values should fail validation.

## 8. Grade Normalization

Normalization helps filtering but must not erase source wording.

Rules:

- Preserve `grade` exactly as shown.
- Use `gradeNumeric` only when unambiguous.
- Use `gradeLabel` for non-numeric distinctions such as `Black Label`.
- Do not compare BGS 10, PSA 10, CGC 10, and TAG 10 as identical markets
  without caveats.
- Treat subgrade-dependent labels as separate context when visible.

Examples:

| Source grade | `gradeNumeric` | `gradeLabel` |
|--------------|----------------|--------------|
| `PSA 10 Gem Mint` | `10` | `Gem Mint` |
| `BGS 10 Black Label` | `10` | `Black Label` |
| `BGS 9.5 Gem Mint` | `9.5` | `Gem Mint` |
| `CGC Pristine 10` | `10` | `Pristine` |
| `TAG 10` | `10` | `null` |

## 9. Variant and Treatment Rules

Graded cards are especially vulnerable to variant mismatch.

Rules:

- Exact card code or visible card details should support `variantMatch = exact`.
- Listing title alone is not enough for high confidence on manga, GDR, promo,
  winner-stamped, alt-art, or reprint variants.
- If the slab image or listing details are unclear, use `ambiguous` or `low`.
- Do not aggregate base and alternate-art graded sales.
- Do not aggregate promo/event variants with base set variants unless a written
  source rule proves they are the same card market.

## 10. Population Data

Population reports are useful but not required for first graded comps.

Rules:

- Use `populationKnown = false` unless a source-backed count was reviewed.
- Population counts must be tied to company, card, variant, and grade.
- Population counts can become stale; include source date in notes when known.
- Do not infer scarcity from absence of population data.
- Do not claim grade rarity unless population data supports it.

## 11. Confidence Rules

| Confidence | Requirements |
|------------|--------------|
| `high` | Exact card/variant match, grade company and grade clear, single card sale, source URL present, normal price context. |
| `medium` | Likely match with one minor uncertainty such as incomplete image or title wording. |
| `low` | Useful research row but too ambiguous for aggregates. |
| `excluded` | Mismatch, lot/bundle contamination, proxy/custom, unclear source, cancelled/suspicious sale, or raw/graded confusion. |

Hard blockers for `high`:

- Variant ambiguity.
- Missing source URL.
- Missing grade company.
- Missing grade.
- Mixed lot/bundle.
- Proxy/custom listing.
- Raw card listed as graded or vice versa.

## 12. Outlier Rules

Set `outlierFlag = true` when:

- Price is far outside comparable sales for same card/company/grade.
- Listing includes multiple cards or extras.
- Sale appears cancelled, relisted, suspicious, or non-standard.
- Shipping or fees dominate total price.
- Variant is unclear.
- Condition/slab state is damaged or altered.
- Grade company is obscure and not comparable.

Outlier rows should be excluded from default aggregates but retained for audit.

## 13. Metrics Enabled Later

After fixtures and validators are approved, graded comps may support:

- Median sale price by card/company/grade.
- Trimmed mean by card/company/grade.
- Last sold date.
- Sale count.
- 30d / 90d volume where enough comps exist.
- Raw-to-graded spread, only when raw comps exist.
- Grade premium by company.
- Population-aware caveat labels.

Do not show grade-upside as guaranteed profit.

## 14. Raw-to-Grade Spread Rules

If raw-to-grade spread is ever calculated:

- Use source-backed raw median and graded median.
- Separate grade company and grade.
- Include estimated grading fees only as labeled assumptions.
- Do not assume the submitted raw card will receive the target grade.
- Caveat shipping, taxes, marketplace fees, grading fees, turnaround time,
  liquidity, rejection risk, and grade uncertainty.

Safe copy:

"Modeled raw-to-grade spread uses reviewed raw and graded comps. It does not
predict the grade a specific card will receive."

Unsafe copy:

"Guaranteed grading profit."

## 15. Validation Requirements

A future graded-comps validator must check:

- Required headers exist.
- Required fields are present.
- `cardCode` exists or is routed to review.
- Grade company vocabulary is valid.
- Grade and company are present for every non-excluded row.
- Numeric prices are finite and positive.
- Dates are valid.
- Source URL is present for non-draft rows.
- `variantMatch` and `confidence` are valid.
- `populationCount` is an integer when present.
- `populationKnown = true` requires `populationCount`.
- Hard blockers prevent `high` confidence.
- Duplicate source/listing IDs are blocked unless correction flow exists.

## 16. UI Integration Later

Potential future UI:

- CardDetail graded comps panel.
- Raw vs graded spread section.
- Premium card grade context.
- Watchlist grade-upside research note.

UI requirements:

- Keep graded data separate from raw price.
- Show grade company and grade.
- Show source confidence and variant ambiguity.
- Label population data as source-specific and potentially stale.
- Avoid buy/sell recommendations.

## 17. Stop Conditions

Stop graded-comps work if:

- Raw and graded markets would be mixed.
- Variant matching is unclear.
- Source URL or grade fields are missing.
- A task requires scraping/API calls without approval.
- A task requires generated data edits before validators exist.
- A task would imply guaranteed grading returns.
- A task requires backend/database work before trigger criteria are met.

Next safe task after this spec: `P2-009 Design sealed products spec`.
