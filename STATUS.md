# FusionMetrics — Status Snapshot

**Date:** 2026-04-25
**Branch:** `claude/dbfw-market-analytics-1qh5D`
**Production:** https://fusion-metrics-jet.vercel.app/
**Phase:** Operate & Harden (post-MVP)

---

## TL;DR

The dashboard is live and feature-complete. The build phase ended at v1.0; we're
now hardening the foundations so the data is trustworthy and the platform is
operationally dependable. This week the weekly automation fired for the first
time and we added the CI safety net.

---

## What's healthy

| Area | Status | Evidence |
|------|--------|----------|
| Public site | Live | `fusion-metrics-jet.vercel.app` (Vercel deploy on push to `main`) |
| Card database | 1,258 cards, ~92% verified | `src/cardData.json`, last refreshed `4dd6c62` |
| Live pricing | Active, weekly cron firing | `6878660 chore: weekly price update` (first bot-authored commit) |
| Price history | First real snapshot landed | `869de38`; rolling 4-week window now accumulating |
| CI gate | Build + data-integrity check on every push/PR | `.github/workflows/ci.yml` |
| Analytics | Plausible enabled for production domain | `index.html:43` |

---

## This session's commits (most recent first)

| SHA | Subject |
|-----|---------|
| `01daa2e` | chore: enable Plausible analytics for production domain |
| `ce448ae` | chore: add data-integrity smoke test to CI |
| `897b1c1` | chore: add CI build-check workflow |

Each commit is small, single-purpose, and reversible. CI runs on each.

---

## The smoke test (CI gate)

`scripts/verify-data.js` runs before every build and asserts seven invariants:

1. `cardData.json` parses and has exactly 1,258 entries
2. Every card has a non-empty `code`, `set`, and `rarity` string
3. No duplicate `code` values
4. Every rarity is one of `L / C / UC / R / SR / SCR / SPR`
5. Every set matches `/^FB0[1-9]$/`
6. `livePrices.json` parses and has > 0 entries (keeps `HAS_LIVE_PRICES` truthy)
7. Every `marketPrice` is a finite positive number — no NaN, Infinity, null, or zeros

A failure here blocks the build and the deploy.

---

## Yellow flags worth tracking

- **Live-price coverage regressed.** Was 1,156 entries before the first cron run;
  is now **475**. Likely JustTCG free-tier rate-limit truncation mid-run. Data
  quality is fine, breadth dropped. Action: inspect next Monday's run logs;
  consider a "minimum entries" guard before the bot commits.
- **`priceHistory.json` has 1 real snapshot.** Sparklines in `CardDetail` are
  still mostly synthetic. They become trustworthy after ~4 weekly snapshots —
  earliest week of May 2026. Until then, do not market "real price history."
- **No type system, no test suite.** The CI gate is build + invariants only. A
  logic regression in `data.js` would still ship.
- **Bundle size at 640 kB** (89 kB gzip). One step over the 600 kB warning.
  Adding FB10 will require lazy-loading `cardData.json`.

---

## What's queued next (per CLAUDE.md §10)

**Done in P1:**
- ✅ CI build-check workflow
- ✅ Data-integrity smoke test
- ✅ Plausible analytics enabled

**Still in P1:**
- [ ] Cross-reference spot-check: 10 cards JustTCG vs. TCGPlayer/PriceCharting

**P2 (next 2–4 weeks):**
- [ ] Distinguish real vs. synthetic sparklines in `CardDetail.jsx` until
      ≥4 weekly history snapshots exist
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
