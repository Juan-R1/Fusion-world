# Cross-Source Spot-Check Protocol (P3-007)

**Created:** 2026-05-12
**Status:** Active operator protocol. No agent API calls. Runs entirely
on operator action.
**Closes:** P3-007 in `docs/phase-3-execution-checklist.md`. Mitigates
R-018 (single-source dependency on JustTCG) at the smallest possible
operational cost.

> **What this is:** a 30-minute manual procedure the operator runs
> approximately quarterly to confirm JustTCG's prices are not
> systematically biased against the rest of the secondary market. It
> produces one dated `docs/cross-source-spot-check-YYYY-MM-DD.md`
> report each time it runs.
>
> **What this is NOT:** an API integration, a scraper, a UI surface,
> or a hard requirement before public beta. The trust contract
> already discloses single-source dependency on JustTCG via the
> Methodology page; this protocol just gives the operator a
> repeatable way to spot-check that disclosure remains accurate.

## 1. Why this exists

`docs/risk-register.md` R-018 records FusionMetrics' structural
single-source dependency on JustTCG for live prices and 30d history.
The Methodology page discloses this honestly. But "we depend on
JustTCG" is only acceptable if JustTCG's prices stay reasonably
aligned with the broader secondary market. A 30%+ systematic bias
would make every delta on the dashboard misleading.

`docs/decision-log.md` D-041 commits to manual eBay as the first
cross-source data path, but production eBay comps don't exist yet
(P3-011 is operator-only). Until then, the spot-check is the only
defense against silent JustTCG drift.

## 2. When to run

Run this protocol when any of these triggers fires:

1. **Quarterly cadence**: every 90 days, regardless of signal.
   Next-due date: 2026-08-12 (90 days after this doc landed).
2. **After any JustTCG schema or pricing-engine change** flagged in
   their changelog or X account.
3. **Before any external-facing demo** (recruiter, investor,
   community share) where price accuracy is part of the credibility
   story.
4. **If `verify-data.js` ever rejects a refresh for coverage drop
   without obvious API failure** — that may indicate a JustTCG
   data-quality regression.

## 3. Sample selection

Pick **10 cards** following this rule, in this order. Do not
substitute. The sample is small but stratified so a 1-card outlier
doesn't poison the read.

| # | Card profile | Why |
|---|--------------|-----|
| 1 | One **Common** (C) from FB01–FB03 | High-volume, low-noise baseline |
| 2 | One **Common** (C) from FB07–FB09 | Recent set baseline |
| 3 | One **Uncommon** (UC) | UC rarity is smoothed in the model; cross-check the smoothing |
| 4 | One **Rare** (R) | Mid-volume sanity check |
| 5 | One **Super Rare** (SR) — non-chase | Mid-tier confidence anchor |
| 6 | One **Super Rare** (SR) — Goku / Vegeta / Gohan | Hero-character premium check |
| 7 | One **Secret Rare** (SCR) — Goku-line | Top-tier chase card |
| 8 | One **Secret Rare** (SCR) — non-Goku-line | Verifies premium isn't only Goku-driven |
| 9 | One **SPR** if any exist on TCGplayer | Validates the SPR extrapolation in `src/data.js` |
| 10 | One **promo** with a verified `cardCode` | Verifies promo-namespace D-036 alignment |

If a tier has no card with cross-source coverage (e.g. SPR), note
"skipped — no cross-source data" in the report rather than substituting
out of band.

## 4. Sources to consult

Two external sources, plus FusionMetrics for the comparison anchor.
**Do not scrape. Read prices visually from the source's website.**

1. **TCGplayer market price** — visit `tcgplayer.com`, search by card
   name + set code, capture the displayed "Market Price" for a
   Near-Mint copy.
2. **PriceCharting** — visit `pricecharting.com`, search by card name
   + set, capture the loose/ungraded market price for the closest
   variant match.
3. **FusionMetrics anchor** — open the production URL, look up the
   card by `cardCode`, capture `marketPrice` from the CardDetail
   panel.

If a card is unlisted on TCGplayer or PriceCharting, document that
explicitly. Absence is a finding.

## 5. Variance bands (mirroring D-037)

For each card, compute:

```
variance = (max - min) / median across the 3 prices
```

Then bucket by D-037's per-rarity bands:

| Rarity median price | aligned | mixed | disagree |
|---------------------|--------:|------:|---------:|
| < $1.00 | < 30% | 30–60% | > 60% |
| $1.00 – $4.99 | < 25% | 25–50% | > 50% |
| $5.00 – $19.99 | < 20% | 20–40% | > 40% |
| $20 – $99.99 | < 15% | 15–35% | > 35% |
| ≥ $100 | < 10% | 10–25% | > 25% |

A card is **flagged** if it lands in `disagree`. Flagged cards
require a one-line investigation note: variant ambiguity, listing
freshness, regional currency confusion, or a real bias signal.

## 6. Result interpretation

- **0–1 flagged out of 10**: pass. R-018 stays "monitored." Next
  spot-check on cadence.
- **2–3 flagged out of 10**: caution. Open a tracked item under
  `docs/risk-register.md` R-018 with the flagged cards listed.
  Re-run in 30 days, not 90.
- **4+ flagged out of 10**: structural issue. Stop deferring the
  multi-source ingestion. The first concrete action is to start
  the P3-011 first-real-eBay-comps fill so D-041 cross-source
  comparison becomes possible. Update
  `docs/operator-handbook.md` to surface the finding.

## 7. Report format

Save each run to a fresh file named
`docs/cross-source-spot-check-YYYY-MM-DD.md`. Use this template:

```markdown
# Cross-Source Spot-Check — YYYY-MM-DD

**Operator:** <name or handle>
**Protocol version:** see `docs/cross-source-spot-check-protocol.md` § 3
**Result:** PASS / CAUTION / STRUCTURAL

## Sample
| # | cardCode | Rarity | TCGplayer | PriceCharting | FusionMetrics | Variance | Band | Flag |
|---|----------|--------|----------:|--------------:|--------------:|---------:|------|------|
| 1 | …        | …      |       … |          … |          … |     …% | …    | …    |
| … | …        | …      |       … |          … |          … |     …% | …    | …    |

## Flagged cards
- `<cardCode>` — <one-line investigation note>

## Decision
<which result-bucket from § 6, with the next action and date>

## Notes
- Anything else worth recording (variant matching difficulty, listing
  freshness gaps, source coverage holes).
```

## 8. What this protocol does NOT do

- Run any API call automatically.
- Scrape TCGplayer, PriceCharting, eBay, or Cardmarket.
- Modify production artifacts.
- Affect verify-data.js or any guard.
- Change the model constants. (Recalibration is its own protocol;
  D-031.)
- Substitute for real cross-source ingestion. Once D-041 produces
  real eBay comps in production, this manual protocol can be
  downgraded from quarterly to semi-annually.

## 9. Connection to the trust contract

- D-014 (only show real data): the spot-check verifies the "real
  data" we show isn't quietly biased.
- D-041 (manual eBay first sold-comp source): the spot-check is the
  bridge until D-041 produces production data.
- D-037 (cross-source variance thresholds): the spot-check uses the
  same bands so a future automated ingestion can compare against
  the manual baseline.
- R-018 (single-source dependency): the spot-check is the
  documented residual-risk mitigation.

## 10. First run

The first spot-check has **not** been performed. The protocol is
ready; the operator runs it when ready and publishes the report.
After the first run, update this file's § 2 ("When to run") with
the actual next-due date.

## 11. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-12 | Initial protocol | Closes P3-007 in the Phase 3 checklist. |
