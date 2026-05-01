---
name: fusionmetrics-product
description: Use when planning FusionMetrics user-facing analytics, Methodology copy, Set Rankings, Box EV, Watchlist, investor tools, public launch, or product roadmap decisions.
version: 1.0.0
category: Product
triggers:
  - methodology
  - set rankings
  - box ev
  - watchlist
  - investor tools
  - product roadmap
  - public launch
---

# FusionMetrics Product & Analytics Planning

## Purpose

Use this skill for user-facing product decisions after the trust-complete MVP
checkpoint. Keep planning grounded in the current data contract and avoid
analytics that imply stronger evidence than FusionMetrics has.

## Product principles

- Make assumptions visible before adding stronger analytics.
- Separate observed data from modeled scores in UI copy and naming.
- Avoid fake investment precision, fake trend signals, and implied guarantees.
- Prefer small shippable analytics improvements over large product rewrites.
- Keep estimated cards visible, but do not rank them as undervalued or
  overvalued.
- Treat JustTCG as directionally trustworthy for MVP, not as a perfect market
  oracle.

## Completed product foundations

- Set-Level Analytics: live value, coverage, freshness, and Chase Dependency.
- Box EV methodology tightening: assumptions, confidence copy, and safer
  labels.
- Watchlist v2: local quantity, entry price, current value, and cautious
  Unrealized P/L.

## Good next work

For Phase 2 data expansion, read and update
`docs/phase-2-execution-checklist.md` before moving to a new task.

1. Public-demo QA: search/filter smoke, Watchlist clear-all, CardDetail
   history cache, and mobile readability.
2. Public launch package: screenshots, setup, caveats, portfolio narrative.
3. Image coverage strategy: research source and safe ingestion plan first.
4. Watchlist refinements: CSV export later if still local-only and clearly
   labeled.
5. Focused automated smoke tests after approval.

## Do not start without approval

- Paid accounts, Stripe, or subscription gates.
- Database migration.
- eBay scraping or cross-source ingestion.
- Advanced AI prediction.
- Long-term history archive.
- Large redesign.
- TypeScript migration.

The next phase is honest product / analytics expansion, not copying another
market product.
