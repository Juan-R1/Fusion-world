# FusionMetrics SB Set Staging Spec

## 1. Purpose

This document defines how FusionMetrics should stage SB01, SB02, and future
starter-deck style products before they become active app data.

This is a planning/spec artifact only. It does not approve edits to
`src/cardData.json`, generated price files, importers, UI badges, scraping,
backend work, or workflow changes.

## 2. Current Baseline

FusionMetrics currently covers FB01-FB09. The active generated card artifact is
`src/cardData.json`, and the active app assumes those generated cards are the
canonical card universe. Current prices and history are split:

- `src/livePrices.json` contains current JustTCG prices only.
- `public/priceHistory30d.json` contains real JustTCG 30d history.
- `public/priceUpdateLog.json` contains refresh metadata.

Starter sets are not active in the app yet. SB staging must start outside the
generated production data path.

## 3. Scope

In scope for the first SB staging pass:

- SB01 and SB02 set metadata.
- Starter-deck card identity and printed metadata.
- Card-code and set-code rules.
- Source requirements.
- Reprint, promo, and variant ambiguity flags.
- Validation requirements before any generated artifact exists.

Out of scope until later approval:

- Editing generated production JSON.
- JustTCG refreshes for SB sets.
- eBay/TCGplayer/PriceCharting comps.
- Premium badges in UI.
- Box EV formula changes.
- Backend/database work.
- Automated scraping.

## 4. Proposed Staging Location

Future staging paths, not approved for creation yet:

```text
data-staging/sb-sets/sets.csv
data-staging/sb-sets/cards.csv
data-staging/sb-sets/source-refs.csv
```

Keep these as staging inputs only until a validator and importer are approved.
Do not write directly to `src/cardData.json`.

## 5. Set-Code Rules

| Field | Rule |
|-------|------|
| `setCode` | Must be `SB` followed by two digits, e.g. `SB01`, `SB02`. |
| `productType` | Must be `starter`. |
| `setName` | Must match the printed/source-backed product name. |
| `releaseDate` | Use ISO `YYYY-MM-DD` when source-backed; otherwise `null`. |
| `expectedCardCount` | Use source-backed count when known; otherwise `null`. |
| `sourceRefs` | At least one source reference is required before activation. |

Validator implication: existing validators that only accept `FB01`-`FB09`
must be updated deliberately before SB cards can become active app data.

## 6. Starter Set Entity

Suggested staging row for `sets.csv`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `setCode` | string | Yes | `SB01`, `SB02`, etc. |
| `setName` | string | Yes | Printed starter deck/product name. |
| `productType` | enum[`starter`] | Yes | Keep separate from booster sets. |
| `releaseDate` | nullable ISO date | Recommended | Source-backed date only. |
| `expectedCardCount` | nullable integer | Recommended | Printed/source count if available. |
| `sealedProductCodes` | semicolon string | Optional | Links to sealed product spec later. |
| `sourceRefs` | semicolon string | Yes | URLs or stable source IDs. |
| `reviewStatus` | enum[`draft`, `reviewed`, `approved`] | Yes | Only `approved` can be imported later. |
| `notes` | string | Optional | Short caveats only. |

## 7. Starter Card Entity

Suggested staging row for `cards.csv`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cardCode` | string | Yes | Canonical code for FusionMetrics. Must be unique. |
| `sourceCardNo` | string | Recommended | Printed card number exactly as source shows it. |
| `setCode` | string | Yes | Must reference staged `sets.csv`. |
| `name` | string | Yes | Printed card name. |
| `rarity` | string | Yes | Preserve source rarity; validator will normalize later. |
| `rarityName` | string | Recommended | Human label if available. |
| `color` | nullable string | Recommended | Card color when applicable. |
| `type` | nullable string | Recommended | Battle, Leader, Extra, etc. |
| `traits` | semicolon string | Optional | Normalize to array later. |
| `character` | nullable string | Optional | `null` is valid for non-character cards. |
| `imageUrl` | nullable string | Optional | Rights/source must be documented before app use. |
| `isReprint` | boolean | Yes | True when the card reprints or closely repeats another card. |
| `originalCardCode` | nullable string | Optional | Required when `isReprint` is true and known. |
| `variant` | enum[`base`, `foil`, `altArt`, `promo`, `reprint`, `unknown`] | Yes | Use `unknown` instead of guessing. |
| `treatment` | nullable string | Optional | Source wording for foil/stamp/treatment. |
| `premiumCandidate` | boolean | Yes | Research hint only; not a premium badge. |
| `variantRisk` | enum[`none`, `low`, `medium`, `high`] | Yes | Risk that sources mix variants. |
| `sourceRefs` | semicolon string | Yes | At least one source reference. |
| `reviewStatus` | enum[`draft`, `reviewed`, `approved`] | Yes | Only `approved` can be imported later. |
| `notes` | string | Optional | Short rationale or caveat. |

## 8. Card-Code Assumptions

SB card codes must be treated as source-backed identifiers, not inferred from
existing FB patterns.

Rules:

- Preserve the printed source card number in `sourceCardNo`.
- Use `cardCode` as the canonical app key only after uniqueness review.
- Do not collapse starter-deck reprints into existing FB cards without an alias
  plan.
- If a starter card shares name/art/text with another card but has a distinct
  source number or treatment, keep it as a distinct staged row.
- If public market sources mix base, reprint, promo, or foil versions, mark
  `variantRisk = high`.

## 9. Rarity and Vocabulary Handling

SB sets may introduce rarity labels or product-specific notation that current
FB validators do not accept.

Staging rules:

- Preserve the source rarity text first.
- Do not force new rarities into the current FB rarity vocabulary.
- Add a validator vocabulary update only when the exact SB rarity values are
  source-backed.
- Treat `GDR`, `God Rare`, manga-style treatments, and starter-deck chase
  labels as premium metadata candidates, not automatic price signals.

## 10. Source Requirements

Every staged set and card row needs source references before activation.

Acceptable source categories:

- Official Bandai/card-list pages.
- JustTCG product/card pages if available.
- Product packaging or official PDF/checklist references.
- Manual review notes only for draft rows, not approved rows.

Do not use random SEO blogs as primary sources. Do not use eBay listing titles
as the only source for canonical card metadata.

## 11. Premium Metadata Link

SB staging may identify premium candidates, but it must not create active
premium claims.

Flow:

1. Stage SB card identity.
2. Mark `premiumCandidate` and `variantRisk` conservatively.
3. Add source-backed premium metadata later through the premium metadata
   process.
4. Only after validator approval can UI badges or filters consume the metadata.

Examples of possible future premium context:

- `starterDeckChase`
- `gogetaChase`
- `godRare`
- `gdr`
- `altArt`
- `mangaAdjacent`

These labels require the premium metadata schema and validator before UI use.

## 12. Validation Requirements Before Activation

Before any SB staging data can become a generated artifact, a validator must
check:

- `setCode` matches the approved SB pattern.
- Every card references a known staged set.
- `cardCode` is unique across staged and active cards.
- Required fields are non-empty.
- Dates are valid ISO dates or `null`.
- Rarity values are in an approved vocabulary or explicitly staged for review.
- Boolean fields are real booleans.
- `variant` and `variantRisk` use approved enums.
- Reprint rows include `originalCardCode` when known.
- Every approved row has source references.
- No row uses investment, profit, or hype-only language.

Activation also requires `node scripts/verify-data.js` to continue passing.

## 13. Import Path Recommendation

Recommended order:

1. Finish all Phase 2 specs.
2. Ask user approval for `P2-011` staging directory work.
3. Add README-only staging structure.
4. Add tiny SB fixture only after approval.
5. Add a dedicated SB staging validator.
6. Add importer only after fixture and validator are reviewed.
7. Generate a new artifact only after import behavior is deterministic.
8. Update app/data validators deliberately before UI consumption.

## 14. Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Set-code mismatch | Current app/validators are FB-focused. | Keep SB staged until validators are updated. |
| Reprint collision | Same card identity may exist across products. | Preserve source card number and reprint metadata. |
| Variant ambiguity | Market sources may mix base, foil, promo, and alt-art rows. | Use `variantRisk`; require source refs. |
| Rarity drift | SB products may use vocabulary not in FB data. | Preserve source rarity; update validator intentionally. |
| Image licensing | Card images need rights-safe source handling. | Treat image URLs as optional until image strategy exists. |
| Overclaiming chase value | Premium cards can invite investment certainty. | Use premium metadata and risk tags, not hype scores. |

## 15. Stop Conditions

Stop SB staging work if:

- A task requires editing generated JSON.
- A task requires running JustTCG or a workflow.
- A task requires scraping external sources.
- A task requires changing `scripts/verify-data.js` without explicit approval.
- A task requires inventing card codes, rarities, release dates, or chase
  labels without source support.
- A task would mix raw card identity with price/comps data.

Next safe task after this spec: `P2-006 Design manual eBay sold comps CSV spec`.
