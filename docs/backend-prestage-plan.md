# Backend Pre-Stage Plan (P3-009 / P2-017)

**Created:** 2026-05-12
**Status:** Design-only. Zero implementation. **No backend is approved.**
**Activates when:** at least one Backend Trigger Checklist condition in
`docs/phase-2-execution-checklist.md` § 7 fires AND the operator explicitly
approves implementation. Today, all six trigger conditions are false.

> **What this is:** a pre-staged design so that the day a trigger
> fires, FusionMetrics doesn't lose 2 weeks deliberating stack
> choice, schema shape, cost, or rollback plan. The work is laid
> out; the decision is "go" or "wait."
>
> **What this is NOT:** an approval to build a backend, install a
> database, or change the static-artifact architecture. The trust
> contract still says **prefer docs, manual CSV specs, staged
> fixtures, validators, and generated JSON artifacts**
> (`docs/phase-2-execution-checklist.md` § 7 last line). That stands.

## 1. Operating principle

Static JSON has carried FusionMetrics from 161 verified cards to
1,258 cards / 1,156 live prices / split-shape data contract / lazy-
loaded history / sample-gated UI consumption. The static path scales
further than instinct suggests. A backend is only justified when
static cannot honestly serve the workload.

The five conditions below are the **only** entries that justify
backend introduction. The operator does not "decide to build a
backend"; they observe a trigger and either approve or defer.

## 2. Trigger inventory (from `phase-2-execution-checklist.md` § 7)

| ID | Trigger | Current state | Approximate cost of further delay |
|----|---------|---------------|----------------------------------|
| T1 | Comps exceed roughly 1,000 rows | 6 sample rows; 0 production rows | Negligible until D-041 (manual eBay) starts producing |
| T2 | Account / cloud Watchlist approved | Local-only Watchlist v2 in production | Low — local Watchlist meets current demand |
| T3 | Alerts approved | Not approved; not requested | Negligible — no alert demand |
| T4 | Daily multi-source history approved | Not approved; weekly rotation is the current cadence | Low — rotation handles the JustTCG free tier |
| T5 | Static artifacts become too slow or too large | Bundle 660 kB raw / 99 kB gzip; lazy-loaded history works | Low — bundle audit (`docs/bundle-audit-2026-05-07.md`) shows headroom |
| T6 | User authentication required | Not required; no accounts exist | Negligible — auth needs justification |

The most likely first trigger is **T1 (comps > 1,000)** because
manual eBay research (D-041, P3-011) is the next operator data fill.
A 1,000-row comp table would push the lazy-loaded `public/
ebayCompsSummary.json` past ~500 kB raw, at which point on-demand
aggregation in the browser starts to bite.

## 3. Recommended stack (when activated)

**Default choice: Postgres on Supabase free tier.**

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Database | Postgres 16 | Native JSON, mature, well-known. Trivial to migrate off. |
| Host | Supabase free tier | 500 MB storage / 50K monthly active users / built-in auth / built-in PostgREST. Zero ops cost to start. Free tier sized exactly for early production. |
| Migrations | `node-pg-migrate` (single dev dep) | Simple SQL-based migration runner; no ORM lock-in. |
| Query layer | `pg` (single prod dep) | Driver only. No ORM. Direct SQL with prepared statements. |
| Connection style | Connection pooling via Supabase pooler URL | Stays under free-tier connection limit. |
| Backup | Supabase nightly snapshot (free) + manual `pg_dump` to a private S3-compatible bucket (~$0.50/mo) | Belt and suspenders for the production data we'd otherwise have only in Supabase. |
| Auth (if T6) | Supabase Auth | Built-in; magic-link by default; no Auth0 / Clerk lock-in. |

**Alternatives explicitly considered and rejected for the first
activation:**

- **SQLite via Cloudflare D1**: free, fast, edge-distributed; rejected because the data model is relational with cross-row joins (comps × cards × metadata) and D1's read replication semantics introduce subtle staleness windows.
- **Postgres on Fly.io / Railway / Render**: similar Postgres, but Supabase's built-in PostgREST + Auth removes a meaningful chunk of glue code at no cost increase.
- **Postgres on AWS RDS**: industrial-grade, but the free tier expires after 12 months. Premature.
- **MongoDB Atlas free tier**: schema flexibility we don't need; the comps data model is heavily relational.
- **DynamoDB / Firestore**: lock-in concerns + query model mismatch.

## 4. Proposed schema (v1, written for trigger T1)

This schema mirrors the spec docs already on disk. It is NOT
authoritative until written by an approved migration.

```sql
-- Cards stay static; this is the read-side anchor only.
-- Master copy still ships in src/cardData.json; this table is the
-- shape backend queries join against.
CREATE TABLE cards (
  card_code        TEXT PRIMARY KEY,             -- "FB01-001"
  set_code         TEXT NOT NULL,                -- "FB01"
  rarity           TEXT NOT NULL,                -- L/C/UC/R/SR/SCR/SPR (D-011)
  name             TEXT NOT NULL,
  character        TEXT,
  release_date     DATE,
  verified         BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cards_set_idx    ON cards (set_code);
CREATE INDEX cards_rarity_idx ON cards (rarity);

-- Premium metadata (P2-004 schema; one row per card)
CREATE TABLE premium_metadata (
  card_code        TEXT PRIMARY KEY REFERENCES cards (card_code),
  premium_flags    TEXT[] NOT NULL DEFAULT '{}',
  collector_tags   TEXT[] NOT NULL DEFAULT '{}',
  risk_tags        TEXT[] NOT NULL DEFAULT '{}',
  confidence       TEXT NOT NULL CHECK (confidence IN ('high','medium','low')),
  source_refs      TEXT[] NOT NULL,
  grade_upside     JSONB,                        -- {status, confidence, sourceRefs, notes}
  notes            TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- eBay sold comps (P2-006 schema; many rows per card, raw/graded mixed)
CREATE TABLE ebay_sold_comps (
  listing_id       TEXT PRIMARY KEY,
  card_code        TEXT NOT NULL REFERENCES cards (card_code),
  set_code         TEXT NOT NULL,
  title            TEXT NOT NULL,
  sold_price       NUMERIC(10,2) NOT NULL,
  shipping         NUMERIC(10,2),
  total_price      NUMERIC(10,2),
  currency         TEXT NOT NULL DEFAULT 'USD',
  sold_date        DATE NOT NULL,
  condition        TEXT,
  raw_or_graded    TEXT NOT NULL CHECK (raw_or_graded IN ('raw','graded','sealed','unknown')),
  grade_company    TEXT,                         -- D-035
  grade            TEXT,
  variant          TEXT,
  variant_match    TEXT NOT NULL CHECK (variant_match IN ('exact','likely','ambiguous','mismatch','excluded')),
  quantity         INTEGER NOT NULL DEFAULT 1,
  item_type        TEXT NOT NULL CHECK (item_type IN ('single','lot','sealed','gradedCard','bundle','proxyCustom','unknown')),
  outlier_flag     BOOLEAN NOT NULL DEFAULT FALSE,
  confidence       TEXT NOT NULL CHECK (confidence IN ('high','medium','low','excluded')),
  source_url       TEXT NOT NULL,
  reviewer         TEXT NOT NULL,
  reviewed_at      TIMESTAMPTZ NOT NULL,
  notes            TEXT,
  CONSTRAINT raw_no_grade    CHECK (raw_or_graded <> 'raw' OR (grade_company IS NULL AND grade IS NULL)),
  CONSTRAINT graded_has_both CHECK (raw_or_graded <> 'graded' OR (grade_company IS NOT NULL AND grade IS NOT NULL))
);
CREATE INDEX ebay_card_date_idx ON ebay_sold_comps (card_code, sold_date DESC);

-- Live prices (mirrored from JustTCG)
CREATE TABLE live_prices (
  card_code        TEXT PRIMARY KEY REFERENCES cards (card_code),
  market_price     NUMERIC(10,2) NOT NULL,
  source           TEXT NOT NULL DEFAULT 'justtcg',
  refreshed_at     TIMESTAMPTZ NOT NULL
);

-- 30d history (carry-forward storage matching public/priceHistory30d.json shape)
CREATE TABLE price_history_30d (
  card_code        TEXT NOT NULL REFERENCES cards (card_code),
  observed_at      TIMESTAMPTZ NOT NULL,
  market_price     NUMERIC(10,2) NOT NULL,
  source           TEXT NOT NULL DEFAULT 'justtcg',
  PRIMARY KEY (card_code, observed_at)
);
```

Notes on the schema choices:
- Every CHECK constraint mirrors a decision in `docs/decision-log.md`.
- `card_code` is the primary key on `cards`; D-011 keeps it stable.
- `premium_metadata` matches D-039 (GDR is a flag, not a rarity), D-043 (confidence enum), D-044 (no `boxTopHit` row), D-045 (population data is stored only when reviewer-verified, default false).
- `ebay_sold_comps` enforces raw/graded separation at the constraint level (the validator already does it; the DB adds defense in depth).
- `live_prices` is a read-replica of `src/livePrices.json`'s `current` map. The pipeline still produces the JSON artifact; backend introduction adds a second consumer, not a replacement.

## 5. Migration plan (when activated)

**Phase B-0 — dual-write (1 sprint):**
- Stand up Supabase.
- Add `scripts/sync-to-backend.js` that reads the current static
  artifacts and writes them to Postgres after each
  `update-prices.yml` and each importer run.
- Run dual-write for 30 days. Compare the static artifacts to a DB
  dump weekly to catch silent drift.
- NO read-side change. The dashboard still serves static JSON.

**Phase B-1 — read pilot (1 sprint):**
- One UI surface — proposed: the comps panel in CardDetail
  (`src/components/CompsPanel.jsx`) — switches to a Supabase
  PostgREST query when a feature flag is on. The lazy-loaded static
  artifact stays as the fallback.
- Measure: query latency, cache behavior, free-tier connection
  usage.
- Rollback path: flip the flag off. Static path resumes.

**Phase B-2 — graduated cutover (2+ sprints):**
- One artifact at a time, behind the same flag pattern. Premium
  metadata next, then live prices, then history.
- Static artifact generation continues until graduation. The static
  files become the cold backup.

**Phase B-3 — static deprecation (only when justified):**
- After every read surface has been live on the backend for 90 days
  without regression, the static-artifact generation can be deleted
  from the workflow.
- This is **not committed** as part of pre-staging. Static may
  forever remain the long-tail backup; that's fine.

## 6. Cost estimate (when activated)

Supabase free tier:
- 500 MB Postgres storage. Current artifact total is ~3 MB. Headroom: 100x.
- 50K monthly active users.
- 5 GB egress.
- 2 free projects.
- Free Auth.
- Built-in PostgREST.

**Expected cost for the first 12 months: $0**, assuming traffic
stays in the public-MVP range (≤ 5K monthly visitors per Plausible
once it's read).

**Upgrade trigger to paid Supabase ($25/mo Pro):**
- DB storage > 400 MB (would require ~50K comps rows).
- Egress > 4 GB monthly.
- Need for daily backups beyond the free 7-day window.
- 24/7 uptime SLA needs.

Manual `pg_dump` to Cloudflare R2 / Backblaze B2: ~$0.50/mo for the
storage volume FusionMetrics would ever produce.

## 7. Rollback plan

If the backend rollout produces any regression — incorrect data,
slow queries, free-tier limits hit, Supabase outage — the rollback
is:

1. Flip the feature flag off (the static path is always present in
   Phase B-1 / B-2).
2. Confirm the static path still serves correct data via
   `node scripts/verify-data.js` and a CardDetail open on the
   production site.
3. Open a `docs/backend-incident-YYYY-MM-DD.md` with: trigger,
   detection time, scope of bad data (if any), affected users,
   resolution.
4. Decide: revise the rollout (continue) or pause indefinitely
   (rare).

No data is lost in a rollback because:
- The static artifacts remain the source of truth through Phase B-2.
- Manual `pg_dump` runs nightly.
- The dual-write script can be replayed against a fresh DB.

## 8. What this plan deliberately defers

- **Specific Supabase project name / region**: chosen at activation
  time so it can target the operator's location.
- **Auth scheme (magic link vs OAuth vs password)**: defer to
  activation; depends on T6 specifics.
- **GraphQL vs REST**: PostgREST is REST; no decision needed unless
  GraphQL becomes a hard requirement.
- **Caching layer**: defer until measured latency demands it.
  Postgres on Supabase is already fast for 5K queries/month.
- **Async write queue**: defer. Synchronous writes from the
  importer are fine at expected volume.

## 9. Decision criteria summary

| Question | Pre-staged answer |
|----------|-------------------|
| Should we add a backend today? | **No.** Zero trigger conditions are true. |
| If T1 fires, what database? | Postgres on Supabase free tier. |
| If T6 fires, what auth? | Supabase Auth, magic link default. |
| What's the first table to populate? | `cards`, then `live_prices`, then `premium_metadata`, then `ebay_sold_comps`. |
| How long does dual-write run? | 30 days minimum, then graduate one surface at a time. |
| What rollback signal stops the rollout? | Any user-visible data inaccuracy, any free-tier limit breach, or measurable latency regression > 200 ms p95 on a comps query. |
| Who approves activation? | Operator only. |

## 10. Activation checklist (when a trigger fires)

The operator runs these steps in order before approving any code:

- [ ] Confirm the specific trigger that fired (T1–T6) and document
  it in `docs/decision-log.md` as a new D-NNN entry.
- [ ] Confirm Plausible monthly-active-user count (R-020 must have
  been read at least once).
- [ ] Confirm `verify-data.js` is still passing.
- [ ] Confirm static artifact sizes are still within the
  bundle-audit budget.
- [ ] Sign in to Supabase, create a project, save the connection
  string + service role key in the operator's password manager
  (NOT in the repo).
- [ ] Add `SUPABASE_*` secrets to GitHub Actions if needed.
- [ ] Hand a Codex prompt scoped to **Phase B-0 only** (dual-write
  + monitoring; zero read-side change). One commit.
- [ ] Wait 30 days, verify no drift, then approve Phase B-1.

## 11. Cross-references

- `docs/phase-2-data-expansion-plan.md` § 9 — original backend
  consideration narrative.
- `docs/phase-2-execution-checklist.md` § 7 — Backend Trigger
  Checklist (the canonical trigger list).
- `docs/data-model-v2.md` — entity definitions this schema mirrors.
- `docs/decision-log.md` — every CHECK constraint here ties to a
  D-NNN entry.
- `docs/risk-register.md` R-018, R-019, R-052 — risks this plan
  partially mitigates when activated.
- `docs/phase-3-execution-checklist.md` P3-009 — closes this row.

## 12. Update log

| Date | Change | Notes |
|------|--------|-------|
| 2026-05-12 | Initial pre-stage plan | Closes P3-009 in the Phase 3 checklist. Activation requires explicit operator approval. |
