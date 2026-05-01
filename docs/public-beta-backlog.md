# FusionMetrics Public-Beta Backlog

This backlog starts from the 2026-05-01 portfolio-demo checkpoint. The app is
portfolio-demo ready, but public beta and monetization need more validation,
operational safety, and user utility.

Do not treat this as approval to add external scraping, accounts, payments, or
paid-tier assumptions. Each item still needs a focused implementation prompt.

## P0 Before Public Demo

| Item | Why it matters | Owner | Likely files | Risk | External data/API | Should wait? |
|------|----------------|-------|--------------|------|-------------------|--------------|
| Capture screenshots and demo clips | Portfolio materials need current visuals after the Box EV mobile fix. | ChatGPT + Codex | `docs/screenshot-plan.md`, captured assets | Low | No | No |
| Watchlist demo data pass | Screenshots need useful local positions without fake generated app data. | Codex | `docs/watchlist-demo-data.md`, browser localStorage only | Low | No | No |
| Final search/filter smoke | Manual checklist still has targeted Value Scanner search checks open. | Codex | `docs/manual-qa-checklist.md`, browser only | Low | No | No |

## P1 Before Public Beta

| Item | Why it matters | Owner | Likely files | Risk | External data/API | Should wait? |
|------|----------------|-------|--------------|------|-------------------|--------------|
| Image coverage strategy | Missing card images weaken credibility and screenshot quality. Needs a safe source and ingestion plan before generated data changes. | ChatGPT plan, Claude implement later | New research doc, later data pipeline | Medium | Maybe | Plan now, build later |
| Focused UI smoke tests | Public beta needs repeatable coverage for tabs, CardDetail history, provenance, Watchlist localStorage, and mobile layout. | Claude or Codex | Test config only after approval | Medium | No | Wait for approval |
| Watchlist export/import plan | Local-only users need a way to preserve positions before accounts exist. | ChatGPT plan, Claude/Codex implement | `src/tabs/Watchlist.jsx`, `src/hooks/useWatchlist.js` | Medium | No | Plan next |
| Shareable card/set URLs | Public beta users will want to link a card or set view. Needs routing without a database. | Claude | `src/App.jsx`, tab/detail components | Medium | No | Soon |
| Deployment readiness check | Vercel production should match branch state, env assumptions, and static asset paths. | Codex | Vercel dashboard/README docs | Low | No | Soon |
| Source-variance warning refinement | External spot-check was good, but public beta should communicate single-source limitations clearly. | ChatGPT + Codex | `src/tabs/Methodology.jsx`, README | Low | No | Soon |
| Mobile QA follow-up | Narrow layouts pass P0 checks, but chart/table scroll polish can improve demo quality. | Codex | `src/tabs/*.jsx`, components | Low-Medium | No | After screenshots |

## P2 Later

| Item | Why it matters | Owner | Likely files | Risk | External data/API | Should wait? |
|------|----------------|-------|--------------|------|-------------------|--------------|
| Long-term history archive | Enables trend analytics beyond JustTCG 30d, but needs a clear data contract. | ChatGPT plan, Claude implement | New public/data file and scripts | High | Maybe | Yes |
| CSV export | Useful for Watchlist, but should follow export/import schema design. | Codex | Watchlist files | Low-Medium | No | Yes |
| eBay sold comps research | Cross-source validation is useful, but scraping and matching variants are risky. | ChatGPT research | Research docs first | High | Yes | Yes |
| Outlier/manipulation detection | Helpful for investor tools, but needs stronger history and source variance. | ChatGPT plan | Analytics docs first | High | Maybe | Yes |
| Paid JustTCG tier evaluation | More quota may improve freshness, but does not solve source variance or methodology. | ChatGPT + operator | Docs only until approved | Medium | Yes | Yes |
| Automated image ingestion | Improves visuals, but must avoid brittle or rights-unclear sources. | Claude later | Pipeline/data files | High | Yes | Yes |

## Monetizable V1 Prerequisites

| Item | Why it matters | Owner | Likely files | Risk | External data/API | Should wait? |
|------|----------------|-------|--------------|------|-------------------|--------------|
| Public-beta usage feedback | Monetization should follow real user demand, not assumptions. | ChatGPT + operator | Docs/research | Low | No | No |
| Accounts and cloud sync design | Required for cross-device Watchlist and alerts, but adds privacy and support burden. | ChatGPT plan, Claude later | New backend only after approval | High | Maybe | Yes |
| Alerts design | Needs accounts or durable local notification strategy; also needs careful trust copy. | ChatGPT plan | Product docs | High | Maybe | Yes |
| Payments / Stripe | Only after a validated value prop and account model. | ChatGPT + operator | Payment integration later | High | Yes | Yes |
| Legal/public caveats | Monetized market tools need stronger disclaimers and source transparency. | ChatGPT | README, Methodology, terms docs | Medium | No | Before monetization |
| Operational data cadence | Paid users need predictable freshness, quota handling, and status visibility. | Claude/Codex | Pipeline docs and UI status | High | Yes | Before monetization |

## Current Recommendation

Proceed with screenshots, a short demo, and portfolio case-study polish now.
For public beta, prioritize image coverage strategy, focused UI smoke tests, and
local-only Watchlist export/import planning before adding external sources or
account systems.
