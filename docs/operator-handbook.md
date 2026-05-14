# FusionMetrics Operator Handbook

**Last refreshed:** 2026-05-14
**Baseline commit:** `66285c4 fix: P3-008 follow-up — regenerate package-lock.json`

> Single doc for the human operator. Every prompt here is ready to paste.
> If you're reading this and don't know what to do next, jump to § 6
> (decision flowchart).

---

## 1. What you do

Phase 2 closed. Phase 3 operate-and-harden has shipped 11 / 14 tasks
including the SessionStart hook (R-002 mitigated), cross-source
spot-check protocol, backend pre-stage plan, sample-gate promotion
runbook, model recalibration, production error capture, workflow
failure alerts, Watchlist CSV export, and the 20-case Vitest suite
(P3-008) wired into CI. **The agent-doable backlog is empty.**

Your remaining responsibilities:

### (a) Merge PR #2

Standing PR `claude/dbfw-market-analytics-1qh5D` → `main`. CI green;
fast-forward eligible. No user-visible change (docs / tests / small
additive features). Merge whenever you want a clean checkpoint.

### (b) Operator-only Phase 3 tasks

- **P3-010** — Set Rankings / Chase Radar UX spec (Q-034). Author or
  hand to ChatGPT GPT-04. Output: `docs/set-rankings-spec.md`.
- **P3-011** — First real eBay comps fill. Use
  `docs/sample-gate-promotion-runbook.md`. 10–20 cards is enough to
  start.
- **P3-012** — First real premium-metadata fill. Same runbook. ~50
  cards validates the surface.

### (c) Standing cadences

- **R-020 Plausible weekly read.** 15 min, solo. § 5 checklist.
- **P3-003 quarterly recalibration.** Next due 2026-08-12.
- **P3-007 cross-source spot-check.** First run pending; quarterly
  thereafter.

### (d) Gated future tasks (do NOT start without operator approval)

- **P2-017 backend** — only if a Backend Trigger Checklist condition
  fires. Pre-stage plan is ready: `docs/backend-prestage-plan.md`.
- **R-055 Vite 8 upgrade** — closes the esbuild dev-server advisory.
  Breaking; needs a dedicated Codex task with explicit smoke tests.

### Open questions: all P0 closed

`docs/open-questions.md` rollup as of 2026-05-12: **13 questions
closed (Q-001 / Q-002 / Q-003 / Q-011..Q-015 / Q-020 / Q-022..Q-024 /
Q-035), 9 open (none P0).** No question gates current implementation
work.

---

## 2. Ready-to-paste prompt: approve P2-012 (Codex)

Paste this to Codex (gpt-5.5 extra-high). Single commit. Lowest-risk
"real code" task remaining; produces the first fixture + validator pair.

```text
Build the P2-012 premium metadata fixture and validator.

Read first:
- AGENTS.md
- docs/phase-2-execution-checklist.md (P2-012 row + Operating Rules +
  Forbidden Files)
- docs/premium-metadata-schema.md (the canonical spec for this fixture)
- docs/data-model-v2.md § 7 (premium_metadata entity)
- docs/expanded-data-validation-plan.md
- .claude/skills/fusionmetrics-pipeline/SKILL.md
- .claude/skills/fusionmetrics-qa/SKILL.md

Preflight:
  git fetch --all
  git pull --ff-only
  git status
  node scripts/verify-data.js
Confirm working tree clean and verify reports
"1258 cards, 1156 live prices (1156 with history, split shape required),
9 invariants passed". Confirm origin includes dca9b04 (P2-011 scaffold).

Allowed files (one commit only, creating / editing the five below):
- data-staging/premium-metadata/sample.json (new)
- data-staging/premium-metadata/README.md (new)
- scripts/validate-premium-metadata.js (new)
- docs/phase-2-execution-checklist.md (edit — mark P2-012 Complete, add
  ledger row, update Next Recommended Task to P2-013)
- docs/phase-2-dashboard.md (edit — bump Complete from 12 to 13, update
  Next-up to P2-013, add commit SHA in § 2)

Forbidden: every other file. Do not touch src/*, .github/workflows/*,
generated JSON, AGENTS.md, STATUS.md, any other doc, any skill file,
package.json. Do not edit scripts/update-prices.js or
scripts/verify-data.js.

Fixture requirements (data-staging/premium-metadata/sample.json):
- Top-level shape: { version: 1, updatedAt: ISO timestamp, items: { ... } }
- 5 to 8 illustrative rows. Each item:
  - cardCode (must match a real card in src/cardData.json)
  - premiumFlags (array; values from premium-metadata-schema.md § 5)
  - collectorTags (array; values from § 6)
  - riskTags (array; values from § 7)
  - gradeUpside ({ status: 'unknown', confidence: 'low' or 'unknown',
    sourceRefs: [], notes: short string })
  - confidence ('high', 'medium', or 'low')
  - sourceRefs (array, MUST be non-empty; use 'manual-review' for the
    sample)
  - notes (short rationale)
  - updatedAt (ISO timestamp)
- Use ONLY canonical vocabulary from premium-metadata-schema.md. No
  invented flag names.
- Mark the file's lead comment / README as illustrative-only, NOT active
  production data.

README (data-staging/premium-metadata/README.md):
- States the fixture is illustrative only; not consumed by the app.
- Lists which spec governs (premium-metadata-schema.md) and which
  validator gates it (validate-premium-metadata.js).
- States that any move from staging to active data requires explicit
  operator approval and the validator must pass.
- Reiterates: no buy/sell/guarantee language, no investment claims.

Validator requirements (scripts/validate-premium-metadata.js):
- Plain Node ESM, no dependencies.
- Reads data-staging/premium-metadata/sample.json AND
  src/cardData.json.
- Enforces:
  - Root object has version (=== 1), updatedAt (valid ISO), items
    (object).
  - Every key in items matches its item.cardCode.
  - Every cardCode exists in src/cardData.json.
  - premiumFlags is an array of canonical flag enum values.
  - collectorTags / riskTags arrays use canonical vocabulary.
  - confidence ∈ {'high','medium','low'}.
  - sourceRefs is a non-empty array of strings.
  - updatedAt is a valid ISO timestamp.
  - gradeUpside.status ∈ {'unknown','notReviewed','candidate',
    'confirmed','avoid'} per schema.
  - gradeUpside cannot be 'confirmed' without sourceRefs.
- Exit code: 0 on success with success summary line, 1 on any
  violation with clear failure message naming the first violating
  entry.
- Does NOT consume the fixture in app code — validator-only.

Phase 2 execution checklist edits:
- § 4 (Master Checklist): change P2-012 Status from "Needs user approval"
  to "Complete". Notes: "Approved by operator via operator-handbook § 2.
  Sample fixture + validator only. Not consumed by app."
- § 5 (Completed Work Ledger): add a new dated row with the new commit
  SHA.
- § 10 (Next Recommended Task): change to "P2-013 Build sample eBay CSV
  fixture only after approval".

Phase 2 dashboard edits:
- § 1: bump Complete to 13 / 18. Change Next-up to P2-013.
- § 2: update P2-012 row Status to "✅ Complete", add the new commit SHA
  in "Closed by".
- § 4 (Approval-gate cluster): remove P2-012 row; P2-013 is now the next
  gate.

Validate:
  node --check scripts/validate-premium-metadata.js
  node scripts/validate-premium-metadata.js
  git diff --check
  node scripts/verify-data.js
The fixture validator must pass with a "✓ N items validated" style line.
verify-data.js must still pass split shape with 9 invariants.

Commit message: feat: P2-012 — premium metadata sample fixture + validator

Final response per AGENTS.md § 8:
1. Files changed.
2. Commit hash.
3. Validator run result (paste exact line).
4. verify-data line.
5. Working tree status.
6. Exact commands operator should run next:
   - git push origin claude/dbfw-market-analytics-1qh5D
   - Decide whether to approve P2-013 next; paste handbook § 3 prompt.

Stop conditions:
- Any forbidden file touched.
- sample.json contains any flag/tag/value not in the canonical
  vocabulary.
- Validator passes on a row that should fail (run it against an
  intentionally-broken row in a scratch test if you want to be sure).
- Any commit message implies investment certainty.
- Any cardCode in the fixture doesn't exist in src/cardData.json.
- Fixture size grows above 200 lines.
```

---

## 3. Ready-to-paste prompt: approve P2-013 (Codex)

Paste this after P2-012 commits cleanly and you've pushed.

```text
Build the P2-013 eBay sold comps CSV fixture and validator.

Read first:
- AGENTS.md
- docs/phase-2-execution-checklist.md (P2-013 row + Operating Rules)
- docs/ebay-comps-import-spec.md (the canonical spec for this fixture)
- docs/data-model-v2.md § 10 (ebay_sold_comps entity)
- docs/expanded-data-validation-plan.md

Preflight:
  git fetch --all
  git pull --ff-only
  git status
  node scripts/verify-data.js
Confirm clean tree, 9 invariants. Confirm origin includes the P2-012
commit (look for "feat: P2-012 — premium metadata sample fixture +
validator").

Allowed files (one commit only):
- data-staging/ebay-comps/ebay-sold-comps.csv (new)
- data-staging/ebay-comps/README.md (new)
- scripts/validate-ebay-comps.js (new)
- docs/phase-2-execution-checklist.md (edit — mark P2-013 Complete)
- docs/phase-2-dashboard.md (edit — bump to 14 / 18, Next-up = P2-014)

Forbidden: every other file.

Fixture requirements (ebay-sold-comps.csv):
- Header row matching docs/ebay-comps-import-spec.md § 4 exactly:
  listingId,cardCode,setCode,title,soldPrice,shipping,totalPrice,
  currency,soldDate,condition,rawOrGraded,gradeCompany,grade,variant,
  variantMatch,quantity,itemType,outlierFlag,confidence,sourceUrl,
  reviewer,reviewedAt,notes
- 5 to 8 illustrative rows; explicitly NOT real eBay listings.
- Use placeholder listingId values like "SAMPLE-001".
- Use 'https://example.com/sample-001' for sourceUrl on every row.
- Cover variety: at least one raw, one graded, one ambiguous, one
  outlier-flagged.
- confidence ∈ {'high','medium','low','excluded'} per spec.
- variantMatch ∈ {'exact','likely','ambiguous','mismatch','excluded'}.
- rawOrGraded ∈ {'raw','graded','sealed','unknown'}.
- Every cardCode must exist in src/cardData.json.
- DO NOT include actual sold-comp data from any real listing. Sample
  only.

README:
- States the fixture is illustrative; no real eBay data.
- Reiterates: no scraping, no eBay API automation without External
  Source Approval Checklist.
- Cross-references ebay-comps-import-spec.md.

Validator (scripts/validate-ebay-comps.js):
- Plain Node ESM, no dependencies.
- Parses the CSV (handle quoted fields).
- Enforces every rule from docs/ebay-comps-import-spec.md § 16:
  - Required headers exist.
  - Required fields present per row.
  - Numeric fields finite and non-negative.
  - Dates valid ISO.
  - Enums valid.
  - sourceUrl present on every non-draft row.
  - cardCode exists in src/cardData.json (or row routed to 'review' via
    notes — flag this case).
  - Graded rows include gradeCompany AND grade.
  - Raw rows do NOT include graded-specific fields populated.
  - 'excluded' rows are tagged for non-aggregation.
  - Duplicate listingId rows fail unless explicit correction note.
- Exit 0 on success with "✓ N comp rows validated" summary, 1 on
  failure with clear message.

Phase 2 execution checklist + dashboard edits: same pattern as P2-012.

Validate:
  node --check scripts/validate-ebay-comps.js
  node scripts/validate-ebay-comps.js
  git diff --check
  node scripts/verify-data.js

Commit message: feat: P2-013 — eBay sold comps sample fixture + validator

Final response per AGENTS.md § 8. Stop conditions same shape as P2-012.

Critical stop condition: if any row could be mistaken for real market
data (real-looking listing IDs, real-seeming prices linked to a real
URL pattern), stop and revise the fixture. Sample data must be
unambiguously sample data.
```

---

## 4. Ready-to-paste prompt: image coverage strategy (ChatGPT GPT-5 Thinking)

Paste this in a ChatGPT session using **GPT-5 Thinking** (or GPT-5 Pro
if you have it). Do NOT use the default GPT-5; the reasoning-heavy
variant produces materially better spec-grade output.

If you only have GPT-5 default, prepend: *"Think step by step before
each section. Treat each section as if you were writing a spec for
engineers."*

```text
Author a Q-002 image coverage strategy decision doc for FusionMetrics.

Background: FusionMetrics is a Dragon Ball Super: Fusion World TCG
analytics dashboard built with React + Vite + JavaScript. The full
catalog is 1,258 cards across FB01–FB09 plus future SB sets. Today
only ~40 cards have real Bandai images; the other ~1,218 fall back to
text-only icons. This blocks portfolio-grade screenshots and any
future UI surface that benefits from imagery (Card Detail, Watchlist
thumbnails, share previews).

The operating principle is "make FusionMetrics unable to lie by
accident." That extends to image rights — we will not ship images we
don't have a clear right to host.

Output:

A single markdown decision doc structured as follows. Cap at 800 lines.

# Image Coverage Strategy

## 1. Problem statement
- Current state (~40 / 1,258 covered, icon fallback otherwise).
- Why image coverage matters (portfolio credibility, public-beta
  presentation, future UX surfaces).
- Why it's been deferred (rights/licensing risk).

## 2. Option analysis

For each option, cover: rights posture, technical effort,
ongoing-maintenance risk, portfolio-quality impact, mobile-data cost,
suitability for current vs. public-beta stage.

- Option A: Mirror Bandai images to a project bucket.
- Option B: Direct hotlink to Bandai's hosted images.
- Option C: Third-party rights-cleared TCG image source (if any exists
  for DBSFW specifically).
- Option D: Operator-curated public-domain or fair-use renders.
- Option E: Accept icons-only indefinitely; let real images stay as
  the 40-card baseline.
- Option F: User-uploaded images (community-sourced).

## 3. Tradeoffs table

Per-option pros / cons / risks / effort / blocker, in a comparison
table.

## 4. Rights & licensing posture
- DBSFW image rights belong to Bandai (and partner publishers).
- What "fair use" / "transformative use" / "editorial use" arguments
  exist (if any).
- DMCA exposure for each option.
- Mitigation: attribution, robots, opt-out, cease-and-desist process.

## 5. Recommended path
- Single recommendation with explicit caveats.
- Rollout sequence: prototype on N cards before going broader.
- Validator implications: any image-URL validator that would gate
  ingestion.
- What blocks public beta vs. what's nice-to-have.

## 6. Decision criteria
- When to upgrade from icons-only to the chosen option.
- When to revisit the decision.

## 7. Implementation skeleton (no code)
- Where the image manifest lives.
- How it integrates with cardData.json without expanding the inlined
  bundle.
- Lazy-load pattern (per `priceHistory30d.json`).

## 8. Open follow-ups
- What you still need from the operator to finalize.

Constraints:
- No buy/sell/guarantee language anywhere.
- No "investment certainty" framing.
- Do not assume a paid CDN or commercial license unless explicitly
  noted.
- Do not recommend hot-linking without a rights review.
- Do not recommend scraping without explicit operator approval and a
  signed ToS review.
- Treat output as spec-only. No code, no file paths in repo, no
  generated artifacts.

When done, output the full markdown. The operator will copy it,
review, and either (a) paste into a follow-up Codex prompt that
commits it verbatim as docs/image-coverage-strategy.md, or
(b) request revisions.
```

> **Status note (2026-05-12):** This prompt is **superseded** by D-038
> in `docs/decision-log.md` and the Claude-authored
> `docs/image-coverage-strategy.md`. The default posture is Option E
> (icons-only). Only re-run this prompt if the operator wants a
> second opinion or wants to pre-stage Option C research before any
> upgrade trigger fires.

---

## 4a. Ready-to-paste prompt: ship P2-015 + P2-016 (Codex)

> **STATUS: SHIPPED 2026-05-12.** P2-015 landed in commit `0110c23`
> and P2-016 in `178a00a`. Both surfaces are live in production
> behind the sample-gate. This prompt is preserved as a reference
> pattern; do not re-paste.

Paste this after the P2-014 importer commit (`6c24fa1`) is pushed.
This is a **single Codex run** that ships both surfaces because they
share the same sample-gate, copy posture, and trust-contract
guardrails. Each surface gets its own commit.

```text
Ship FusionMetrics P2-015 (premium-metadata UI badges) and P2-016
(CardDetail eBay sold-comps panel) end to end. Two commits, in the
order P2-015 → P2-016. Operator pre-approved both because the
sample-flagged artifacts already exist on disk and the consumption
gate fully prevents production UI from rendering sample data.

Read first:
- AGENTS.md (the runtime contract; especially § 3 forbidden-language
  list and § 6 file boundaries)
- CLAUDE.md (continuity doc; §§ 7.1 non-negotiables + 11 resume
  instructions)
- STATUS.md (current snapshot)
- docs/phase-2-execution-checklist.md (P2-015 + P2-016 rows;
  Operating Rules; Forbidden Files)
- docs/phase-2-dashboard.md (approval-gate cluster)
- docs/decision-log.md (the trust contract decisions you must obey:
  D-006 trust labels, D-014 only show real data, D-038 image
  strategy, D-039 GDR is a premiumFlag, D-040 Bandai is canonical
  for treatment names, D-042 manipulation-risk ≥10 eligible comps,
  D-043 two-tier confidence rule, D-044 boxTopHit derived at
  runtime, D-045 populationKnown default false, D-046 aggregates on
  demand, D-047 sealed freshness 30 days)
- docs/premium-metadata-schema.md (canonical premiumFlags,
  collectorTags, riskTags vocabularies; § 12 UI guidance)
- docs/ebay-comps-import-spec.md (canonical CSV / row shape; § 15
  UI guidance)
- docs/source-confidence-spec.md (row-level confidence; manipulation
  risk; raw/graded separation)
- public/premiumMetadata.sample.json (artifact you will consume —
  read it once to confirm shape; note _isSample: true)
- public/ebayCompsSummary.sample.json (artifact you will consume —
  note _isSample: true)

Preflight:
  git fetch --all
  git pull --ff-only
  git status
  node scripts/verify-data.js
Confirm: clean tree, 9 invariants pass, origin includes
`6c24fa1 feat: P2-014 importer`. If not, STOP and report.

────────────────────────────────────────────────────────────────────
COMMIT 1 — P2-015: Premium-metadata UI badges
────────────────────────────────────────────────────────────────────

Allowed files (P2-015 only):
- src/lib/premiumMetadata.js (NEW — module-scope lazy-fetched cached
  loader, mirroring the loadPriceHistory30d pattern in src/data.js)
- src/components/PremiumBadges.jsx (NEW — pure prop-driven component
  rendering the surfaced badges for one card)
- src/components/CardDetail.jsx (EDIT — render <PremiumBadges/>
  inside the existing badge area; do NOT restructure)
- src/tabs/ValueScanner.jsx (EDIT — render a compact PremiumBadges
  micro-row on each card row; respect existing layout)
- docs/phase-2-execution-checklist.md (EDIT — flip P2-015 to
  Complete; add a Completed Work Ledger row)
- docs/phase-2-dashboard.md (EDIT — bump Complete 15 → 16; refresh
  approval-gate cluster; refresh At-a-glance)

Forbidden: every other file. Especially: src/data.js (the analytics
engine stays untouched), src/cardData.json, src/livePrices.json,
public/priceHistory30d.json, public/priceUpdateLog.json,
scripts/update-prices.js, scripts/verify-data.js, .github/workflows,
package files.

Sample-gate contract for src/lib/premiumMetadata.js (NON-NEGOTIABLE):

  export async function loadPremiumMetadata() {
    if (cache) return cache
    try {
      const res = await fetch('/premiumMetadata.json')   // production path
      if (!res.ok) return (cache = { items: {} })
      const json = await res.json()
      if (json && json._isSample === true) {
        // Production UI must NEVER consume sample-flagged artifacts.
        // Log once for debugging; return empty.
        if (typeof console !== 'undefined') {
          console.warn('[premiumMetadata] sample artifact refused; awaiting production fixture')
        }
        return (cache = { items: {} })
      }
      return (cache = json && json.items ? json : { items: {} })
    } catch {
      return (cache = { items: {} })
    }
  }

NB: the fetch path is `/premiumMetadata.json` (production), NOT
`/premiumMetadata.sample.json`. The sample artifact is on disk for
P2-014 verification only. The UI must look for the production
filename; until that exists, the loader returns empty and the UI
shows nothing. THIS IS CORRECT BEHAVIOR.

Confidence-surfacing rule (D-043):

  // Descriptive flags: surface when confidence >= medium
  const DESCRIPTIVE_FLAGS = new Set([
    'altArt', 'manga', 'mangaAdjacent', 'parallel', 'gdr', 'godRare',
    'winnerPromo', 'eventPromo', 'serialized', 'starterDeckChase',
  ])
  // Ranking-driving labels: require confidence === high
  const RANKING_FLAGS = new Set([
    'secretRareChase', 'specialRareChase', 'sealedChase',
    'gogetaChase', 'sonGokuChase', 'brolyChase',
  ])
  // 'low' confidence NEVER surfaces. Hardcode this.

UI copy rules (strict):
- Badge labels must be plain English and never imply a buy/sell
  signal. Examples allowed: "Alt Art", "Manga Style", "Winner
  Promo", "Secret Rare Chase", "Sealed Chase". Examples forbidden:
  any mention of "buy", "sell", "guaranteed", "must own", "moonshot",
  "lock", "profit", "safe investment".
- riskTags surface as small neutral chips, NOT as red warnings.
  Example: "Variant ambiguity" (chip), not "DANGER" (red badge).
- collectorTags surface as muted secondary chips below the primary
  flag badges.
- If a card has no surfaceable badges, render NOTHING (no empty
  placeholder, no "no data" message — the dashboard already has the
  visual rhythm).

Validation:
  npm run build         (must succeed; warn at 600 kB still OK)
  node scripts/verify-data.js   (9 invariants must still pass)
  Open http://localhost:5173 (or the build preview); click 3 cards
  in Value Scanner; confirm: no badges render because no
  /premiumMetadata.json production file exists. This proves the
  sample-gate is doing its job. THIS IS THE SUCCESS STATE FOR
  P2-015 UNTIL OPERATOR PROMOTES SAMPLE → PRODUCTION.

Commit message:
  feat: P2-015 — premium metadata UI badges (sample-gated)

────────────────────────────────────────────────────────────────────
COMMIT 2 — P2-016: CardDetail eBay sold-comps panel
────────────────────────────────────────────────────────────────────

Allowed files (P2-016 only):
- src/lib/ebayComps.js (NEW — same lazy-fetched cached loader
  pattern; same sample-gate)
- src/components/CompsPanel.jsx (NEW — renders the raw/graded
  separated, variant-aware, confidence-aware row list + on-demand
  aggregates)
- src/components/CardDetail.jsx (EDIT — render <CompsPanel/> as a
  new section below the existing price/history block)
- docs/phase-2-execution-checklist.md (EDIT — flip P2-016 to
  Complete; ledger row)
- docs/phase-2-dashboard.md (EDIT — bump Complete 16 → 17)

Forbidden: every other file. Especially src/data.js, all generated
artifacts, all infra files.

Sample-gate contract for src/lib/ebayComps.js: same shape as
premiumMetadata.js. Fetch path is `/ebayCompsSummary.json`
(production); sample artifact is refused.

CompsPanel rules (NON-NEGOTIABLE):
- Raw rows and graded rows render in SEPARATE sub-sections. Never
  mix in the same list, never aggregate together.
- Aggregates (median, trimmed mean, count, IQR) are computed at
  consumer time from the eligible-row subset (per D-046). Do NOT
  store them. Eligible = NOT outlierFlag AND NOT itemType='lot' AND
  NOT itemType='bundle' AND NOT variantMatch='excluded' AND
  confidence !== 'excluded'.
- Manipulation-risk badge: ONLY surface a label if the eligible
  count in the 30-day window is >= 10 (D-042). Below that, the
  panel shows "Insufficient eligible comps" muted text.
- Variant-match column always visible; rows with
  variantMatch='ambiguous' get a small muted chip.
- Source URL is a small icon link on each row.
- All copy follows the same forbidden-language list as P2-015.

Validation:
  npm run build
  node scripts/verify-data.js
  Open a card; confirm CompsPanel renders the empty/awaiting-fixture
  state (no /ebayCompsSummary.json exists). Confirm no console
  errors. Confirm the rest of CardDetail still renders.

Commit message:
  feat: P2-016 — CardDetail eBay sold-comps panel (sample-gated)

────────────────────────────────────────────────────────────────────
FINAL HOUSEKEEPING (same Codex turn, third commit)
────────────────────────────────────────────────────────────────────

Allowed files:
- STATUS.md (EDIT — bump Phase 2 progress 15/18 → 17/18; update
  TL;DR; add P2-015 / P2-016 commit SHAs to the recent-commits
  table)
- docs/phase-2-dashboard.md (EDIT — final refresh: Complete 17;
  Most-recent-closure pointer)

Commit message:
  docs: housekeeping refresh post-P2-015 + P2-016

Final response (per AGENTS.md § 8):
1. List the three commit SHAs and subjects.
2. Confirm: npm run build succeeded; verify-data 9 invariants;
   sample-gate proven by no /premiumMetadata.json or
   /ebayCompsSummary.json existing in production.
3. Note: P2-017 (backend) remains the sole operator-only Phase 2
   task; no Backend Trigger Checklist condition has fired.
4. STOP. Do not push (the operator pushes).

STOP CONDITIONS (any one triggers abort + report):
- Any forbidden file appears in `git diff`.
- npm run build fails.
- verify-data.js reports < 9 invariants.
- Sample artifact is consumed (test: temporarily place a malformed
  /premiumMetadata.json in dev, confirm UI ignores and renders
  empty; revert).
- Any UI copy uses buy/sell/guarantee/profit/moonshot/lock
  language.
- src/data.js is modified.
- Any generated artifact (cardData.json, livePrices.json,
  priceHistory30d.json, priceUpdateLog.json) is modified.
- Bundle grows past 750 kB raw (would need an explicit operator
  decision per bundle-audit-2026-05-07.md).
```

---

## 4b. Ready-to-paste prompt: ship P3-008 test suite (Codex)

> **STATUS: SHIPPED 2026-05-14.** P3-008 landed in commits `87a2ab6`
> (infra), `bc9c8a8` (smoke cases), `df452e1` (full 20-case suite +
> CI integration), plus follow-up `66285c4` (lockfile regeneration).
> CI runs `npm test` after build; 20 tests pass in ~1.2s. Dev deps
> approved under Q-031: `vitest`, `@testing-library/react`, `jsdom`.
> This prompt is preserved as a reference pattern; do not re-paste.

**Operator gate:** This task adds two dev dependencies — `vitest` and
`@testing-library/react`. Per CLAUDE.md § 7.7 ("Don't introduce…a
test runner without plan") and Q-031, this needs your explicit
go-ahead before pasting. The plan IS the
`docs/test-coverage-gap-analysis.md` doc which already exists and
proposes 20 test cases.

When you're ready to approve, paste this into Codex:

```text
Ship FusionMetrics P3-008: install Vitest + React Testing Library
and port the 20 test cases proposed in
docs/test-coverage-gap-analysis.md. Three commits:
infra, smoke cases, full suite + CI integration. Operator pre-
approved the two new dev deps under Q-031.

Read first:
- AGENTS.md (especially § 5 commands and § 9 don't-without-approval)
- CLAUDE.md § 7.7 (dependency policy — this is the explicit
  "with plan" approval; the plan is the gap-analysis doc)
- docs/test-coverage-gap-analysis.md (the 20 cases — canonical)
- docs/phase-3-execution-checklist.md P3-008 row
- docs/decision-log.md (D-027 lean dependency policy — read for
  context; this approval is the explicit exception)
- package.json
- src/data.js (the heart — most cases target it)
- src/hooks/useWatchlist.js (cases 11–14)
- src/lib/premiumMetadata.js, src/lib/ebayComps.js (sample-gate cases)
- src/components/CompsPanel.jsx (aggregate-on-demand cases)
- .github/workflows/ci.yml (add test step here)

Preflight:
  bash scripts/session-brief.sh
  git fetch --all
  git pull --ff-only
  git status
  node scripts/verify-data.js
Confirm: clean tree, 9 invariants pass, on the dev branch (NOT main).

────────────────────────────────────────────────────────────────────
COMMIT 1 — chore: P3-008 test infrastructure (Vitest + RTL)
────────────────────────────────────────────────────────────────────

Allowed files:
- package.json (EDIT — add `vitest` and `@testing-library/react`
  to devDependencies at versions current as of 2026-05; add scripts
  `"test": "vitest run"` and `"test:watch": "vitest"`)
- package-lock.json (auto-regenerated by `npm install`)
- vitest.config.js (NEW — jsdom env, globals=true, setupFiles for
  cleanup)
- tests/setup.js (NEW — RTL afterEach cleanup)
- tests/.gitkeep removed if present

Forbidden: every other file.

Validation:
  npm install                  (lockfile updated)
  npm test                     (must run with 0 tests = success)
  npm run build                (must succeed unchanged)
  node scripts/verify-data.js  (9 invariants)

Commit message: chore: P3-008a Vitest + RTL infrastructure

────────────────────────────────────────────────────────────────────
COMMIT 2 — test: P3-008 smoke cases (top 5 from gap analysis)
────────────────────────────────────────────────────────────────────

Allowed files:
- tests/data.test.js (NEW — covers gap-analysis cases 1, 2, 3:
  CARDS.length === 1258, HAS_LIVE_PRICES truthy, no NaN/Infinity
  in predicted/market prices)
- tests/useWatchlist.test.jsx (NEW — covers case 11: v1→v2
  migration; case 12: hasStorage failure path)
- tests/sampleGate.test.jsx (NEW — covers cases 18, 19: loaders
  refuse _isSample: true and missing-file)

Each test must:
- Use vi.mock for fetch where loaders are involved.
- Not call any real network.
- Run in < 5s total.

Validation:
  npm test (5 tests pass)
  npm run build
  node scripts/verify-data.js

Commit message: test: P3-008b smoke cases (5 of 20 gap-analysis cases)

────────────────────────────────────────────────────────────────────
COMMIT 3 — test: P3-008 full suite + CI integration
────────────────────────────────────────────────────────────────────

Allowed files:
- tests/*.test.{js,jsx} (NEW — remaining 15 cases from gap analysis)
- .github/workflows/ci.yml (EDIT — add `npm test` step after the
  build step; do NOT change other steps)
- docs/phase-3-execution-checklist.md (EDIT — flip P3-008 to
  Complete; ledger row)
- docs/test-coverage-gap-analysis.md (EDIT — add a closing § noting
  the 20 cases now ship; do not rewrite the analysis)

Forbidden: every other file. ESPECIALLY: src/* (the test suite must
work against the current source; if a test reveals a real bug,
report it but do NOT fix in this commit — open a follow-up).

Validation:
  npm test (all 20 pass)
  npm run build
  node scripts/verify-data.js
  # If CI YAML changed, lint it: actionlint (if installed locally;
  # otherwise rely on GitHub side validation post-push)

Commit message: test: P3-008c full Vitest suite + CI integration

────────────────────────────────────────────────────────────────────
FINAL RESPONSE
────────────────────────────────────────────────────────────────────

1. Three commit SHAs.
2. `npm test` output summary (count, runtime).
3. Bundle delta (test deps are dev-only; production bundle should
   not grow).
4. CI yaml diff summary.
5. STOP. Do not push.

STOP CONDITIONS:
- Any test FAILS in any commit.
- Any forbidden file appears in diff.
- A test discovers a real bug — REPORT it; do NOT fix in this run.
- `npm install` brings in any unexpected transitive dependency that
  inflates `node_modules` beyond a reasonable budget (e.g., > 200
  MB). If so, stop and ask which dep is the bloat source.
- A test relies on the production deploy URL (offline-first only).
```

---

## 5. Ready-to-paste prompt: Plausible analytics review (operator solo)

This one is for you, the operator. No agent needed. 15 minutes.

```text
Plausible review checklist:

1. Open the Plausible dashboard for fusion-metrics-jet.vercel.app.
2. Set the time range to "Last 30 days."
3. Jot the following into a new file: docs/analytics-snapshot-YYYY-MM-DD.md

   ## Headline numbers
   - Unique visitors (30d):
   - Total pageviews (30d):
   - Bounce rate:
   - Avg visit duration:
   - Visit duration trend (up / flat / down vs. prior 30d):

   ## Traffic sources
   - Top referrer:
   - Top campaign / utm if any:
   - Direct traffic share:
   - Search engine share:

   ## Engagement
   - Top pages by visits (top 5):
   - Top events if Plausible event tracking is set up (top 5):
   - Returning visitor share (if visible):

   ## Devices
   - Desktop vs. mobile share:
   - Top browser:
   - Top OS:

   ## Geography
   - Top country:
   - Top 3 countries combined %:

   ## Read
   - One observation that surprises you:
   - One signal that supports or contradicts the trust-first design
     hypothesis:
   - One thing that's missing from current instrumentation:

4. Save the file. Commit yourself OR ask Codex to commit it verbatim
   with message: docs: 2026-MM-DD Plausible analytics snapshot.
5. Update docs/risk-register.md R-020 status from "open" to "monitored"
   in the same or a follow-up commit.

Stop conditions:
- Do not screenshot Plausible into a public file (it's not sensitive
  but Plausible specifically is configured for our domain; treat the
  numbers as ops data).
- Do not infer anything as "investment value" or "user demand for
  paid features" from a single 30-day window — note observations
  honestly without overclaiming.
```

---

## 6. Decision flowchart

If you have ~30 minutes and want forward motion this session:

```
START
  │
  ├─ Have you read Plausible yet (R-020)?
  │    │
  │    ├─ NO  → Run § 5 prompt (15 min, solo). Then back to start.
  │    │
  │    └─ YES → continue
  │
  ├─ Is image strategy decided (R-017, Q-002)?
  │    │
  │    ├─ NO  → Run § 4 prompt in ChatGPT Thinking (15-30 min).
  │    │         When ChatGPT returns the markdown:
  │    │         - Skim it.
  │    │         - Ask Codex to commit it as
  │    │           docs/image-coverage-strategy.md (1 commit).
  │    │
  │    └─ YES → continue
  │
  └─ Approve P2-012?
       │
       ├─ YES → Run § 2 prompt in Codex (real code: ~30-60 min).
       │         Push from Mac. Then optionally:
       │         - Approve P2-013 (§ 3 prompt) for next session.
       │
       └─ NO  → Stop. The dashboard stays at 13/18 (or 12/18 if
                P2-012 wasn't done either) until you're ready.
```

### Why this order

- **Plausible first** because the data exists and not reading it is
  cheap to fix; everything else benefits from knowing the user signal.
- **Image strategy second** because the answer doesn't block any code
  but does block portfolio polish and the next public-beta surface.
- **P2-012 third** because it's the first real fixture+validator pair;
  doing it after the other two means you go into it with a clearer
  picture.

If you only have 15 minutes, do Plausible. If you only have 30, do
Plausible + start ChatGPT for image strategy (you can review its
output later).

---

## 7. Sanity-check checklist before any approval

Before pasting any prompt above, run through this in <5 minutes:

```bash
cd ~/fusion-world
git fetch --all
git status
git log --oneline -5
```

Then check:

- [ ] Working tree is clean (or matches expected pending work).
- [ ] Origin HEAD matches what you expect (current: `bcc3dcc` or
      newer).
- [ ] No surprise commits from the bot or a parallel agent.
- [ ] `docs/phase-2-dashboard.md` § 1 shows the right "Complete" count
      (12/18 today; 13/18 after P2-012; 14/18 after P2-013).
- [ ] `docs/risk-register.md` § 9 top-3 hasn't shifted unexpectedly.
- [ ] The prompt you're about to paste matches a section in this
      handbook verbatim (no edits you don't understand).

If any of these surprise you: stop. Run a Claude review session first
("audit current state against expectations") before committing more
work.

---

## 8. What this handbook is NOT

- Not a project history (that's `CLAUDE.md`).
- Not a runtime contract (that's `AGENTS.md`).
- Not a daily status (that's `docs/phase-2-dashboard.md` +
  `STATUS.md`).
- Not a backlog (that's `docs/public-beta-backlog.md`).
- Not a risk register (that's `docs/risk-register.md`).

This handbook exists so you, the operator, can move the product
forward in 30-minute slots without having to re-read every other doc
in `docs/`. Keep it tight; if it grows past 800 lines, something's
wrong.

---

## 9. Update protocol

When a prompt here is used and the work commits cleanly:

1. The relevant `docs/phase-2-execution-checklist.md` row moves to
   "Complete" with the closing commit SHA.
2. The relevant `docs/phase-2-dashboard.md` § 1 / § 2 numbers update.
3. The corresponding prompt section in this handbook **stays** —
   future operators may need it as a reference, and the prompt is
   parameterized enough to be re-runnable.
4. If a prompt changes (e.g. a spec doc renames a field), update it
   here in the same commit that fixes the underlying spec.

When a new prompt is needed (new task type, new agent):

1. Author it inline here as a new § N.
2. Reference it from the decision flowchart (§ 6).
3. Cross-link from the relevant risk-register entry if it mitigates a
   tracked risk.
