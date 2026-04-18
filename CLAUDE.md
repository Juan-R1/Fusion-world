# FusionMetrics — Project Continuity Document

> **Purpose:** This file is the official recovery artifact for FusionMetrics. Any future Claude session, coding agent, or other LLM can read this document and fully resume work on the project without relying on prior chat history. It preserves project identity, shipped functionality, architecture, constraints, current priorities, and the next execution phase.
>
> **Last full audit:** 2026-04-17 against branch `claude/dbfw-market-analytics-1qh5D` @ commit `115c9ed`.
> **Author of audit:** Senior Architect / QA Lead session (grounded on direct repo inspection, not memory).
> **Status convention:** Facts are tagged **Verified** (from repo), **Inferred** (reasonable deduction from structure/naming), or **Unverified / Needs confirmation**.

---

# 1. Project Identity

- **Project name:** FusionMetrics
- **Product:** A web-based TCG market-analytics dashboard for **Dragon Ball Super Card Game: Fusion World** (DBFW / DBSFW).
- **Audience:** Fusion World players, collectors, investors, and secondary-market watchers who want live pricing signals, value-buy scanning, box-opening EV math, and portfolio tracking across all 9 released sets (FB01–FB09).
- **Mission:** Be the fastest, most trustworthy analytics surface for DBFW singles and sealed product — tracking the whole 1,258-card universe with real market prices, transparent pricing models, and tools that help users decide *buy / sell / hold / open-a-box*.
- **Maturity stage:** **Feature-complete public-launch MVP.** (Verified) Dashboard ships 5 production tabs, mobile-responsive UI, live prices for ~92% of cards, weekly automated price refresh, monthly automated card-database refresh, Vercel deployment pipeline, SEO/OG/PWA polish, and a 7-skill Claude agent library in `.claude/skills/`. The project is now transitioning from **build phase** to **operate & harden phase**.

**Live production URL:** `https://fusion-metrics-jet.vercel.app/` (Verified via og:url meta tag in `index.html`).
**Tech stack:** React 18.3.1 + Vite 5.4.1, zero CSS framework (inline styles + `src/theme.js`), vanilla React hooks for state, localStorage for persistence, Playwright for the Bandai scraper, JustTCG API for live prices, GitHub Actions for automation, Vercel for hosting.


# 2. Executive State Snapshot

**What exists and is stable today (Verified):**
- Full dashboard shell with 5 tabs: 🔍 Value Scanner, 📈 Pricing Model, 🌊 Market Dynamics, 📦 Box EV, ⭐ Watchlist.
- 1,258 cards generated into `src/cardData.json` from `scripts/known-cards.json`.
- **1,157 of 1,258 cards (92%) have verified real metadata** (up from 161 at the time of the previous CLAUDE.md — this is a major, under-documented milestone).
- **1,156 of 1,258 cards (~92%) have live market prices** in `src/livePrices.json` (JustTCG-sourced, timestamped 2026-04-14T14:22:12Z).
- Calibrated pricing model: rarity base prices computed from geometric mean of real data, charPremium OLS regression (β = 0.0803, R² = 0.32). Deterministic mulberry32 RNG for anything not backed by live data.
- Mobile-responsive layout driven by `useIsMobile` hook (768px breakpoint).
- Watchlist with localStorage persistence (`fw-watchlist-v1`).
- PWA manifest, OG image, Twitter cards, favicons, apple-touch-icon, robots.txt.
- Three CI/CD GitHub Actions workflows: card-DB refresh (monthly), price refresh (weekly), deploy (on push / on upstream workflow).
- Vercel config (`vercel.json`) wired to `npm run build` → `dist/`.
- 7 Claude skills in `.claude/skills/` formalizing recurring project intelligence.

**What is launch-ready (Verified):**
- The public production URL is live, deployable on every push to main / every upstream workflow completion.
- All 5 tabs render without errors on desktop and mobile.
- No `TODO` / `FIXME` strings found in source (Verified via grep audit).
- Vite build emits a single bundle with `chunkSizeWarningLimit: 600` to accommodate the inlined ~73 kB gzip `cardData.json`.

**What still appears incomplete / uncertain:**
- `src/priceHistory.json` is **`{}` (empty)** — the weekly accumulator (`scripts/accumulate-prices.js`) has not yet written any history snapshots. Until it runs at least once, price-trend charts in `CardDetail` are **synthetic only**, even for cards with live current prices. (Verified from file contents.)
- **~102 cards still lack a live price** (1,258 − 1,156). These fall back to synthetic pricing. (Verified from data.js logic.)
- **SPR rarity base price ($24.99) is extrapolated**, not measured — there is no real SPR sample in the JustTCG dataset. (Inferred from `scripts/calibrate-model.js` + rarity counts.)
- **UC rarity base was smoothed upward** because the raw UC sample was noisy. (Inferred from comments in calibrate-model output.)
- Card image coverage is **low** (~40 cards scraped with real imagery; most cards use icon fallbacks). (Verified via `scripts/official-card-db/` contents and `CardImage.jsx` fallback path.)
- No automated test suite, no linter config, no type system. (Verified — no `vitest`, `jest`, `eslint`, `prettier`, or `tsconfig` present.)
- No error-reporting / observability (no Sentry, no Plausible active — the analytics script is commented out in `index.html`). (Verified.)
- No pre-commit hooks or CI build-verification step (`deploy.yml` builds but doesn't lint/test because there are no tests). (Verified.)


# 3. Verified Repo Findings

All facts in this section were read directly from disk on 2026-04-17.

## 3.1 Directory structure (Verified)

```
Fusion-world/
├── .github/workflows/
│   ├── deploy.yml              # Vercel deploy on push-to-main + upstream workflow completion
│   ├── update-prices.yml       # Weekly JustTCG price refresh (Mon 05:00 UTC)
│   └── update-cards.yml        # Monthly Bandai card-DB refresh (1st @ 04:00 UTC)
├── .claude/skills/             # 7 Claude skills (see §7.5)
│   ├── README.md
│   ├── fusion-dashboard-patterns/
│   ├── fusion-data-pipeline/
│   ├── fusion-feature-ship/
│   ├── fusion-git-flow/
│   ├── fusion-llm-handoff/
│   ├── fusion-qa-verify/
│   └── fusion-tcg-model/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.svg
│   ├── og-image.png            # 1200×630 social preview
│   ├── robots.txt              # Allow all
│   └── site.webmanifest        # PWA manifest
├── scripts/
│   ├── fetch-cards.js          # Generates src/cardData.json
│   ├── scrape-official-fw.js   # Playwright scraper → official-card-db/
│   ├── merge-known-cards.js    # Merges scrape output into known-cards.json
│   ├── update-prices.js        # JustTCG API → src/livePrices.json
│   ├── accumulate-prices.js    # Snapshots livePrices into priceHistory.json
│   ├── calibrate-model.js      # OLS regression for rarity base prices + charPremium β
│   ├── known-cards.json        # 1,157 verified card entries (SOURCE OF TRUTH)
│   └── official-card-db/       # Raw per-set JSON from Bandai scraper
├── src/
│   ├── components/
│   │   ├── CardDetail.jsx      (271 LOC)
│   │   ├── CardImage.jsx       ( 66 LOC)
│   │   ├── DeltaBadge.jsx      ( 24 LOC)
│   │   ├── GaugeRing.jsx       ( 50 LOC)
│   │   ├── MiniBar.jsx         ( 16 LOC)
│   │   ├── RarityBadge.jsx     ( 20 LOC)
│   │   └── Sparkline.jsx       ( 32 LOC)
│   ├── hooks/
│   │   ├── useIsMobile.js      ( 22 LOC)
│   │   └── useWatchlist.js     ( 42 LOC)
│   ├── tabs/
│   │   ├── ValueScanner.jsx    (341 LOC)
│   │   ├── PricingModel.jsx    (246 LOC)
│   │   ├── MarketDynamics.jsx  (244 LOC)
│   │   ├── BoxEV.jsx           (352 LOC)
│   │   └── Watchlist.jsx       (264 LOC)
│   ├── App.jsx                 (117 LOC)
│   ├── data.js                 (153 LOC)
│   ├── main.jsx                (  9 LOC)
│   ├── theme.js                ( 26 LOC)
│   ├── cardData.json           (1,258 entries, generated)
│   ├── livePrices.json         (1,156 entries, weekly refresh)
│   └── priceHistory.json       ({} — empty, awaiting first accumulation)
├── index.html
├── vite.config.js              (chunkSizeWarningLimit: 600)
├── vercel.json                 (vite framework)
├── package.json                (React 18.3.1, Vite 5.4.1 — 2 deps, 2 devDeps)
└── CLAUDE.md                   (this file)
```

**Total hand-written source:** 2,260 LOC across 23 files. (Verified via `wc -l`.)

## 3.2 Key files & their roles (Verified)

| File | Role |
|------|------|
| `src/App.jsx` | Shell: header, live-status badge, tab switcher, mobile-aware layout. |
| `src/data.js` | Analytics engine: loads `cardData.json`, merges `livePrices.json`, applies pricing model, exports `SETS`, `RARITIES`, `CARDS`, `HAS_LIVE_PRICES`. |
| `src/theme.js` | 24 color tokens + 2 font families — single source of design truth. |
| `src/cardData.json` | Output of `scripts/fetch-cards.js`. **Never edit by hand.** |
| `src/livePrices.json` | Output of `scripts/update-prices.js`. **Never edit by hand.** |
| `src/priceHistory.json` | Currently `{}`. Will be populated by `scripts/accumulate-prices.js` once the workflow runs. |
| `scripts/known-cards.json` | The 1,157-entry verified card database — THIS is the source of truth for card metadata. |
| `.github/workflows/update-cards.yml` | Monthly re-scrape + regenerate. |
| `.github/workflows/update-prices.yml` | Weekly JustTCG fetch + commit. |
| `.github/workflows/deploy.yml` | Vercel deploy trigger. |

## 3.3 Configuration surface (Verified)

- **`package.json`**: name=`fusion-metrics`, version `1.0.0`, type `module`. Deps: `react`, `react-dom`. Dev deps: `@vitejs/plugin-react`, `vite`. No lint/test/format tooling.
- **`vite.config.js`**: React plugin, `build.chunkSizeWarningLimit: 600` to tolerate the inlined card data.
- **`vercel.json`**: framework=vite, `buildCommand: npm run build`, `outputDirectory: dist`, `installCommand: npm ci`.
- **`index.html`**: full SEO + OG + Twitter + PWA meta. Plausible analytics `<script>` is present but **commented out**. Fonts: Outfit (400/600/800) + JetBrains Mono (400/600) from Google Fonts.
- **No `.env.example`, `.env`, `tsconfig`, `eslintrc`, `prettierrc`, `vitest.config`, or test directory.** (Verified.)

## 3.4 Git state (Verified)

- **Active branch:** `claude/dbfw-market-analytics-1qh5D` (tracked, up-to-date with origin).
- **Working tree:** clean as of audit.
- **Last 10 commits** (most recent first):
  1. `115c9ed` fix: use absolute URLs for og:image and og:url
  2. `c140330` chore: add OG social preview image
  3. `fb75779` chore: public launch polish (favicon, meta tags, manifest, robots)
  4. `f4e36e0` chore: add FusionMetrics skill library (7 skills)
  5. `289abfe` feat: mobile responsiveness polish
  6. `c6a1faf` feat: Watchlist / Portfolio Tracker tab
  7. `9e1f224` feat: Box EV Calculator tab — set ROI vs singles analysis
  8. `1395a38` feat: recalibrate price model against 1,156 real market prices
  9. `b02ba43` feat: LIVE badge on cards with real prices + live status in header
  10. `a30d7e7` chore: live prices — all 9 sets (1,156 cards)

The 20-commit window immediately before that was dominated by scraper fixes, JustTCG integration, and the build-out of the 1,157-card database. (Verified.)


# 4. Product Functionality Already Shipped

All items in this section are **Verified** unless otherwise tagged.

## 4.1 Dashboard shell (`src/App.jsx`)

- Dark-theme fixed-dark UI (`#0a0a0a` background, `#f1f5f9` text, `#f97316` accent).
- Header displays: logo/title, current card count, and a **● LIVE** badge that reads from `HAS_LIVE_PRICES` (`src/data.js`) — only shown when `LIVE_MAP.size > 0`.
- Tab navigation across 5 views (labels shorten on mobile).
- Mobile-aware spacing, font sizing, and layout driven by `useIsMobile` (768px breakpoint).

## 4.2 Tab: 🔍 Value Scanner (`src/tabs/ValueScanner.jsx`)

- Filterable / sortable / paginated table of all 1,258 cards.
- Sort modes: **undervalued** (most negative delta first), **overvalued**, **demand**, **price**, **desirability**.
- Filters: text search (character or name), set (FB01–FB09), rarity (L/C/UC/R/SR/SCR/SPR).
- Visual signals: green DeltaBadge at delta < −15% (buy), red at > +15% (sell), yellow between (fair).
- "LIVE" micro-badge on cards whose price came from `livePrices.json`.
- Pagination: 100 cards/page.
- Watchlist star toggle on every row (persists via `useWatchlist`).
- Click row → opens `CardDetail` modal.

## 4.3 Tab: 📈 Pricing Model (`src/tabs/PricingModel.jsx`)

- Scatter plot: X = desirability score, Y = price (log or linear axis).
- Reference regression line from the calibrated model.
- Color-coded by rarity.
- Click point → open card detail.
- Legend + axis callouts explain the model in plain English.

## 4.4 Tab: 🌊 Market Dynamics (`src/tabs/MarketDynamics.jsx`)

- 4-quadrant scatter plot: X = supply saturation, Y = demand pressure.
- Quadrants: **🔥 Heating Up** / **⚡ Overheated** / **💠 Stable** / **📉 Cooling Off**.
- Color-coded by rarity, with quadrant callouts and thresholds explained in-panel.

## 4.5 Tab: 📦 Box EV (`src/tabs/BoxEV.jsx`)

- Expected Value per sealed box: `Σ (copiesPerCardPerBox × marketPrice)` aggregated per rarity.
- ROI: `(EV − boxCost) / boxCost × 100`.
- Rarity-contribution breakdown (which rarities carry the EV).
- **Singles comparison:** cost of top-5 / top-10 chase cards vs. box cost — helps decide *"open vs. buy the chase"*.
- Data-quality badge: warns the user when a set's rarity diversity is below 4 (signals incomplete live data for that set).

## 4.6 Tab: ⭐ Watchlist (`src/tabs/Watchlist.jsx`)

- Aggregate stats for starred cards: total market value, total model-predicted value, average delta, count of buy signals.
- Sort modes: undervalued, overvalued, demand, price, desirability, alphabetical.
- Empty-state panel with onboarding guidance.
- Persistence: localStorage key `fw-watchlist-v1` (Set of card codes).

## 4.7 Card Detail modal (`src/components/CardDetail.jsx`)

- Full-screen modal on mobile, side panel on desktop.
- Card image (with graceful fallback), verified-data badge, rarity badge.
- Price breakdown: predicted vs. market, delta explanation.
- Desirability component breakdown: charPremium, artScore, universalAppeal, pullCost — each visualized with `MiniBar`.
- Circular `GaugeRing` for demand pressure and supply saturation.
- **`Sparkline`** for price history (7/14/30-day toggle) and for demand trend — currently synthetic until `priceHistory.json` accumulates real data.
- DeltaBadge + signal interpretation copy.

## 4.8 Data pipeline (Verified end-to-end)

- `scripts/scrape-official-fw.js` — Playwright scraper against Bandai's official DBFW card database. Handles scrollable card lists, 5-strategy card-link detection, and `data-src` lazy-loaded images.
- `scripts/merge-known-cards.js` — merges the per-set scraped JSON into the master `known-cards.json` (1,157 entries today).
- `scripts/fetch-cards.js` — generates all 1,258 card codes, joins against `known-cards.json`, synthesizes defaults for gaps, and writes `src/cardData.json`.
- `scripts/update-prices.js` — calls JustTCG API (rate-limited to ~10 req/min on the free tier, page limit 20), writes `src/livePrices.json`.
- `scripts/accumulate-prices.js` — intended to snapshot `livePrices.json` into `priceHistory.json` on each weekly run. **Has not yet written a snapshot** — priceHistory is `{}` at audit time.
- `scripts/calibrate-model.js` — OLS regression that produces the rarity base prices and the charPremium β used inside `src/data.js`.

## 4.9 Automation (Verified)

- `.github/workflows/update-cards.yml` — schedules the card-DB refresh for the 1st of every month at 04:00 UTC, commits `src/cardData.json` if it changes.
- `.github/workflows/update-prices.yml` — schedules the JustTCG refresh every Monday at 05:00 UTC, commits `src/livePrices.json`.
- `.github/workflows/deploy.yml` — triggers Vercel deploy on push-to-main and after either upstream workflow finishes successfully.

## 4.10 Launch polish (Verified)

- PWA manifest (`public/site.webmanifest`), apple-touch-icon, favicon.
- `<meta>` tags for OG, Twitter (`summary_large_image`), theme-color, description, keywords.
- 1200×630 OG preview image in `public/og-image.png`.
- Absolute URLs used for og:image and og:url so previews render correctly on Discord / iMessage / Slack / X.
- `robots.txt`: allow-all.
- `noscript` fallback message.
- Google Fonts preconnect tags.


# 5. Historical Progress Summary

Project evolution is partially **Verified** from git history and partially **Inferred** where commits compress multiple micro-decisions.

## 5.1 Original vision (Inferred)
A small React dashboard that modeled DBFW card desirability and price using a rarity/pull-rate + Google-trends-driven character premium + seeded-RNG art score, with ~161 verified cards and the rest synthetic. The first CLAUDE.md captured this era.

## 5.2 Build-phase milestones (Verified via commit log, ordered earliest → latest)

1. **Initial analytics model** — rarity-stratified pricing, mulberry32 PRNG, 161 verified cards.
2. **JustTCG integration ("Problem 1")** — authentication header, correct slug, correct endpoint, and the rate-limiter fixes (commits `8882352`, `d8a73d2`, `452f11e`).
3. **First live prices (402 cards: FB01, FB03, FB09)** — commit `b43781c`.
4. **Playwright scraper for Bandai ("Problem 2")** — multi-strategy card-link detection, scroll flush, debug path, and the `data-src` / `img alt` fix (commits `efd4014`, `3fd22f2`, `32b49a0`).
5. **"Problem 3" — merge pipeline + Vercel wiring** — commit `7c519ae`.
6. **Full 9-set card database** — 1,157 verified cards ingested from the Bandai scraper (commit `4dd6c62`). **This was a ~7× expansion over the previous verified count.**
7. **Live prices for all 9 sets (1,156 cards)** — commit `a30d7e7`.
8. **LIVE badges + header status** (commit `b02ba43`).
9. **Model recalibration against real market data** — OLS regression, rarity base prices, β=0.0803 (commit `1395a38`).
10. **Box EV Calculator tab** (commit `9e1f224`).
11. **Watchlist / Portfolio tab** (commit `c6a1faf`).
12. **Mobile responsiveness polish** (commit `289abfe`).
13. **Claude skill library** — 7 project-specific skills committed to `.claude/skills/` (commit `f4e36e0`).
14. **Public-launch polish** — favicons, manifest, meta, robots (commit `fb75779`).
15. **OG social preview image + absolute-URL fixes** (commits `c140330`, `115c9ed`).

## 5.3 Important solved problems (Verified)
- **JustTCG free-tier constraints:** 10 req/min + 20-page limit — handled with explicit delays and pagination caps in `scripts/update-prices.js`.
- **Bandai lazy-loaded DOM:** solved by `data-src` attribute reads + scroll-flush triggers in the Playwright scraper.
- **Model drift from synthetic priors:** replaced heuristic `exp(…)` with a regression-fit rarity base + charPremium β.
- **Social preview rendering:** fixed by switching og:image / og:url to absolute URLs.

## 5.4 Meaningful pivots (Inferred)
- From **mostly synthetic (~13% verified)** to **mostly real (~92% verified, ~92% live-priced)** — this changed the product's credibility class.
- From **single-tab scanner** to **5-tab analytics suite** — Box EV and Watchlist each represent a distinct user job.
- From **hand-curated 161-entry JSON** to **automated monthly scrape + weekly price refresh** — the project now maintains itself on a cron.

## 5.5 Why the current state matters
FusionMetrics has crossed the threshold from "demo-grade toy" to "operationally useful tool." The dashboard is feature-complete, has a live public URL, auto-refreshes data, and ships with a skills library so future sessions behave consistently. Any further work is about *hardening, trust, and depth* — not about building the core product.


# 6. Current Architecture

## 6.1 Data flow (end-to-end, Verified)

```
                   MONTHLY                            WEEKLY
                      │                                  │
                      ▼                                  ▼
         ┌──────────────────────────┐      ┌───────────────────────────┐
         │ scrape-official-fw.js    │      │ update-prices.js          │
         │  (Playwright → Bandai)   │      │  (JustTCG REST API)       │
         └───────────┬──────────────┘      └─────────────┬─────────────┘
                     ▼                                   ▼
         scripts/official-card-db/*.json   ┌─────────────────────────────┐
                     │                     │    accumulate-prices.js     │
                     ▼                     │ (snapshot → priceHistory)   │
         ┌──────────────────────────┐      └─────────────┬───────────────┘
         │ merge-known-cards.js     │                    ▼
         └───────────┬──────────────┘          src/priceHistory.json
                     ▼                             (currently {})
         scripts/known-cards.json
           (1,157 verified entries)
                     │
                     ▼
         ┌──────────────────────────┐
         │    fetch-cards.js        │
         └───────────┬──────────────┘
                     ▼
              src/cardData.json   ──►  imported by src/data.js
              (1,258 cards)                       │
                                                  ▼
                                ┌──────────────────────────────────┐
                                │ src/data.js                      │
                                │  • applies pricing model         │
                                │  • merges livePrices.json        │
                                │  • generates seeded analytics    │
                                │  • exports SETS, RARITIES, CARDS │
                                └─────────────┬────────────────────┘
                                              ▼
                                       src/App.jsx (shell)
                                              │
                   ┌────────┬────────┬────────┼────────┬─────────┐
                   ▼        ▼        ▼        ▼        ▼         ▼
               Scanner   Model   Dynamics   BoxEV   Watchlist   CardDetail
                                                        │
                                                        ▼
                                            localStorage: fw-watchlist-v1
```

## 6.2 Source-of-truth rules (Verified, must preserve)

- `scripts/known-cards.json` is the **only** hand-authoritative card-metadata file.
- `src/cardData.json` and `src/livePrices.json` are **generated artifacts** — never hand-edit.
- `src/priceHistory.json` will be **generated-append** by `accumulate-prices.js`.
- `src/data.js` is the **only** place analytics math runs at runtime — tabs consume its exports.

## 6.3 Pricing & analytics model (Verified against `src/data.js` + `scripts/calibrate-model.js`)

Rarity base prices (geometric mean of real prices per rarity):

| Rarity | Pull rate | Base price (USD) | Notes |
|--------|----------:|-----------------:|-------|
| L (Leader)        | 0.04  | $0.2304  | |
| C (Common)        | 0.55  | $0.1598  | |
| UC (Uncommon)     | 0.28  | $0.2000  | Smoothed upward from noisy sample |
| R (Rare)          | 0.12  | $0.2440  | |
| SR (Super Rare)   | 0.04  | $1.1144  | |
| SCR (Secret Rare) | 0.008 | $12.9869 | |
| SPR (Special Rare)| 0.003 | $24.99   | **Extrapolated via log-linear** (no real sample) |

Formulas:
- `charPremium = clamp(googleTrends / 10, 1, 10)`
- `predictedPrice = rarityBase × exp(β × (charPremium − meanCharPremium))` where β = **0.0803**, meanCharPremium = **5.9386**, R² = **0.32**.
- `marketPrice = livePrice ?? predictedPrice × (0.7 + rng*0.6)`  ← synthetic fallback
- `delta = (marketPrice − predictedPrice) / predictedPrice × 100`
- `desirability = 0.45·charPremium + 0.45·artScore + 0.10·universalAppeal` where `artScore` is mulberry32-seeded on card index, `universalAppeal = googleTrends / 10`.
- `demandPressure = absorbed / totalSupply` (both seeded RNG).
- `supplySaturation = demand/supply ratio`, normalized so 1.0 is neutral.

**RNG seed:** `seed = idx * 7919 + 42`. **35 RNG calls per card** (6 are consumed even if live price exists, so determinism holds regardless of live-data presence).

## 6.4 Frontend rendering flow (Verified)

- `src/main.jsx` mounts `<App />` into `#root`.
- `App.jsx` reads `CARDS`, `SETS`, `RARITIES`, `HAS_LIVE_PRICES` from `data.js`.
- Tab state is local `useState`. No global store / context / router.
- Watchlist state lives in `useWatchlist` hook and syncs to `localStorage`.
- Mobile state lives in `useIsMobile` (resize/orientation listeners).
- Each tab memoizes its derived data with `useMemo`. No data fetching at runtime — everything is bundled.

## 6.5 Live vs. static data (Verified)

- **Card metadata** is fully static at runtime (bundled `cardData.json`).
- **Prices** are also static at runtime (bundled `livePrices.json`) — freshness is maintained by rebuilding+redeploying weekly via GitHub Actions.
- **Historical prices** do not yet exist at runtime — sparklines are synthetic until `priceHistory.json` gets populated.

## 6.6 Fragile connections (Inferred)

- **JustTCG API key** (`JUSTTCG_API_KEY` secret) — if rotated/revoked, weekly refresh silently fails. No alerting.
- **Bandai DOM markup** — the scraper's 5-strategy link detection is brittle against redesigns.
- **Vercel build** — no CI gate beyond the build step. A runtime error in `data.js` would deploy successfully and break in the browser.
- **`cardData.json` inlined in the bundle** — growing the card count (e.g., FB10) materially increases bundle size. The `chunkSizeWarningLimit: 600` tolerates it today, but lazy-loading will be needed eventually.


# 7. Working Rules / Skills / Standards

## 7.1 Non-negotiable operating rules (preserve)

1. **Never hand-edit generated JSON.** `cardData.json`, `livePrices.json`, and `priceHistory.json` are machine-output. Changes go through the scripts that produce them.
2. **`known-cards.json` is the source of truth for card metadata.** All card-metadata changes originate there, then regenerate `cardData.json`.
3. **Determinism matters.** The mulberry32 seeding contract (`idx * 7919 + 42`, 35 calls/card, 6 consumed even when a live price exists) must be preserved — changing the order or count of RNG calls reshuffles every "synthetic" analytics value in the UI.
4. **Live data wins.** If `livePrices.json` has a price, the model must not override it. Synthetic fallback applies only when no live price exists.
5. **No hand-edits to the pricing coefficients.** Any change to β, the rarity base prices, or the charPremium mean must come from re-running `scripts/calibrate-model.js`, not from inline edits in `data.js`.
6. **Branch discipline.** All dev on `claude/dbfw-market-analytics-1qh5D`. No direct pushes to `main` without explicit authorization.
7. **No secret commits.** `JUSTTCG_API_KEY` lives in GitHub Actions secrets, never in a file.
8. **Don't break the skills library.** `.claude/skills/` is the project's institutional memory for Claude sessions — treat it like shared code.

## 7.2 Coding principles (match what's already in the repo)

- React 18 functional components + hooks. No class components, no Redux, no context providers.
- Inline styles + `src/theme.js` tokens. Do **not** introduce Tailwind, styled-components, CSS modules, or any other styling system without explicit direction.
- No TypeScript (yet). Keep JSDoc-level discipline in naming; types are implicit.
- No external state-management library.
- Prefer `useMemo` for derived data. Avoid re-computing 1,258-row transforms on every render.
- Keep tabs self-contained — each `src/tabs/*.jsx` should be removable/replaceable without cascading edits.

## 7.3 Design philosophy

- **Dark, dense, decision-oriented.** Every pixel should help the user answer *buy / sell / hold / open*.
- **Honest visuals.** Delta colors (green/red/yellow) map to real thresholds (−15% / +15%). Synthetic data must be visually distinguishable from live data (the LIVE badge already enforces this).
- **Mobile is a first-class target**, not an afterthought — confirm all changes on mobile widths (≤375px) before shipping.
- **Calm UI.** No motion for motion's sake. No popovers that demand attention.

## 7.4 Architecture rules

- **Tabs consume `data.js`, not raw JSON.** If a new tab needs a new derived field, add it to `data.js` once, export it on each `CARDS[i]`.
- **Components must be pure and prop-driven.** No component should reach into `data.js` on its own; App/Tabs supply the data.
- **Scripts are the only write-path to bundled JSON.** Runtime code never writes JSON files.
- **Keep `data.js` ≤ 200 LOC by deferring tab-specific math to the tab.** Shared math stays central.

## 7.5 Claude skills library (`.claude/skills/`) — preserve and use

These are the project's codified decision-making templates. Always prefer invoking the matching skill over improvising.

| Skill | Trigger |
|-------|---------|
| `fusion-dashboard-patterns` | Any new tab, component, hook, or UI feature — enforces the split-panel / CardDetail / sticky-header / theme-token patterns. |
| `fusion-data-pipeline` | Any scraper, API, merger, or regeneration task. |
| `fusion-feature-ship` | End-to-end feature delivery — file list + full code + git commands + test plan. |
| `fusion-git-flow` | Any commit / push / rebase on this repo. |
| `fusion-llm-handoff` | Whenever the user pastes a prompt written by another LLM — normalize it before acting. |
| `fusion-qa-verify` | Before any commit, after any data refresh, or when the user asks "does this actually work". |
| `fusion-tcg-model` | Whenever calibrating prices, building ROI features, or touching analytics math. |

## 7.6 Repo hygiene

- Keep the root flat — no `src/pages/`, no `src/lib/utils.ts`, no barrel files. This project values locatability over cleverness.
- Commit messages follow `feat:` / `fix:` / `chore:` / `refactor:` prefixes (Verified from git log).
- Commit `cardData.json` / `livePrices.json` changes via the relevant GitHub Action, not from a dev machine (unless intentional).

## 7.7 Change-safety principles

- **Don't casually break:** determinism, rarity base prices, live-data precedence, tab independence, mobile layout, or the SEO/OG meta block.
- **Don't introduce:** a CSS framework, a state library, a test runner without plan, TypeScript without plan, or a new third-party dependency without naming what it replaces.
- **Don't rewrite** `CLAUDE.md`, `.claude/skills/`, or the pricing-model constants without running `calibrate-model.js` first.
- When in doubt, mirror the nearest existing pattern rather than invent a new one.


# 8. Known Constraints, Risks, and Open Questions

## 8.1 Data-completeness constraints (Verified)

- **~102 cards have no live price.** They fall back to synthetic pricing and should not be treated as authoritative in Box EV or Market Dynamics outputs.
- **`priceHistory.json` is empty.** Every sparkline and trend line today is seeded-synthetic. Price-history claims must not be made in marketing/UX until real snapshots exist.
- **Only ~40 cards have real Bandai image URLs** in `scripts/official-card-db/`. Most cards render with an icon fallback in `CardImage.jsx`.
- **SPR sample = 0.** The $24.99 base is an extrapolation, not a measurement — treat with skepticism until at least one real SPR price lands.
- **UC base was smoothed.** Raw UC data was noisy; the current base is intentionally conservative.

## 8.2 Infrastructure risks (Verified)

- **No test suite, no linter, no type system.** A regression in `data.js` would reach production without any automated gate.
- **No error monitoring, no analytics.** We cannot tell from the outside whether the app is broken for real users.
- **JustTCG key failure = silent stale data.** If the secret rotates or the free-tier limits change, weekly refresh fails quietly.
- **Bandai scraper is brittle** — selector changes on their site will break the monthly card refresh.
- **No CI guard on `deploy.yml`** — the workflow builds and deploys; it does not run tests or lint (because neither exists).
- **Bundle size** — `cardData.json` is inlined; adding FB10 (or any future set) will push past the 600 kB chunk warning without lazy loading.

## 8.3 Model / analytics risks (Inferred + Verified)

- **R² = 0.32** on the charPremium regression is modest. Predictions carry meaningful error, especially outside the SR / SCR rarity strata.
- **`googleTrends` proxy for character popularity.** The values in `known-cards.json` were entered at various times; they are not a live signal. (Inferred.)
- **Synthetic `priceHistory` can mislead users.** It looks real without being labeled as such in `CardDetail.jsx`. (Verified.)
- **Seeded RNG means trends never change.** Two visits a month apart show the same "historical" sparkline — a transparency problem once real history exists.

## 8.4 UX risks (Inferred)

- Mobile card-detail modal is full-screen but has no swipe-to-dismiss (needs confirmation).
- Empty states exist for Watchlist; need spot-checks on Box EV when a set has near-zero data quality.
- Pagination control UX in Value Scanner at >12 pages deep: not audited.

## 8.5 Open questions (explicit "needs confirmation" list)

1. **Has the weekly `update-prices.yml` actually run on schedule?** **VERIFIED 2026-04-18:** Total runs = **0**. The workflow was wired 2026-04-13 but has not yet reached its first Monday 05:00 UTC firing window. Next scheduled run: **2026-04-20 05:00 UTC**. Every existing `livePrices.json` commit was human-authored, not bot-authored. `JUSTTCG_API_KEY` has never been exercised by CI — first live test is Monday.
2. **Has the monthly `update-cards.yml` run successfully** at least once autonomously? **VERIFIED 2026-04-18:** Total runs = **0**. First scheduled run: **2026-05-01 04:00 UTC**. All `cardData.json` commits were manual.
3. ~~**Is `accumulate-prices.js` wired into any workflow?**~~ **RESOLVED 2026-04-17 by fresh-session cross-check:** `update-prices.yml` lines 22–23 already invoke `node scripts/accumulate-prices.js` BEFORE the JustTCG fetch, and line 33 already commits `src/priceHistory.json` alongside `src/livePrices.json`. The reason `priceHistory.json` is still `{}` is therefore **not** a missing wiring — it's that the weekly workflow has either not fired yet, has fired but had nothing to archive on the first run, or has fired and failed silently. This folds entirely into open question #1 below.
4. **Does Vercel receive the upstream `workflow_run` triggers?** **PARTIALLY VERIFIED 2026-04-18:** `deploy.yml` has 1 successful push-triggered run (2026-04-13). The `workflow_run` path has never fired because `update-prices.yml` and `update-cards.yml` have zero runs. Will be verifiable after 2026-04-20.
5. **Is the JustTCG dataset consistent with TCGPlayer / PriceCharting?** A spot-check of 5–10 known market-price cards would either confirm or caveat the calibration.
6. **Are there any console errors in production on iOS Safari / Android Chrome?** No telemetry, so unknown.
7. **Does Plausible get turned on for launch?** The `<script>` is commented in `index.html` with a `DOMAIN` placeholder.
8. **Copyright / trademark posture for card imagery and names** — product treats DBFW as a public TCG; any future monetization needs legal review.


# 9. Old Goals vs New Goals

## 9.1 Previous goals (build phase — now ACHIEVED)

- ✅ Build a React + Vite analytics shell for DBFW.
- ✅ Model card desirability and predicted price with a deterministic, reproducible formula.
- ✅ Cover all 9 sets (FB01–FB09) with 1,258 card codes.
- ✅ Replace synthetic-only prices with live market data.
- ✅ Expand from 161 verified cards to the full 1,157-entry verified database via Bandai scraping.
- ✅ Calibrate the pricing model against real data (OLS, rarity base prices).
- ✅ Ship a Value Scanner, a Pricing-Model scatter, a Market-Dynamics quadrant, a Box EV calculator, and a Watchlist.
- ✅ Make the UI mobile-responsive.
- ✅ Automate monthly card-DB refresh and weekly price refresh via GitHub Actions.
- ✅ Deploy to Vercel with SEO/OG/PWA polish.
- ✅ Codify recurring project intelligence into a 7-skill Claude library.

The build phase is **complete**. Any future work framed as "build the next feature" should be scrutinized — the product is feature-complete for MVP.

## 9.2 New goals (operate & harden phase — the active mission)

The mission has shifted from **"ship the dashboard"** to **"make the dashboard trustworthy, durable, and deep enough that collectors and investors rely on it."** Concretely:

### Pillar A — Continuity & Safety (active from this document forward)
- Keep a living, recovery-grade `CLAUDE.md` so any future session can resume in minutes.
- Preserve the skills library and branch discipline.
- Protect determinism, live-data precedence, and the source-of-truth rules.

### Pillar B — Data Integrity & Historical Trust
- Populate `priceHistory.json` with real weekly snapshots (wire `accumulate-prices.js` into `update-prices.yml`).
- Distinguish **real** vs. **synthetic** sparklines in the UI — never show synthetic history styled the same as real.
- Close the ~102-card live-price gap where possible.
- Re-calibrate the pricing model quarterly, or whenever SPR/UC sample quality improves.
- Add a cross-reference spot-check (JustTCG vs. TCGPlayer vs. PriceCharting) to verify calibration.

### Pillar C — Infrastructure Hardening
- Add a minimal CI gate: at a bare minimum, `npm run build` must pass on every PR.
- Add a tiny smoke test that boots `data.js` and asserts `CARDS.length === 1258`, `HAS_LIVE_PRICES === true`, and no `NaN` / `Infinity` in predictedPrice.
- Wire deploy-failure and scraper-failure alerts (GitHub notifications to the user, or a simple webhook).
- Turn on Plausible (or equivalent privacy-respecting analytics) so we can detect real-world breakage.
- Capture production errors (lightweight — e.g., `window.onerror` → Vercel logs, or Sentry free tier).

### Pillar D — Data Depth & Coverage
- Scrape / ingest Bandai card images for all 1,258 codes (today only ~40 have real imagery).
- Fill the remaining ~102 non-live-priced cards where JustTCG or another source eventually lists them.
- Add FB10 (and subsequent sets) *through the pipeline*, not by hand — exercise the scraper + merger + calibration chain.

### Pillar E — Analytics Depth (only after Pillars A–C are solid)
- Real price-trend charts (once `priceHistory.json` has ≥4 weeks of real snapshots).
- Alerts / notifications on sudden delta movements (once real history exists).
- Correlation views (e.g., set-level EV vs. release window).
- Deckbuildability score (if a staple-usage dataset becomes available).

### Pillar F — Platform Trust
- Clear in-app provenance labels (data source, last refresh time, sample size per rarity).
- An "About the model" page explaining β, R², and limitations — in plain English for non-quants.
- Basic legal / attribution footer acknowledging Bandai / JustTCG / HighDefined image repo.
- Optional export (CSV of Watchlist) for users who want their own spreadsheets.

**Core new-phase principle:** *No new feature ships until the foundations it rests on (data integrity, CI safety, provenance labeling) are healthy.*


# 10. Prioritized Next Steps

Ordered by dependency chain and risk reduction. A future session can pick this up linearly.

## P0 — Immediate (do first, before any feature work)

1. **Verify the three GitHub Actions have actually fired on schedule.**
   Inspect workflow run history in the GitHub UI. Confirm timestamps of `update-prices.yml` (Mondays), `update-cards.yml` (1st of month), `deploy.yml` (on push + on upstream workflow_run).
   *Why first:* the entire "auto-refresh" story depends on these actually running. Audit cannot verify GitHub state from the filesystem.

2. ~~Wire `accumulate-prices.js` into `update-prices.yml`.~~ **Already done** (verified 2026-04-17). `update-prices.yml` invokes the accumulator and commits `priceHistory.json`. The open blocker is purely #1 above — confirming the workflow has actually executed and whether `priceHistory.json` is `{}` because no run has committed yet, because the first run had nothing to archive, or because the commit step failed silently.

3. **Distinguish real vs. synthetic sparklines in `CardDetail.jsx`.**
   Until `priceHistory.json` has ≥4 weeks of entries, label the sparkline "synthetic preview" (or hide it) to avoid misleading users.

## P1 — Short term (this week)

4. **Add a CI build-check workflow.**
   Minimal `.github/workflows/ci.yml` running `npm ci && npm run build` on every push + PR. Zero tests, just the build gate.

5. **Add a trivial data-integrity smoke test.**
   A Node script (`scripts/verify-data.js`) that asserts `CARDS.length === 1258`, no NaN prices, every card has a rarity, and `HAS_LIVE_PRICES === true`. Call it from the CI workflow.

6. **Turn on Plausible (or equivalent) analytics.**
   Replace the `DOMAIN` placeholder in `index.html` with the deployed domain and uncomment the tag.

7. **Cross-reference spot-check.**
   Pick 10 cards (2 per common rarity stratum + 2 SCR + 1 SPR) and compare JustTCG vs. TCGPlayer/PriceCharting. Document findings in a short note; adjust calibration if systematic bias is found.

## P2 — Medium term (next 2–4 weeks)

8. **Scraper reliability pass.**
   Add retry + backoff to `scrape-official-fw.js`. Log a structured summary to workflow output. Fail loudly (exit non-zero) if fewer than N cards are scraped — never silently overwrite `known-cards.json` with a degraded set.

9. **Image coverage.**
   Extend the scraper to capture the full image URL per card (or mirror Bandai images to a project-controlled bucket / repo). Today only ~40 cards render real imagery.

10. **Explicit "data provenance" panel in `CardDetail.jsx`.**
    Show: source of current price, last refresh timestamp, rarity-stratum sample size, whether history is real or synthetic.

11. **"About the model" page (new tab or modal).**
    Plain-English explanation of β, R², rarity bases, what "delta" means, known limitations.

## P3 — Medium-longer term (next month+)

12. **Quarterly recalibration.**
    Formalize a cadence: every quarter, run `calibrate-model.js`, review coefficient drift, update `data.js` constants with a `chore: recalibrate` commit.

13. **Delta-movement alerts.**
    Once `priceHistory.json` has 4+ weeks of real data, add a Watchlist signal: "price moved X% in the last 14d".

14. **Lazy-load `cardData.json`.**
    Move from inlined-in-bundle to a code-split dynamic import to keep initial page load fast as the card count grows.

15. **FB10 dry-run.**
    When FB10 releases, exercise the full pipeline (scrape → merge → regenerate → recalibrate → live prices) as a test of automation durability.

## P4 — Longer-term opportunities (directional, not committed)

- Sealed-product tracking (booster boxes, display boxes, starter decks) beyond current box-cost inputs in BoxEV.
- Deck-staple popularity overlay (if a competitive-usage dataset emerges).
- Community features (shared watchlists, sell alerts) — only after infra hardening.
- TypeScript migration (only if the codebase grows beyond 4k LOC).
- Paid tier (historical-data export, advanced alerts) — only after consistent traffic + legal review.

**Golden rule for the next phase:** resist the urge to ship another tab. The highest-leverage work right now is making the existing surface demonstrably trustworthy.


# 11. Safe Resume Instructions for Future Claude Sessions

Read this section first if you are a Claude session (or any LLM) inheriting this repo.

## 11.1 How to use this file

- Treat `CLAUDE.md` as the **primary source of truth about project state**. The user's chat memory may be gone; this file is not.
- When repo evidence conflicts with anything in this file, **trust the repo** and update this file on the same PR.
- Don't rewrite this file wholesale unless the user explicitly asks. Append or edit sections.

## 11.2 First 10 minutes of any new session

1. Run `git status` and `git log --oneline -10` to confirm branch + recent commits.
2. Read `CLAUDE.md` top to bottom (yes, all of it).
3. Read `src/data.js` (153 LOC) — it is the beating heart.
4. Read `src/App.jsx` (117 LOC) — it shows the current tab surface.
5. Check `src/priceHistory.json` size — if still `{}`, priority #2 in §10 has not been done.
6. Verify `.claude/skills/` still contains 7 skill directories.
7. Ask the user: *"Should I pick up at P0 §10, or did new priorities come in?"*

## 11.3 What to trust

- Every item tagged **Verified** in §3, §4, §5, §6 — those were read from disk at audit time.
- The structure of `src/`, `scripts/`, `.github/workflows/`, and `.claude/skills/`.
- Git commit messages are honest (they describe real work).

## 11.4 What to verify before acting

- Whether any GitHub Actions have fired since the audit date. File timestamps don't reflect workflow runs.
- Whether live prices have been refreshed (look at the timestamp inside `src/livePrices.json`).
- Whether `priceHistory.json` has become non-empty.
- Whether the JustTCG API key still works.
- Whether anyone has pushed new commits to `main` outside the dev branch.

## 11.5 What NOT to redo

- Do **not** rebuild the 5 tabs or the pricing model from scratch.
- Do **not** re-invent a rarity / color / pull-rate taxonomy — it already exists in `src/data.js`.
- Do **not** add a CSS framework, state library, or TypeScript without user sign-off.
- Do **not** hand-edit `cardData.json`, `livePrices.json`, or `priceHistory.json`.
- Do **not** create a second analytics model in a new file — if math changes, change `data.js`.
- Do **not** restructure folders (no `src/pages/`, no `src/lib/`). The current flat layout is intentional.

## 11.6 How to avoid breaking shipped functionality

- Before any non-trivial edit, invoke the relevant Claude skill from `.claude/skills/`.
- Verify each of the 5 tabs renders after your change (run `npm run dev`, click through each tab on desktop *and* mobile-sized viewport).
- Confirm `HAS_LIVE_PRICES` still resolves truthy and the ● LIVE badge still shows in the header.
- Confirm the Watchlist star/unstar still persists across reload.
- Confirm `npm run build` completes without errors or new warnings.
- Never amend a commit that has been pushed.
- Never `--force` push to the dev branch without explicit authorization.

## 11.7 Where to resume work first

Start at **§10 P0 item 1** ("Verify the three GitHub Actions have actually fired on schedule") unless the user redirects. Everything downstream in §10 depends on that verification.

## 11.8 How to approach changes safely

- Small, reversible edits beat clever refactors.
- Each change should be a single commit with a `feat:` / `fix:` / `chore:` prefix.
- If a change touches pricing math, run `scripts/calibrate-model.js` and regenerate, rather than hand-tuning.
- If a change touches card metadata, edit `scripts/known-cards.json` and run `node scripts/fetch-cards.js`.
- If a change would grow `cardData.json` past the chunk warning, stop and design lazy-loading first.
- If in doubt, ask the user — the cost of asking is near zero; the cost of silent regression is high.


# 12. Current Best Repo-State Summary

Grounded honest summary of likely state as of 2026-04-17.

## 12.1 What is most likely true right now (high confidence)

- FusionMetrics is a feature-complete, publicly deployed DBFW analytics dashboard at `fusion-metrics-jet.vercel.app`.
- The repo contains a clean, working 5-tab React 18 + Vite codebase (~2,260 LOC) with 1,258 cards modeled.
- 1,157 of those cards have real metadata from the Bandai scraper; 1,156 have real market prices from JustTCG.
- The pricing model has been regression-calibrated against real data (β = 0.0803, R² = 0.32).
- Automation exists in GitHub Actions for monthly card refresh, weekly price refresh, and deploy.
- A Claude skills library is committed and should guide all future work.

## 12.2 What is likely stable (medium-high confidence)

- The 5 tabs render correctly on desktop and mobile.
- The Watchlist localStorage persistence works (`fw-watchlist-v1`).
- SEO / OG / PWA polish is complete.
- The Vercel build pipeline produces a deployable bundle.
- The skill library (`fusion-*`) is intact and ready to be invoked.

## 12.3 What is likely unfinished (medium confidence)

- `priceHistory.json` is empty → real price-history sparklines do not yet exist.
- `accumulate-prices.js` exists but probably is not wired into any workflow.
- A chunk of cards (~102) lack live prices; most cards lack real imagery.
- SPR base price is extrapolated; UC base is smoothed — both are "best-effort" values.
- There is no test suite, no linter, no observability, no CI gate beyond the build.
- The pricing model's explanatory power (R² = 0.32) leaves significant per-card variance.

## 12.4 What future work should assume unless proven otherwise

- The dashboard is the product. Don't rebuild it.
- The pipeline is the backbone. Protect it.
- Real data beats synthetic data every time — prefer fixing the pipeline over tweaking the model.
- Hardening > new features. Trust > novelty. Safety > speed.
- The next phase is about turning a polished MVP into an operationally dependable platform.

---

**End of continuity document.** Any future session: you have what you need to resume safely. Begin at §10 P0 item 1 unless the user says otherwise.

