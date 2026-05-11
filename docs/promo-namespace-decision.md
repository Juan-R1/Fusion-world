# Promo / Event-Card cardCode Namespace Decision (Q-001)

**Decided:** 2026-05-11
**Decider:** Claude Code (lead agent), under operator's "take charge" mandate
**Status:** active
**Closes:** Q-001 in `docs/open-questions.md`

> This is a forward-looking namespace decision. No promo cards exist in
> `src/cardData.json` today. The decision below specifies how promos will be
> identified when they first land. The validator in `scripts/verify-data.js`
> will be updated **only** when a promo card is actually ingested, not
> preemptively.

## 1. The question

How are promotional cards, event cards, and winner-stamped cards identified
in the FusionMetrics data model? Specifically, what `cardCode` namespace
do they live in?

Four candidates were on the table per `docs/open-questions.md` Q-001:

1. **Under printed base cardCode** — promos share `cardCode` with a base
   card and are distinguished only by `treatment`.
2. **Separate `PR##` namespace** — every promo lives under a dedicated
   `PR01`, `PR02`, … set code.
3. **Per-set promo suffix** — promos tied to a base set get codes like
   `FB01-P001`.
4. **Alias table** — `cardCode` is one canonical key per card; aliases
   map external identifiers back to it.

## 2. Decision

**Three-tier scheme, decided in order of evaluation per card:**

### Tier 1 — Promo-treatment of an existing base card

If a promotional release is the **same card identity** (same character,
same printed text, same number) as an existing base card, with only the
treatment differing (e.g. winner-stamped foil overlay, tournament promo
foil, manga-style alt-treatment of the same card):

- **`cardCode` stays equal to the base card's `cardCode`.**
- Treatment is recorded via:
  - `premium_metadata.premiumFlags` from `docs/premium-metadata-schema.md`
    § 5 (`winnerPromo`, `eventPromo`, `altArt`, etc.), and
  - Per-row `variant` / `treatment` fields on comps entities
    (`ebay_sold_comps`, `graded_comps`).
- This is the dominant case for tournament-distributed and event-pack
  reprints.

### Tier 2 — Promo tied to a specific base set, distinct identity

If a promotional release is a **new card** but is unambiguously tied to a
specific base set (e.g. a release-event exclusive whose mechanics or
flavor references FB04 themes):

- **`cardCode` uses the per-set promo suffix pattern: `<SET>-P###`.**
- Examples: `FB01-P001`, `FB04-P012`, `SB02-P003`.
- `setCode` is the parent set (`FB01`, `FB04`, `SB02`).
- The `P` marker visibly separates the promo namespace from base
  numbering (`FB01-001` … `FB01-140`) so a row scanner can tell them
  apart without a separate field.

### Tier 3 — Standalone cross-set promo

If a promotional release belongs to a multi-set promo program that
isn't tied to a single base set (e.g. an organized-play series, a
quarterly winner program, a magazine insert series):

- **`cardCode` uses the dedicated `PR##` namespace: `PR<NN>-NNN`.**
- Examples: `PR01-001`, `PR02-015`.
- `setCode` is `PR<NN>`.
- The numbering inside `PR##` is internal to the promo program.

## 3. Rejected alternatives and why

- **Tier-1-only (everything as treatment of a base card).** Rejected
  because new promo-only card identities exist (entirely new card text /
  art with no base equivalent). Treatments cannot represent these.
- **Separate `PR##` namespace for all promos.** Rejected because
  set-tied promos lose their parent-set affiliation in any rankings or
  Box EV view. Per-set suffixes preserve the affiliation cheaply.
- **Per-set suffix for all promos (no `PR##` at all).** Rejected because
  cross-set programs would need an arbitrary anchor set, which is
  misleading.
- **Alias table.** Rejected as too heavy for current scope. Aliases add
  a join layer to every cardCode lookup, including `verify-data.js`
  invariants and the live-price `cardCode → marketPrice` map. The
  three-tier scheme above keeps lookups direct and uses
  `premium_metadata.premiumFlags` for the treatment dimension that
  aliases would have carried.

## 4. Validator implications (not yet implemented)

Today's `scripts/verify-data.js` invariant 5 requires
`/^FB0[1-9]$/`. When the first promo card ingests, that invariant must
be widened to:

```js
const SET_PATTERN = /^(FB0[1-9]|FB1\d|SB\d{2}|PR\d{2})$/
```

And invariant 2 (`cardCode` shape) should accept:

- `FB##-NNN`   (base FB cards, existing)
- `FB##-P###`  (set-tied promos)
- `SB##-NNN`   (base SB cards, future)
- `SB##-P###`  (set-tied SB promos, future)
- `PR##-NNN`   (standalone cross-set promos)

A regex covering all five shapes:

```js
const CARD_CODE_PATTERN = /^(FB|SB|PR)\d{2}-P?\d{3}$/
```

Validator changes are **out of scope** until at least one promo card is
in `src/cardData.json`. The decision above is the spec the validator
will be updated against when that time comes.

## 5. Premium-metadata interaction

When a promo card is ingested, the `premium_metadata` row should:

- Set `premiumFlags` to include the relevant treatment label from
  `docs/premium-metadata-schema.md` § 5:
  - `winnerPromo` — winner-stamped event promo.
  - `eventPromo` — event / tournament / release promo.
  - `serialized` — if numbered.
  - `manga` / `mangaAdjacent` / `godRare` / `gdr` / `altArt` — if the
    treatment matches one of those classes.
- Set `riskTags` to include `variantAmbiguity` if the promo can be
  confused with the base card on listing pages (Tier 1 case).
- Set `riskTags` to include `unverifiedTreatment` until the treatment
  source is officially confirmed.

## 6. Comps interaction

For `ebay_sold_comps` and `graded_comps`:

- `cardCode` must match the canonical scheme decided above.
- `variant` field captures the treatment label per row (
  `base`, `altArt`, `manga`, `eventPromo`, `winnerPromo`, etc.).
- `variantMatch` flags rows where the listing is ambiguous between the
  promo and the base card; those rows must not be aggregated into the
  base card's median.

## 7. Migration plan when first promos land

1. Update the SB / promo source list (likely `scripts/known-cards.json`
   or equivalent).
2. Update `scripts/verify-data.js` invariants per § 4 above.
3. Run `node scripts/verify-data.js` against the updated dataset.
4. Update `docs/decision-log.md` with the activation date and the
   validator commit SHA.
5. Update `data-staging/premium-metadata/sample.json` to include at
   least one example of each tier.
6. Update `docs/promo-namespace-decision.md` (this file) to record
   activation.

## 8. Open follow-ups

- The first SB ingestion will exercise Tier 2 (`SB##-NNN` base codes).
  Confirm at that point that the `P` marker for promos doesn't collide
  with anything Bandai publishes (e.g. a base SB card numbered
  `SB01-P01` would be a problem). If so, switch to `SB01-PR001` style;
  decision can be revisited then.
- Whether `winnerPromo` rows should ever inherit a `cardCode` from the
  base card or always get a distinct one. Current rule: distinct codes
  when the printed card is materially different; same code when only
  the stamp/foil overlay changes.

## 9. Cross-references

- `docs/open-questions.md` Q-001 — closed by this decision.
- `docs/decision-log.md` — D-036 entry added.
- `docs/premium-metadata-schema.md` § 5 — canonical premiumFlags vocab.
- `docs/sb-set-staging-spec.md` — SB-specific implications.
- `docs/ebay-comps-import-spec.md` § 6 — variant vocabulary for comps.
- `scripts/verify-data.js` — invariants that will need widening per § 4.
