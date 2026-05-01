---
name: fusionmetrics-launch
description: Use when preparing FusionMetrics portfolio launch, screenshots, README, demo script, public-demo checklist, case study, recruiter-facing story, or deployment-readiness review.
version: 1.2.0
category: Launch
triggers:
  - launch
  - portfolio
  - screenshots
  - demo script
  - public demo
  - case study
  - recruiter
  - README
---

# FusionMetrics Launch

## When to use

Use this skill for launch and portfolio artifacts:

- `README.md`
- `STATUS.md`
- `docs/demo-script.md`
- `docs/portfolio-case-study.md`
- `docs/screenshot-plan.md`
- `docs/watchlist-demo-data.md`
- `docs/public-beta-backlog.md`
- `docs/manual-qa-checklist.md`
- `docs/agent-handoff.md`
- screenshot or case-study planning

## Non-negotiable rules

- Do not claim unsupported accuracy, official affiliation, financial advice,
  guaranteed profit, or production-grade monetization.
- Keep observed JustTCG data, model estimates, and local-only Watchlist fields
  clearly separated.
- Do not add scraping, paid-tier assumptions, accounts, Stripe, alerts,
  database work, or generated data changes.
- Keep docs concise and current; avoid repeating the full project history.

## Checklist

1. README explains what the app does, trust model, setup, validation, and
   limitations.
2. Demo script shows Value Scanner, CardDetail, Market Dynamics, Box EV,
   Watchlist, Methodology, and Provenance.
3. Screenshot plan includes desktop and mobile Box EV after the responsive fix,
   plus Watchlist v2 with local demo positions.
4. Watchlist demo data is clearly browser-local and resettable; it must not be
   described as real holdings or app-generated data.
5. Public-beta backlog separates P0 public-demo tasks, P1 public-beta work, P2
   later work, and monetization prerequisites.
6. Current limitations mention free-tier quota, image coverage, approximate EV,
   no accounts/alerts, and no cross-source pricing.
7. Public claims stay conservative and verifiable.

## Launch execution order

1. Run `node scripts/verify-data.js`, `npm run build`, and `git status`.
2. Start `npm run dev` only for local screenshot or visual QA work.
3. Capture screenshots from `docs/screenshot-plan.md`.
4. Seed Watchlist demo data only from `docs/watchlist-demo-data.md`, refresh,
   capture Watchlist, then reset localStorage.
5. Use `docs/demo-script.md` for the 60-second and 3-minute walkthroughs.
6. Use `docs/deployment-check.md` only after an approved deploy or read-only
   production review.

## Tool routing

- **Codex / repo tools:** docs, validation, branch status, narrow commits.
- **Browser / preview:** screenshot capture, local visual QA, narrow-width
  checks around both phone width and narrow desktop windows.
- **GitHub:** push, issue, PR, or release workflow only when requested; never
  run Actions workflows as part of launch prep.
- **Vercel:** read-only deployment status or production smoke checks after
  approval; do not deploy without explicit approval.
- **Figma:** later only, after screenshots are captured, for portfolio deck,
  screenshot framing, case-study visuals, UI concept mockups, or design-system
  polish.

## Validation commands

```bash
git diff --check
node scripts/verify-data.js
```

Run `npm run build` if docs import app assets or if code changed in the same
commit.

## Final response format

Report docs changed, commit hash, validation result, launch-readiness notes,
remaining public-demo risks, and exact next commands.
