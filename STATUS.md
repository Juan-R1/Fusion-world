# FusionMetrics — Status Snapshot

**Date:** 2026-04-27
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Operate & Harden (post-MVP)

---

## TL;DR

The dashboard is live and feature-complete. The build phase ended at v1.0; we're
hardening the foundations so the data is trustworthy and the platform is
operationally dependable. The weekly automation now fires successfully, the CI
safety net is in place, and the trust fix shipped: synthetic sparklines have
been replaced with real JustTCG 30d priceHistory across the UI.

---

## What's healthy

| Area | Status | Evidence |
|------|--------|----------|
| Public site | Live | `fusion-metrics-jet.vercel.app` (Vercel deploy on push to `main`) |
| Card database | 1,258 cards, ~92% verified | `src/cardData.json`, last refreshed `4dd6c62` |
| Live pricing | Active, weekly cron firing | `6878660` (first bot commit), `c8bcab7` (latest) |
| Price history | Real JustTCG 30d, 1,156 / 1,156 priced cards | `c8bcab7`; fetched via `priceHistoryDuration=30d` |
| Sparklines | Real history only — synthetic generation removed | `3d0aa52 feat: replace synthetic sparklines with real JustTCG priceHistory` |
| Trust labels | `priceStatus` (live/estimated) and `historyState` (real/limited/none) on every card | `src/data.js` |
| CI gate | Build + 8-invariant data check on every push/PR | `.github/workflows/ci.yml`, `scripts/verify-data.js` |
| Analytics | Plausible enabled for production domain | `index.html:43` |

---

## Recent commits (most recent first)

| SHA | Subject |
|-----|---------|
| `bd2aec9` | chore: retire one-shot probe; rename probe-history → diagnose-history |
| `3d0aa52` | feat: replace synthetic sparklines with real JustTCG priceHistory |
| `c8bcab7` | chore: weekly price update (bot, after workflow_dispatch) |
| `beb4e0b` | feat: fetch JustTCG priceHistory in update-prices and verify schema |
| `7c7f5e6` | fix: probe-history.js — recognize JustTCG `{p, t}` priceHistory format |
| `01daa2e` | chore: enable Plausible analytics for production domain |
| `ce448ae` | chore: add data-integrity smoke test to CI |
| `897b1c1` | chore: add CI build-check workflow |

Each commit is small, single-purpose, and reversible. CI runs on each.

---

## The smoke test (CI gate)

`scripts/verify-data.js` runs before every build and asserts eight invariants:

1. `cardData.json` parses and has exactly 1,258 entries
2. Every card has a non-empty `code`, `set`, and `rarity` string
3. No duplicate `code` values
4. Every rarity is one of `L / C / UC / R / SR / SCR / SPR`
5. Every set matches `/^FB0[1-9]$/`
6. `livePrices.json` parses and has > 0 entries (keeps `HAS_LIVE_PRICES` truthy)
7. Every `marketPrice` is a finite positive number — no NaN, Infinity, null, or zeros
8. Every `history` entry (when present) is an array of `{p, t}` points where both fields are finite positive numbers

A failure here blocks the build and the deploy.

---

## Yellow flags worth tracking

- **Bundle size jumped to 1,351 kB / 132 kB gzip** (was 640 / 89 before history
  was bundled). The 30d `priceHistory` arrays now live inside `livePrices.json`,
  which is inlined into the bundle. Lazy-loading or splitting live price data is
  the next technical-debt item — mobile users on slow connections will feel the
  current size. Out of scope for the trust fix; queued for the next cleanup pass.
- **Live-price coverage was briefly wobbly.** First cron run (Apr 18) wrote only
  475 entries — likely JustTCG free-tier rate-limit truncation mid-run. The next
  bot run (Apr 25) recovered to the full **1,156** and now carries 30d history.
  The smoke test passed in both cases, so CI didn't catch the dip. Worth adding
  a "minimum entries" guard so the bot refuses to commit a partial dataset.
- **No type system, no test suite.** The CI gate is build + 8 invariants only.
  A logic regression in `data.js` would still ship.
- **`priceHistory.json` and `accumulate-prices.js` are now redundant** for
  sparklines (JustTCG serves history natively). Kept in place as a possible
  long-term archive layer; will be re-evaluated after several cycles of stable
  JustTCG history.

---

## What's queued next (per CLAUDE.md §10)

**Done in P1:**
- ✅ CI build-check workflow
- ✅ Data-integrity smoke test
- ✅ Plausible analytics enabled
- ✅ Real JustTCG priceHistory replaces synthetic sparklines
- ✅ Estimated cards excluded from undervalued/overvalued rankings

**Still in P1:**
- [ ] Cross-reference spot-check: 10 cards JustTCG vs. TCGPlayer/PriceCharting

**P2 (next 2–4 weeks):**
- [ ] Lazy-load / code-split `livePrices.json` (bundle size now 1,351 kB)
- [ ] Scraper reliability pass (retry, backoff, "minimum entries" guard)
- [ ] Image coverage (~40 cards have real images today)
- [ ] In-app data-provenance panel
- [ ] "About the model" page

**Resist:** new tabs, new analytics models, new dependencies. The product is
feature-complete; the work right now is trust, not novelty.

---

## How to resume in a fresh session

1. `git checkout claude/dbfw-market-analytics-1qh5D && git pull`
2. Read `CLAUDE.md` (full continuity document)
3. Pick up at `§10 P1` (cross-reference spot-check is next)
4. For any commit/push, follow the `.claude/skills/fusion-git-flow` skill
5. For pre-commit verification, run `npm run build && node scripts/verify-data.js`
