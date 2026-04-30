---
name: fusionmetrics-qa
description: Use when validating FusionMetrics changes, reviewing terminal output, checking build results, smoke-testing UI, verifying lazy-loaded history, or deciding if a task is complete. Triggers — verify, smoke test, before commit, build result, lazy-load, "does this work", validate.
version: 1.1.0
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
- After build logs, workflow logs, verify output, or browser smoke-test notes.
- When deciding whether a task is actually done.
- When checking trust surfaces: provenance, freshness, Methodology copy, or
  price-history states.

## Required local checks

For code or pipeline changes, run both:

```bash
node scripts/verify-data.js
npm run build
```

For docs-only changes, `node scripts/verify-data.js` is enough unless the
change affects app imports or visible UI.

Healthy outputs:

| Check | Healthy output |
|-------|----------------|
| `node scripts/verify-data.js` | `✓ 1258 cards, 1156 live prices (1156 with history, split shape required), 9 invariants passed` |
| `npm run build` | `✓ built in <2s`; `dist/assets/index-*.js` around 627–631 kB raw / 89–90 kB gzip |
| `git status` after commit | clean except expected ahead-of-origin commits |

## Trust smoke-test checklist

Use `npm run dev` only when UI behavior needs manual confirmation.

- [ ] Header and existing tabs render without console errors.
- [ ] Methodology tab is visible and readable on desktop and mobile.
- [ ] Methodology copy separates JustTCG data from model estimates and says
      this is not financial advice.
- [ ] Provenance footer/status chip is visible.
- [ ] Provenance modal opens and shows mode, group, refreshed sets, fetched
      count, merged count, and timestamps.
- [ ] CardDetail opens from Value Scanner.
- [ ] Live cards show `Source: JustTCG · refreshed <relative time>`.
- [ ] Estimated cards show model-estimate / no live JustTCG timestamp copy.
- [ ] CardDetail price history still loads from `/priceHistory30d.json`.
- [ ] "Price history unavailable" is distinct from "Not enough JustTCG
      history."

## Data and ranking checks

- [ ] `src/livePrices.json` contains current prices only.
- [ ] `public/priceHistory30d.json` exists and is a cardCode-keyed object of
      `{p,t}` arrays.
- [ ] `public/priceUpdateLog.json` exists and powers provenance.
- [ ] Estimated cards remain visible.
- [ ] Estimated cards are excluded from undervalued / overvalued rankings.
- [ ] No synthetic price history, market movement, or demand trend visual has
      been introduced.
- [ ] `docs/price-spot-check-2026-04-30.md` exists and records the 9/10
      aligned, 1 unclear external price spot-check result.

## Common failure meanings

| Symptom | Likely cause / response |
|---------|-------------------------|
| `verify-data` fails split-shape checks | Data contract has been broken; stop and inspect generated files and recent commits. |
| `< 1121 live prices` | Known-good coverage floor was breached; do not weaken the guard. |
| Bundle jumps materially above the current range | Price history or another large file may have been bundled accidentally. |
| Every card shows history unavailable | Dev server is not serving `public/priceHistory30d.json`, or the fetch path was changed. |
| Workflow shows 401/403/429 | Auth or quota issue. Wait for operator direction; do not retry blindly. |
| Workflow succeeds but no data commit lands | No diff or guard-protected write; verify before assuming failure. |

## Final response format

When validating work, end with:

1. Pass/fail summary per check.
2. Exact `verify-data` line.
3. Exact bundle size if build was run.
4. Manual smoke-test notes if performed.
5. Anything unexpected or risky.
6. Clear go/no-go.
