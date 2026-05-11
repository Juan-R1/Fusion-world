# FusionMetrics Public-Beta Backlog

**Refreshed:** 2026-05-11
**Baseline commit:** `dca9b04 chore: approve P2-011 and add staging directory scaffold`

This backlog tracks the path from current portfolio-demo MVP to a credible
public beta. The trust foundation is complete; the Phase 2 data-depth layer
is just starting. Items here are in addition to the formal Phase 2 ladder
in `docs/phase-2-execution-checklist.md`.

Do not treat this as approval for scraping, accounts, payments, or paid-tier
work. Each item still needs a focused, scoped prompt before implementation.

---

## Shipped since 2026-05-01

Items previously in this backlog or surfaced by the architectural-audit run that have now landed.

| Item | Closed by | Notes |
|------|-----------|-------|
| Methodology trust disclosures (R², smoothed UC, extrapolated SPR, single-source) | Codex `02e9733` | R-036 closed; copy now distinguishes JustTCG live data from model estimates and states "not financial advice." |
| Phase 2 spec foundation (10 specs) | `ee6b6c4` → `b979b72` (P2-001 — P2-010) | Data model, premium metadata, SB staging, eBay comps, source confidence, graded comps, sealed products, expanded validation plan. |
| Phase 2 spec-tightening (R-001 drift closed) | `0522bb8`, `110d895`, `234672c`, `b844e00`, `9ef2135` (P2-018) | All 8 drift findings from the consistency audit resolved; D-033/D-034/D-035 logged. |
| Phase 2 staging directory scaffold | Codex `dca9b04` (P2-011) | `data-staging/` exists with README + .gitkeep; ready to receive approved fixtures. |
| Architectural-audit doc set (consistency, risk register, test gap, bundle, dashboard, decision log, open questions, methodology review) | CLA-01 — CLA-10 + CLA-25 — CLA-27 | New navigation surface in `docs/`. |
| AGENTS.md tightening | `da0d93c` | Reality-verification rule, dashboard-as-source-of-truth callout. |
| Skills cross-reference + Phase 2 task map | `52b2820` | `.claude/skills/README.md` upgraded to 13-skill navigation. |
| STATUS.md refresh | `869b3ee` | Reflects 12/18 Phase 2 tasks complete and current yellow flags. |

---

## P0 — Operator-only this week

These cost the operator <30 minutes each and unblock visible product progress.

| Item | Why it matters | Action | Risk | External data/API |
|------|----------------|--------|------|-------------------|
| Plausible analytics review (R-020) | Tag has been live since `01daa2e`; no one has read the dashboard. Public-beta decisions are being made without user-behavior signal. | Operator opens Plausible dashboard, jots findings into `docs/analytics-snapshot-2026-MM-DD.md`. Pre-staged prompt in `docs/operator-handbook.md`. | Low | No (read-only) |
| Approve P2-012 (premium metadata fixture) | First fixture commit unblocks every downstream UI badge / comp panel task in the Phase 2 ladder. | Operator pastes the embedded Codex prompt from `docs/operator-handbook.md`. | Low (sample fixture + validator, scoped) | No |
| Image coverage decision (R-017, Q-002) | ~40 of 1,258 cards have real Bandai images today. Blocks portfolio-grade visual polish and any UI surface that benefits from imagery. | Operator pastes the ChatGPT GPT-5 Thinking prompt from `docs/operator-handbook.md`; Codex commits the resulting decision doc. | Medium (rights/licensing call) | Maybe |

---

## P1 — Before public beta

| Item | Why it matters | Owner | Likely files | Risk |
|------|----------------|-------|--------------|------|
| Capture screenshots and short demo clip | Portfolio materials still reflect 2026-05-01 state; post-Methodology + Watchlist v2 visuals haven't been captured. | ChatGPT framing + Codex/operator capture | `docs/screenshot-plan.md`, captured assets | Low |
| Watchlist demo-data pass | Screenshots need useful local positions without inventing prices; recipe lives in `docs/watchlist-demo-data.md`. | Codex/operator | browser localStorage only | Low |
| Final search / filter / mobile smoke | Targeted Value Scanner search + CardDetail history-state + mobile checks from `docs/manual-qa-checklist.md`. | Codex/operator | browser only | Low |
| Shareable card / set URLs | Public-beta users will want a link per card or set; deep-links matter for sharing. Needs URL state without a backend. | Claude | `src/App.jsx`, tab state | Medium |
| Deployment-readiness check | Confirm Vercel prod matches branch state; env assumptions; static-asset paths for new `priceHistory30d.json` lazy fetch. | Codex/operator | Vercel dashboard, `docs/deployment-check.md` | Low |
| Focused UI smoke tests (Vitest, P3-staged) | A regression in `data.js` ranking logic or Watchlist v2 migration would currently ship undetected. Spec at `docs/test-coverage-gap-analysis.md`. | Claude or Codex, after approval | new `tests/` dir, new dev deps (Vitest + RTL) | Medium (adds 2 deps; needs approval) |
| Watchlist export/import plan | Local-only users need a portable way to preserve positions before accounts exist. | ChatGPT plan, Claude implement | `src/hooks/useWatchlist.js`, new export UI | Medium |

---

## P2 — Phase 2 implementation ladder (after operator approval)

These are the formal P2-XXX tasks. See `docs/phase-2-dashboard.md` for live status.

| Task | Depends on | Risk | Notes |
|------|------------|------|-------|
| P2-012 — Premium metadata fixture + validator | P2-011 (done) | 3/5 | First real script; spec at `docs/premium-metadata-schema.md`. |
| P2-013 — eBay sold comps CSV fixture + validator | P2-011 (done) | 3/5 | Manual research only; no scraping. Spec at `docs/ebay-comps-import-spec.md`. |
| P2-014 — Importer | P2-012 + P2-013 | 4/5 | Reads fixtures, writes approved generated artifact path. |
| P2-015 — UI badges/filters | P2-014 + premium artifact | 3/5 | Spec at `docs/premium-metadata-schema.md` § 12. Cautious copy required. |
| P2-016 — CardDetail comps panel | P2-014 + comps artifact | 3/5 | Raw/graded separation enforced. |
| P2-017 — Backend decision | Trigger Checklist in execution-checklist § 7 | 5/5 | Currently 0 triggers fired. Stay static JSON. |

---

## P3 — Later (deferred)

| Item | Why deferred |
|------|--------------|
| Long-term history archive (>30d) | Needs a data contract decision (file vs. backend); JustTCG-native 30d is enough today. |
| CSV export from Watchlist | Useful but should follow the export/import schema design from P1. |
| Source-variance warning refinement | Codex's Methodology edits cover the single-source disclosure for now; deeper UI awaits multi-source comps (post-P2-013). |
| Mobile chart/table scroll polish | Box EV narrow layout already passes; remaining items are nice-to-have. |
| Outlier / manipulation detection | Needs source variance + reviewed comp history. Spec'd in `docs/source-confidence-spec.md` but not implementable until P2-013+ data exists. |
| Paid JustTCG tier evaluation | Free tier with rotation is sufficient today; revisit per D-001 expiry trigger. |
| Automated image ingestion | Gated by Q-002 (image coverage strategy decision). |

---

## Monetizable v1 prerequisites

All items below are gated behind: (a) accounts + auth, (b) measured recurring use via Plausible, (c) explicit legal posture. None should be started before public-beta traction is real.

| Item | Why it matters | Risk |
|------|----------------|------|
| Public-beta usage feedback | Monetization should follow real demand, not assumptions. | Low (collection-only) |
| Accounts + cloud sync design | Required for cross-device Watchlist and alerts. | High (backend + privacy) |
| Alerts engine | Needs accounts or durable local notification strategy; trust copy must stay cautious. | High |
| Payments (Stripe) | Only after a validated value prop and account model. | High |
| Legal / public caveats | Monetized market tools need stronger disclaimers; spec-only until close to launch. | Medium |
| Operational data cadence | Paid users will expect predictable freshness; quota handling and status visibility must be public. | High |

---

## Top-3 risks to act on this cycle

Pulled from `docs/risk-register.md` § 9 (May 2026 update):

1. **R-002 — Agent reality-drift.** Multi-agent sessions describe completed work that exists on origin but not on the local clone. Mitigation in `AGENTS.md` § 9 ("Reality verification first") needs continued enforcement.
2. **R-017 — Image licensing exposure.** Strategy doc queued; blocks visual polish past current state.
3. **R-020 — Plausible analytics never reviewed.** First read is 15 minutes; blocks honest user-behavior decisions.

R-001 (spec drift) and R-036 (Methodology gaps) are closed.

---

## Current recommendation

Order of operator action this week:

1. **15-minute Plausible review** (R-020). Lowest-cost; informs every other decision.
2. **Image strategy decision** (R-017 / Q-002). One ChatGPT-Thinking session + one Codex doc commit. Unblocks visual polish.
3. **Approve P2-012**. First real fixture+validator; opens the rest of the Phase 2 ladder.

Each of these has a ready-to-paste prompt in `docs/operator-handbook.md`. None depend on each other; can be done in any order.

After all three: capture screenshots, run the manual QA checklist, and the public-beta launch surface is materially complete.
