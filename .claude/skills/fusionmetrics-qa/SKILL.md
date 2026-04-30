---
name: fusionmetrics-qa
description: Use when validating FusionMetrics changes, reviewing terminal output, checking build results, smoke-testing UI, verifying lazy-loaded history, or deciding if a task is complete. Triggers — verify, smoke test, before commit, build result, lazy-load, "does this work", validate.
version: 1.0.0
category: QA
triggers:
  - verify
  - smoke test
  - before commit
  - build result
  - lazy-load
  - validate
  - does this work
  - is this done
---

# FusionMetrics QA & Validation

## When to use

- Before any commit that changes code.
- After receiving terminal output from the operator (build logs, workflow
  logs, verify output) — to interpret it correctly.
- When deciding whether a task is "done" or has a hidden regression.
- When the operator asks "does this actually work?" or pastes a network
  error / stack trace.

## Validation commands

Always run **both** locally before committing app or pipeline code:

```bash
node scripts/verify-data.js
npm run build
```

Optional but recommended for UI work:

```bash
npm run dev
# then DevTools → Network → click around
```

### What "passing" looks like

| Check | Healthy output |
|-------|----------------|
| `node scripts/verify-data.js` | `✓ 1258 cards, 1156 live prices (1156 with history, split shape), 9 invariants passed` |
| `npm run build` | `✓ built in <2s` with `dist/assets/index-*.js` around **622 kB raw / 88 kB gzip** (the 600 kB chunk warning is expected and acceptable) |
| `git status` after push | `nothing to commit, working tree clean` |

### What "failing" looks like and what it means

| Symptom | Likely cause |
|---------|--------------|
| `verify-data` says `inline shape (transitional)` | livePrices.json reverted to a pre-split state — investigate before continuing |
| `verify-data` says `< 1121 entries` | Coverage guard would block the bot. If we're in this state locally, livePrices.json is corrupted; restore from a previous bot commit |
| Bundle jumps back above ~700 kB | `priceHistory30d.json` accidentally bundled — check `src/data.js` for a static `import` of it (must be `fetch()` only) |
| `gh run list` shows the latest run **failed** with "Coverage guard FAILED" in logs | Pipeline did its job; do not weaken the guard. Diagnose JustTCG side instead |
| Workflow log shows `RATE_LIMITED` or `AUTH_ERROR` | Free-tier quota hit. Wait for 00:00 UTC reset; do not retry today |
| `gh run list` shows success but no `chore: weekly price update` commit | Coverage guard refused to write — bot saw no diff. Existing files preserved. This is correct behaviour |

## UI smoke-test checklist

Run `npm run dev`, open DevTools (Network + Console). On both desktop width
and mobile width (≤375 px):

- [ ] All 5 tabs render without console errors.
- [ ] **Value Scanner**: 1,258 cards visible by default. LIVE chip on priced
      rows; EST chip on the rest. Sort = "Most Undervalued" filters out EST
      cards (count drops to ~1,156). Clicking a row opens CardDetail.
- [ ] **Pricing Model**: scatter plot renders, no NaN axis labels.
- [ ] **Market Dynamics**: set-health cards show trend chip + bars; no
      sparkline (synthetic demand series was removed).
- [ ] **Box EV**: positive EV for SR-heavy sets; data-quality badge if a set
      is thin.
- [ ] **Watchlist**: empty state if 0 starred; aggregates correct after
      starring 3 cards; persists across hard reload (`fw-watchlist-v1` in
      localStorage).
- [ ] Header LIVE badge visible.

## Lazy-loading checklist (CardDetail price history)

- [ ] Initial page load shows **no** `priceHistory30d.json` request in
      Network tab.
- [ ] First click on a priced card → exactly **one** `/priceHistory30d.json`
      request (~150 kB gzip). Brief "Loading 30d history…" placeholder, then
      sparkline + "30d JustTCG history · N points".
- [ ] Click a different priced card → **no** new fetch (in-memory cache).
- [ ] Click an unpriced card (EST chip) → "Not enough JustTCG history"
      placeholder.
- [ ] Throttle network to **Offline**, hard-reload, click a card → "Price
      history unavailable" placeholder. **Distinct copy** from "Not enough
      history".
- [ ] Set network back to **Online**, click another card → fetch retries
      and succeeds.

## Data pipeline checklist

After any operator-triggered workflow run:

- [ ] `gh run watch` shows ✓ on every step including "Commit updated price
      files".
- [ ] If a `chore: weekly price update` commit landed: `git pull` then
      `node scripts/verify-data.js` passes with `(N with history, split
      shape)`.
- [ ] `cat public/priceUpdateLog.json | jq '{lastMode, lastGroup,
      lastRefreshedSets, lastMergedCount}'` shows expected values.
- [ ] `lastMergedCount >= 1121`.
- [ ] No machine-generated JSON has been hand-edited.

## Common failure meanings

- **`Cannot find module …`** at build time → check the import path; the
  static analyzer treats `assert { type: 'json' }` imports as bundled, while
  `fetch('/foo.json')` does not.
- **`unavailable`** state showing for every card during dev → the dev server
  isn't serving `public/priceHistory30d.json` (file missing, or you're on a
  branch where it hasn't been generated yet).
- **Sparkline renders but the date range toggle is missing** → card is in
  `limited` state (1–6 points). Range toggle only shows for `real` (≥7).
- **Bundle warning at 600 kB** → expected. We're at ~622 kB; the warning is
  just over the configured threshold and is documented in the "harden phase".

## Final response format

When validating someone else's work or your own pre-commit, end with:

1. Pass/fail summary line per check (verify, build, smoke test).
2. The exact `verify-data` line (paste it; don't paraphrase).
3. The exact `dist/assets/index-*.js` size (raw + gzip).
4. Anything unexpected — even a yellow flag — clearly called out, not
   buried.
5. A clear go/no-go: "ready to commit" or "block: \<reason\>".

If the operator pastes terminal output asking "is this OK?", reply with the
same 5-item structure rather than a freeform answer.
