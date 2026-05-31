# FusionMetrics

**Live demo:** [fusion-metrics-jet.vercel.app](https://fusion-metrics-jet.vercel.app/)

A market-analytics dashboard for **Dragon Ball Super: Fusion World** built around a single operating principle:

> Make the dashboard unable to lie by accident.

Every price is sourced, every label is provenanced, every model heuristic is disclosed, and every speculative visual that couldn't be backed by real data has been removed.

---

## Why this exists

Most TCG analytics tools quietly fill the gaps between real data with synthetic gauges, RNG-derived "demand" scores, and projections framed as observations. That's fine for a toy; it's a problem for a tool collectors and investors might actually rely on.

FusionMetrics ships only what it can defend. When real data isn't available, the dashboard says so — explicitly, in the same UI where the real data lives.

## What's in the app

| Tab | What it shows | Honesty rail |
|-----|---------------|--------------|
| **Value Scanner** | All 1,258 cards across FB01–FB09 with market price, model price, delta, freshness | Estimated cards excluded from undervalued/overvalued rankings; live-priced cards carry a `LIVE` chip |
| **Pricing Model** | OLS regression scatter (real prices vs predicted) with R² and coefficient breakdown | Stale-value `charPremium` heuristic explicitly labeled |
| **Box EV** | Expected value per sealed box, ROI vs box cost, buy-singles comparison, top-cards-per-pack breakdown | Cautious copy; flags sets where rarity data is incomplete |
| **Watchlist** | Local browser portfolio tracker: quantity, entry price, current value, unrealized P/L, CSV export | localStorage only; no cloud sync; LIVE/EST chips and freshness on every row |
| **Methodology** | In-app explanation of every data source, every model limit, and every disclosure decision | The single source of truth for what the dashboard is and isn't |

## Data sources

| Source | What it gives us | Coverage | Refresh |
|--------|------------------|----------|---------|
| **JustTCG API** | Live market prices for FB01–FB09 | 1,156 of 1,258 cards | Weekly via GitHub Actions; 3-set ISO-week rotation to fit the free-tier quota |
| **JustTCG 30d history** | Real per-card price history | 1,156 cards × 30 days | Same workflow |
| **Bandai official card database** | Verified card metadata (name, rarity, character, set) | 1,157 of 1,258 cards | Monthly via Playwright scraper |
| **Premium metadata (reviewed)** | Character + rarity classifications driving collector badges | 169 of 1,258 cards (SCR + SR + Leader tier) | Operator-promoted via the sample-gate runbook; demotable in one command |
| **eBay Browse API** | *(pre-staged)* Recent listing prices, watchCount-derived demand, active-listing supply | (pending API credential approval) | Single Codex run unlocks the ingester per [`docs/ebay-ingester-prestage.md`](./docs/ebay-ingester-prestage.md) |

## Trust foundation — what makes this defensible

1. **Sample-gate contract.** Every data artifact carries `_isSample: true` until it's been operator-reviewed and promoted via the runbook. The UI loaders refuse sample-flagged artifacts and silently fall back to empty — the entire promotion path is documented in [`docs/sample-gate-promotion-runbook.md`](./docs/sample-gate-promotion-runbook.md).
2. **Split-shape data contract.** `src/livePrices.json` holds current prices only; `public/priceHistory30d.json` is lazy-fetched on demand; `public/priceUpdateLog.json` powers provenance. No single artifact can corrupt another.
3. **Coverage guards.** `scripts/verify-data.js` enforces nine invariants on every commit: absolute floor of 1,121 live-priced cards, per-set 90% floor against the prior count, raw/graded separation, no NaN prices, and more. CI runs this gate on every PR.
4. **No synthetic data anywhere visible.** The mulberry32 RNG and stored-value heuristics that previously drove "Demand" / "Supply Saturation" / "Art Hype" / "Desirability" gauges have been retired (see [`docs/decision-log.md`](./docs/decision-log.md) D-049). Surfaces that depended on those values will return when real signal lands via the eBay ingester.
5. **Provenance everywhere.** Per-card freshness badges, footer attribution, modal source breakdown, Methodology page disclosing R² = 0.32, smoothed UC base, extrapolated SPR, and single-source dependency on JustTCG.
6. **Reviewer attribution on every premium-metadata row.** Each badge cluster surfaces a `manualReviewOnly` chip so users see who classified the card.

## Architecture highlights

- **React 18 + Vite 5**, no CSS framework (inline styles + a single theme tokens module).
- **No backend, no database, no auth.** Static JSON served by Vercel; entire app is a deterministic build.
- **Deterministic pricing model.** OLS-fit rarity bases + character-premium coefficient; recalibrated quarterly against the latest 1,156-card sample.
- **20-case Vitest suite** wired into CI: covers data-trust invariants, Watchlist v1→v2 storage migration, sample-gate refusal, raw/graded comp separation, premium-badge surfacing rules, and provenance rendering.
- **Dependabot weekly scan** on npm + GitHub Actions.
- **47-entry decision log + 31-entry risk register.** Every design choice has a documented rationale and an expiry trigger that would justify revisiting it.
- **Multi-agent operating contract.** [`AGENTS.md`](./AGENTS.md) defines what every coding agent (Claude, Codex, etc.) must respect — forbidden language list, file boundaries, trust-contract rules, preflight requirements.

## Local setup

```bash
npm ci
npm run dev            # http://localhost:5173
npm run build          # production bundle at dist/
npm test               # 23 Vitest cases
node scripts/verify-data.js   # 9 invariants
```

## Repository layout

```
src/
├── tabs/              # one file per dashboard tab
├── components/        # presentational components (CardDetail, PremiumBadges, CompsPanel, ...)
├── lib/               # lazy-loaded artifact loaders with sample-gate
├── hooks/             # useWatchlist (localStorage v1→v2 migration), useIsMobile
├── data.js            # analytics core: rarity bases, β, predictedPrice formula
├── cardData.json      # generated artifact: card metadata
└── livePrices.json    # generated artifact: current prices (split-shape)

public/
├── priceHistory30d.json     # lazy-loaded real history
├── priceUpdateLog.json      # provenance metadata
└── premiumMetadata.json     # production-promoted premium metadata (169 cards)

scripts/
├── update-prices.js         # JustTCG rotation + coverage guard
├── verify-data.js           # 9-invariant CI gate
├── fetch-cards.js           # Bandai scraper merge
├── calibrate-model.js       # OLS regression for the pricing model
├── import-premium-metadata.js   # sample → production promotion path
├── validate-premium-metadata.js # schema validator
├── session-brief.sh         # SessionStart hook: situational awareness on every agent session
└── ...

docs/
├── decision-log.md          # 48 architectural decisions
├── risk-register.md         # 31 ranked risks, current status
├── methodology-review.md    # trust-disclosure spine
├── operator-handbook.md     # ready-to-paste Codex prompts for gated tasks
├── ebay-ingester-prestage.md   # § 7 prompt activates when API credentials land
├── sample-gate-promotion-runbook.md   # operator procedure
└── ...
```

## Current limitations (honest)

- **JustTCG is the single live-price source.** Methodology page discloses this explicitly. eBay Browse API ingester is pre-staged but waiting on credential approval.
- **No comps data yet.** The CardDetail "eBay Sold Comps" panel renders an awaiting-fixture state until the eBay ingester ships.
- **Premium-metadata coverage is 169 of 1,258 cards** (top-tier only). Lower-rarity tiers will be classified in future passes.
- **Box EV uses simplified pull-rate assumptions** for unverified sets. The model verdict copy reflects this caveat.
- **SPR rarity base is extrapolated**; UC base is smoothed; both are documented on the Methodology page.
- **No automated cross-source verification yet.** Operators run the manual spot-check protocol quarterly per [`docs/cross-source-spot-check-protocol.md`](./docs/cross-source-spot-check-protocol.md).
- **No accounts, no alerts, no cloud sync.** Watchlist is local-only.

## Roadmap (no promises, just direction)

- **eBay Browse API ingester.** Replaces manual comp research with automated weekly ingestion. Pre-staged; ships in a single Codex run when credentials drop.
- **Restoration of demand + supply surfaces.** Once real eBay watchCount + listing-count data exists, the gauges and Market Dynamics tab return — same UI, real inputs.
- **Set Rankings + Chase Radar tabs.** [Spec drafted](./docs/set-rankings-spec.md); implementation gated on operator approval.
- **Quarterly model recalibration.** Next due 2026-08-12.
- **Premium-metadata coverage expansion** to UC and lower tiers.
- **TCGplayer partner application** revisited after consistent traffic shows in Plausible.
- **Backend** when (and only when) one of the six Backend Trigger Checklist conditions actually fires.

## Acknowledgments

- **JustTCG** for the live-price API.
- **Bandai Card Games** for the official DBSFW card database.
- **Plausible** for privacy-respecting analytics.
- **Vercel** for the build + deploy pipeline.
- **Anthropic Claude + OpenAI Codex** for being honest collaborators on the trust contract.

## License

This is a personal portfolio project. Card art, character names, and the Dragon Ball franchise belong to Bandai / Toei Animation; FusionMetrics does not redistribute card images and renders icon fallbacks until a rights-cleared image source is approved.

---

*FusionMetrics is a research and analytics tool. It is not financial advice. Trading-card prices are volatile and uncorrelated with traditional investment instruments.*
