# FusionMetrics Portfolio Case Study

## Project Overview

FusionMetrics is a market analytics dashboard for the Dragon Ball Super:
Fusion World TCG. It covers FB01-FB09 and combines live JustTCG prices,
model-labeled estimates, real 30-day JustTCG history, provenance, and
local-only portfolio tracking.

The project goal is not to predict guaranteed profit. The goal is to show how a
market analytics product can be useful while being explicit about where the data
comes from, what is modeled, and what is unknown.

## Problem

TCG market tools can be hard to trust when they mix live prices, model outputs,
thin-market signals, and sealed-product math without clear labels. FusionMetrics
solves the presentation problem first: users should know whether they are seeing
observed JustTCG data, a model estimate, or an approximate heuristic.

## Product Goals

- Scan cards and sets quickly across FB01-FB09.
- Keep live prices, model estimates, and heuristics visually distinct.
- Explain data freshness and carried-forward prices.
- Show 30-day price history only when real JustTCG history exists.
- Provide local portfolio utility without accounts or a database.
- Avoid fake precision, fake trend visuals, and investment guarantees.

## Technical Architecture

- React 18 and Vite for a fast static frontend.
- Plain JavaScript components and JSON data files.
- `src/livePrices.json` bundled as current price data only.
- `public/priceHistory30d.json` served as a runtime-loaded history file.
- `public/priceUpdateLog.json` served as refresh metadata for provenance UI.
- GitHub Actions and Vercel support deployment and scheduled data updates.

## Data Pipeline And Trust System

FusionMetrics uses a quota-aware JustTCG rotation and merge pipeline. Rotation
updates a subset of sets per run and carries forward known-good prices for sets
that did not refresh in that run.

Trust safeguards include:

- Split shape: current prices are separate from 30-day history.
- `verify-data.js` requires split shape and 9 invariants.
- A 1,121 live-price coverage floor and per-set guard prevent degraded writes.
- CardDetail lazy-loads real JustTCG 30-day history.
- Provenance footer and modal show refresh metadata.
- Per-card freshness shows each live card's timestamp.
- Estimated cards remain visible but are excluded from undervalued and
  overvalued rankings.

## Key Features

- Value Scanner: filters, ranking, LIVE/EST labels, and detailed card panel.
- Pricing Model: market-price scatterplot against model inputs.
- Market Dynamics: model demand/supply view plus Set-Level Analytics.
- Box EV: approximate sealed EV with visible assumptions and input quality.
- Watchlist v2: local-only quantity, entry price, current value, and cautious
  Unrealized P/L.
- Methodology: user-facing data source and model limitation explanations.

## Major Engineering Challenges

- Reducing bundle size by splitting history out of bundled card data.
- Preserving a known-good live-price baseline under JustTCG free-tier limits.
- Avoiding synthetic history and fake market movement after removing earlier
  placeholder visuals.
- Making mobile and narrow-width layouts readable without a redesign.
- Keeping multiple coding agents aligned through `AGENTS.md`, focused skills,
  and handoff docs.

## Current Limitations

- JustTCG free-tier quota limits refresh cadence.
- Image coverage is incomplete.
- Box EV uses simplified assumptions and does not model variant-specific odds,
  fees, shipping, taxes, liquidity, or sealed variance.
- Watchlist data is local browser storage only.
- There are no accounts, alerts, cloud sync, CSV export, eBay sold comps, or
  long-term history archive yet.

## Future Roadmap

Near-term:

- Capture portfolio screenshots and record a short walkthrough.
- Improve image coverage strategy before touching generated data.
- Add focused automated UI smoke tests after approval.
- Plan local-only Watchlist export/import.

Later:

- Cross-source pricing research.
- Long-term history archive.
- Outlier and manipulation detection.
- Accounts and alerts only after public-beta validation.

## Portfolio Talking Points

- Trust-first analytics design: every price and heuristic is labeled.
- Data contract enforcement through local verification and guardrails.
- Runtime lazy-loading reduced bundle weight while preserving chart utility.
- Product scope stayed conservative: useful analytics without fake certainty.
- Multi-agent workflow was managed with repo-level instructions and skills.
