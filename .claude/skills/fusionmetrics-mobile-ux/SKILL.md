---
name: fusionmetrics-mobile-ux
description: Use when checking FusionMetrics mobile or narrow-width layout, table overflow, modal readability, footer overlap, responsive cards, or public-demo visual polish.
version: 1.1.0
category: QA
triggers:
  - mobile
  - narrow viewport
  - responsive
  - overlap
  - modal readability
  - table overflow
  - public demo polish
---

# FusionMetrics Mobile UX

## When to use

Use this skill for mobile or narrow-width work in:

- `src/App.jsx`
- `src/tabs/*.jsx`
- `src/components/CardDetail.jsx`
- `src/components/ProvenanceFooter.jsx`
- `docs/manual-qa-checklist.md`

## Non-negotiable rules

- Do not change analytics formulas, pricing logic, generated data, scripts, or
  workflows.
- Prefer containment first: horizontal scroll, stacked cards, wrapping labels,
  and sane `minWidth` / `maxWidth`.
- Keep desktop behavior intact unless the desktop layout is also broken.
- Do not hide required trust labels, LIVE/EST chips, freshness, provenance, or
  methodology caveats to make space.
- No new dependencies.

## Checklist

1. Check Value Scanner table and CardDetail modal around 390-430 px width.
2. Check Pricing Model and Market Dynamics fixed-width SVG charts.
3. Check Box EV top-card rows, assumptions, rarity EV, and verdict cards.
4. Check Watchlist summary, table, inputs, and clear-all button.
5. Check Methodology cards and Provenance modal.
6. Confirm footer does not block important content.
7. Check narrow desktop widths, not just phone width; the Box EV fix was a
   narrow-window breakpoint issue.
8. Update `docs/manual-qa-checklist.md` only when a manual or implementation
   check materially changes.

## Validation commands

```bash
npm run build
node scripts/verify-data.js
```

Run `npm run dev` for visual smoke tests when available.

## Final response format

Report files changed, commit hash, build result, verify-data result, viewport
smoke notes, remaining mobile risks, and what was deliberately not changed.
