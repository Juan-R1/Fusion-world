# FusionMetrics Operator Handbook

**Last refreshed:** 2026-05-11
**Baseline commit:** `bcc3dcc docs: refresh public-beta backlog against May 2026 state`

> Single doc for the human operator. Every prompt here is ready to paste.
> If you're reading this and don't know what to do next, jump to § 6
> (decision flowchart).

---

## 1. What you do

The trust foundation and Phase 2 spec layer are done. The visible product
moves forward only when *you* approve a gated task or pick an answer to
an open question. Your three real responsibilities going forward:

### (a) Approve gated Phase 2 tasks

The Phase 2 ladder (`docs/phase-2-execution-checklist.md`) has six tasks
sitting at "Needs user approval." Each one crosses into territory that
could ship something user-visible, so they cannot proceed without you.

- **P2-012** — Premium metadata fixture + validator. Prompt in § 2.
- **P2-013** — eBay sold comps CSV fixture + validator. Prompt in § 3.
- **P2-014** — Importer. Depends on P2-012 + P2-013.
- **P2-015** — UI badges/filters. Depends on premium metadata artifact.
- **P2-016** — CardDetail comps panel. Depends on comps artifact.
- **P2-017** — Backend decision. Depends on Backend Trigger Checklist.

### (b) Decide the three P0 open questions

From `docs/open-questions.md`:

- **Q-001 — Promo / event-card cardCode namespace.** Blocks SB-set
  staging, eBay comps matching, premium-metadata `eventPromo` flags.
  Needs a ChatGPT GPT-2 / Codex CDX-04 spec output + your choice.
- **Q-002 — Image coverage strategy.** Blocks public-beta visual
  credibility. Prompt in § 4.
- **Q-003 — Cross-source variance threshold.** Blocks source-confidence
  implementation. Needs a ChatGPT GPT-3 spec + your choice.

### (c) Read Plausible analytics weekly

The Plausible tag has been live since `01daa2e` (April 2026). Nobody has
read the dashboard yet. Public-beta decisions are being made without
user-behavior signal. Prompt in § 5; takes ~15 minutes.

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
