# Sample-Gate Promotion Runbook

**Created:** 2026-05-12
**Audience:** Operator. This is a procedure, not a spec.
**Scope:** How to promote a `data-staging/` sample fixture into a
production artifact under `public/` that the UI will actually
consume, without breaking the trust contract.

> The sample-gate is the structural guarantee that production never
> renders fake data. Promotion is the only sanctioned way to disable
> the gate for a single artifact. This runbook is the **only** safe
> path; ad-hoc edits to `public/*.json` are forbidden.

## 1. What "promotion" means

Today, two sample-flagged artifacts exist on disk:

| Sample artifact | Production filename the UI looks for | Consumer |
|----------------|--------------------------------------|----------|
| `public/premiumMetadata.sample.json` | `public/premiumMetadata.json` | `src/lib/premiumMetadata.js` → `<PremiumBadges/>` |
| `public/ebayCompsSummary.sample.json` | `public/ebayCompsSummary.json` | `src/lib/ebayComps.js` → `<CompsPanel/>` |

The loaders in `src/lib/*.js` fetch the **production** filename and
refuse any payload with `_isSample: true`. That refusal is what
keeps the UI honest today. Promotion replaces the production
filename with a real, reviewed artifact whose root-level
`_isSample` is **absent or explicitly `false`**.

## 2. Pre-promotion gate (mandatory)

Do NOT promote any artifact unless every box is checked. If any
box is unchecked, the artifact is not ready.

- [ ] The source fixture in `data-staging/` validates green.
- [ ] Every row in the source fixture has a real, reviewer-attached
  `sourceRefs` / `sourceUrl` — placeholder URLs like
  `https://example.com/...` and reviewers like `SAMPLE-REVIEWER`
  are disqualifying.
- [ ] Each card referenced exists in `src/cardData.json`.
- [ ] No row contains forbidden language (see AGENTS.md § 3).
- [ ] D-038..D-047 decisions are respected in the data:
  - GDR is recorded as `premiumFlags: ["gdr"]`, never as a rarity.
  - Treatment names match Bandai canonical (D-040).
  - `boxTopHit` is NOT in `collectorTags`.
  - `populationKnown=true` rows have a reviewer attached.
  - eBay comps maintain raw/graded separation.
- [ ] If the artifact is `ebayCompsSummary`, there are **≥ 10
  eligible comps** per card that should show a manipulation-risk
  label (D-042). Below that, the UI shows "Insufficient eligible
  comps" — that is the correct state, not a bug.
- [ ] An operator-signed entry has been added to
  `docs/decision-log.md` recording the promotion (new D-NNN row
  with the artifact name, date, and reviewer).

## 3. Promotion procedure

Steps are intentionally explicit. There are exactly four file
changes per artifact promotion.

### Step A — refresh the staged fixture with real data

Edit the source fixture in `data-staging/` to contain reviewed
production rows. For premium metadata, this is
`data-staging/premium-metadata/sample.json` (or a new file —
operator's call). For comps, this is
`data-staging/ebay-comps/ebay-sold-comps.csv` (or new).

Each row must include the real source URL and a real reviewer
identifier. The `_disclaimer` field on `premium-metadata` should
either stay (if the artifact is partial / illustrative still) or be
removed (if the artifact is fully reviewed production data).

### Step B — run the validator (failure-closed)

```bash
node scripts/validate-premium-metadata.js
# or
node scripts/validate-ebay-comps.js
```

If the validator fails, fix the source fixture and re-run. Do
NOT proceed.

### Step C — run the importer

```bash
node scripts/import-premium-metadata.js
# or
node scripts/import-ebay-comps.js
```

This emits `public/premiumMetadata.sample.json` or
`public/ebayCompsSummary.sample.json`. The artifact is still
`.sample.` flagged.

### Step D — promote the artifact

Open the emitted file. Edit two fields at the root:

1. Filename: copy or rename the file from `*.sample.json` to the
   production filename (drop the `.sample.` segment).
2. Inside the JSON, set `_isSample: false` **or remove the field
   entirely**.
3. The `_disclaimer` field can stay for transparency (it's
   harmless) or be replaced with a production-appropriate sentence.

Example for premium metadata:

```bash
# After importer emits public/premiumMetadata.sample.json
cp public/premiumMetadata.sample.json public/premiumMetadata.json
# Edit public/premiumMetadata.json:
#   change "_isSample": true  →  "_isSample": false  (or delete the line)
#   leave or rewrite "_disclaimer" — operator's call
```

**Why both filename change AND `_isSample: false`:** the loaders in
`src/lib/*.js` check BOTH conditions (filename pattern enforced
implicitly by the fetch URL, and `_isSample` field). Defense in
depth.

### Step E — verify production-side gate

```bash
npm run build
node scripts/verify-data.js          # must still report 9 invariants
```

Open the dev server and inspect a card the artifact covers:

- For premium metadata: a card with `premiumFlags` should now render
  the matching badges per D-043 (descriptive flags at
  `confidence >= medium`; ranking-driving labels at
  `confidence == high` only).
- For comps: CardDetail's comps panel should now show real rows
  separated raw/graded. If a card has < 10 eligible comps, the
  manipulation-risk badge stays suppressed (D-042).

### Step F — commit

One commit per artifact promotion. Commit message format:

```
feat: promote <artifact> sample → production

Source: data-staging/<path>/<file>
Reviewer: <name>
Rows: <N>
Validator: ✓
Decision-log entry: D-NNN
```

Stage exactly:
- The edited `data-staging/` source file.
- The emitted `public/<artifact>.sample.json` (still on disk).
- The new `public/<artifact>.json` (production).
- The `docs/decision-log.md` D-NNN entry.

Do NOT delete the `.sample.json` from `public/` — it stays as a
reference for the next agent that needs to see "what the import
produced."

## 4. Post-promotion verification

After push and deploy:

- [ ] Visit https://fusion-metrics-jet.vercel.app/, open DevTools
  Network tab, click a card the artifact covers.
- [ ] Confirm a 200 response on `/premiumMetadata.json` or
  `/ebayCompsSummary.json`.
- [ ] Confirm console has NO `[premiumMetadata] sample artifact
  refused` or `[ebayComps] sample artifact refused` warnings — if
  it does, `_isSample` is still `true` somewhere.
- [ ] Confirm the bundle did NOT grow materially — production JSON
  is a public asset, not bundled.
- [ ] Confirm `scripts/session-brief.sh` now shows the
  corresponding `*.json: PRESENT` line on next session start.

## 5. Demotion / rollback

If a promoted artifact ships with wrong data, the rollback is one
file change:

```bash
git rm public/premiumMetadata.json
# or
git rm public/ebayCompsSummary.json
git commit -m "fix: demote premium-metadata promotion (see incident YYYY-MM-DD)"
git push
```

The UI's sample-gate immediately reverts to the empty/awaiting-fixture
state because the production filename no longer exists. No code
change required.

Document the incident at `docs/promotion-incident-YYYY-MM-DD.md`
with: what was wrong, how it was caught, how it slipped past § 2's
checklist, and what's added to § 2 to prevent recurrence.

## 6. What this runbook does NOT permit

- Hand-editing `public/premiumMetadata.json` or
  `public/ebayCompsSummary.json` outside the importer.
- Renaming a `.sample.json` to `.json` without running the
  validator AND the importer first.
- Promoting an artifact without the corresponding `decision-log.md`
  entry.
- Promoting partial data ("just the high-confidence rows") without
  documenting in § 2's checklist exactly which row-confidence
  threshold was applied.
- Promoting comps data that mixes raw and graded rows in the same
  list (constraint enforced by validator AND `CompsPanel.jsx`).
- Promoting metadata that includes `boxTopHit` (derived at runtime
  per D-044).

## 7. Cross-references

- `AGENTS.md` § 3 (trust rules), § 6 (forbidden files).
- `docs/decision-log.md` — every promotion adds a new D-NNN row.
- `docs/premium-metadata-schema.md` — canonical vocabulary the
  source fixture must respect.
- `docs/ebay-comps-import-spec.md` — canonical CSV shape.
- `docs/source-confidence-spec.md` — row-level confidence rules.
- `scripts/validate-premium-metadata.js`,
  `scripts/validate-ebay-comps.js` — the failure-closed gate.
- `scripts/import-premium-metadata.js`,
  `scripts/import-ebay-comps.js` — the only sanctioned write-path.
- `src/lib/premiumMetadata.js`, `src/lib/ebayComps.js` — the
  consumer-side sample-gate.

## 8. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-12 | Initial runbook | Authored under operator's Phase 3 heavy-session mandate. |
