---
name: fusion-qa-verify
description: Build verification, smoke tests, data-quality checks, and lightweight docs upkeep for FusionMetrics. Use before any commit, after any data refresh, and whenever the user asks "does this actually work".
version: 1.0.0
category: Testing & Documentation
triggers:
  - verify
  - smoke test
  - does this work
  - data quality
  - before commit
  - update CLAUDE.md
---

# FusionMetrics QA & Verify

## Pre-commit smoke test (always run before `git push`)
```bash
npm run build          # must succeed with no errors
# Inspect output:
# - transformed modules count should be >= 49
# - bundle size < 700 kB (warning at 600 kB is OK)
# - no "failed to resolve import" messages
```

## Tab-by-tab manual checklist
After `npm run dev`, click each tab:
| Tab | Must show | Must not show |
|-----|-----------|---------------|
| 🔍 Value Scanner | 1,258 cards, LIVE chips on priced rows, working filters | "$NaN", "undefined", empty rarity badges |
| 📈 Pricing Model | R² stats, calibration constants | Global β coefficient mismatch |
| 🌊 Market Dynamics | Demand/supply charts populated | Flat-zero sparklines |
| 📦 Box EV | Positive EV for SR-heavy sets, verdict card | Negative EV for premium sets (bug) |
| ⭐ Watchlist | Empty state if 0 starred; persists across reload | Stale counts on tab badge |

## Data quality gates
After any `fetch-cards.js` run:
```bash
# 1. Card count
jq 'length' src/cardData.json
# Expected: 1258

# 2. Per-set counts
jq 'group_by(.set) | map({set: .[0].set, n: length})' src/cardData.json
# Expected: FB01:140, FB02:140, FB03:164, FB04:159, FB05:159, FB06:123, FB07:125, FB08:125, FB09:123

# 3. Rarity distribution
jq 'group_by(.rarity) | map({r: .[0].rarity, n: length})' src/cardData.json
# Flag if C > 85% of set (scraper rarity-extraction failure)

# 4. Verified coverage
jq '[.[] | select(.verified)] | length' src/cardData.json
# Expected: >= 161 (current baseline; never decrease)
```

After any `update-prices.js` run:
```bash
jq 'length' src/livePrices.json
# Expected: >= 1156 (never decrease without explanation)
```

## Mobile verification
- Chrome DevTools → iPhone 14 Pro → reload
- Tab bar: horizontal scroll works, active tab visible
- Value Scanner: 2×2 summary grid, filters wrap, table scrolls horizontally
- Tap a card: full-screen CardDetail overlay (not cramped side panel)
- Rotate to landscape: layout reflows to split-panel at >768px

## Persistence checks
- Star 3 cards in Value Scanner → Watchlist count = 3
- Hard reload → Watchlist count still = 3
- Clear all → count = 0, localStorage `fw-watchlist-v1` removed

## Docs upkeep — when to touch CLAUDE.md
Update CLAUDE.md when:
- New tab added → add to Key Files table
- New verified-card coverage milestone → update coverage table
- New data source → add to "Data sources used"
- Model constants changed → update "Analytics model" section
Never rewrite CLAUDE.md top-to-bottom; surgical edits only.

## Release-readiness checklist (before calling a build "shippable")
- [ ] `npm run build` clean
- [ ] All 5 tabs render without console errors
- [ ] LIVE badge visible in header
- [ ] Mobile DevTools pass
- [ ] Watchlist persists across reload
- [ ] No `.env` or `cardData.json.bak` in `git status`
- [ ] Commit message follows `<type>: <area> <summary>`
- [ ] Branch is `claude/dbfw-market-analytics-1qh5D`
