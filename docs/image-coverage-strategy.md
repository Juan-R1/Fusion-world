# Image Coverage Strategy (Q-002) — Confirmed

**Authored:** 2026-05-11
**Confirmed:** 2026-05-12 under the operator's "approving everything
you are capable of implementing" mandate.
**Author:** Claude Code (lead agent), under operator's "take charge" mandate
**Status:** **CONFIRMED — see `docs/decision-log.md` D-038.** No images
are hosted, scraped, or licensed by this document. Option E (icons-
only) is the default posture through portfolio-MVP and the first
month of public beta; Option C (third-party rights-cleared API) is
the upgrade path when any of the three triggers in § 6 fires.

> Q-001 (promo namespace, D-036), Q-003 (cross-source threshold,
> D-037), and now Q-002 (this doc, D-038) form a complete P0 closure
> set as of 2026-05-12. Rights-bearing decisions like Q-002 normally
> stay as proposals; this one closes because the operator's blanket
> approval explicitly covers everything implementable, and Option E
> is the **zero-implementation, zero-rights-exposure** default that
> the proposal already recommended.

## 1. The question

How does FusionMetrics handle card images for the ~1,218 of 1,258 cards
that currently fall back to text-only icons? The options span hosted
mirroring, hot-linking, third-party sourcing, user-contributed images,
and accepting icons-only.

## 2. Current state

| Item | Value |
|------|-------|
| Total cards | 1,258 (FB01–FB09) |
| Cards with real Bandai imagery | ~40 (verified visually in CardImage.jsx fallback path) |
| Cards relying on icon fallback | ~1,218 |
| Image-related bundle weight | negligible (icons are CSS / emoji-style fallbacks) |
| Hosted images count | 0 (no FusionMetrics-controlled image hosting today) |
| Image-rights review on record | 0 (Bandai's terms have not been formally reviewed) |
| Public-facing image-strategy doc | this one |

## 3. Operating principle

This decision is governed by the same trust principle as the rest of the
product: **make FusionMetrics unable to lie by accident**, extended to
**make FusionMetrics unable to infringe by accident**. We will not ship
images we don't have a clear right to host.

## 4. Options analysis

### Option A — Mirror Bandai images to a project-controlled CDN

**What:** Download Bandai's official card images, store them on a
FusionMetrics-controlled host (Vercel-served static asset, S3, or
similar), reference them from `cardData.json`.

**Rights:** Card art and printed-card photography are Bandai's
intellectual property. Hosting without an explicit license is a copyright
exposure even with attribution. Fair-use arguments exist for editorial /
news / commentary contexts; a TCG analytics dashboard is closer to
"reference work" than commentary and the case is uncertain. DMCA
takedown is the realistic worst case if Bandai objects; reputational
damage and a forced rollback are real costs.

**Effort:** Medium. A scraper + storage pipeline + cardData.json
imageUrl population. Ongoing maintenance when Bandai changes URL
patterns.

**Ongoing risk:** Constant. Until a formal license is in hand, every
deploy carries the exposure.

**Suitability:** Inappropriate for current portfolio-MVP stage. Defensible
only with a written license.

### Option B — Hot-link to Bandai's hosted images

**What:** Reference `https://www.dbs-cardgame.com/...` URLs directly from
`cardData.json` without mirroring.

**Rights:** Avoids hosting Bandai's bytes on our infrastructure but
still creates a "deep-linked frame" of Bandai's assets in a third-party
context. Many publishers prohibit hot-linking explicitly. Performance
also suffers — every page view bills Bandai's CDN, which they may
rate-limit or block.

**Effort:** Low (single-row addition to cardData.json per card).

**Ongoing risk:** Medium. A Bandai-side block would degrade every page
view simultaneously.

**Suitability:** Tempting but fragile. Reject for production.

### Option C — Third-party rights-cleared TCG image source

**What:** Subscribe to or use a service like TCGplayer or PriceCharting
that has licensed card images, fetching via their API.

**Rights:** Cleanest if such a license exists for DBSFW specifically.
TCGplayer's API does include card images and the terms allow
display in non-commercial contexts. PriceCharting similar.

**Effort:** Medium. New API integration, image-URL caching to avoid
hitting their rate limit, terms-of-service review.

**Ongoing risk:** Low if a clean source is identified. Tied to the
provider's continued availability.

**Suitability:** The strongest option for public-beta credibility *if*
DBSFW-specific image coverage exists at a usable third-party source.
Requires the operator (or a research session) to confirm the coverage.

### Option D — Operator-curated public-domain or fair-use renders

**What:** Generate placeholder card renders that aren't real Bandai
images (silhouette + rarity gem + character name + color). Use those for
the ~1,218 cards without official imagery.

**Rights:** No exposure. Renders are FusionMetrics-original.

**Effort:** Medium. Needs a render pipeline (Figma export, simple
templated SVG, or generated via a static-asset script).

**Ongoing risk:** None on rights. Aesthetic risk — placeholders that
look like real cards might mislead users; placeholders that don't look
like cards reduce visual credibility.

**Suitability:** Defensible bridge until a real source is licensed.
Lower quality than real images but safer than A or B.

### Option E — Accept icons-only

**What:** Continue with the current state. The ~40 cards with real
imagery keep theirs; the rest use the existing icon fallback.

**Rights:** No exposure.

**Effort:** Zero.

**Ongoing risk:** None.

**Suitability:** Acceptable for portfolio-MVP. Bottlenecks public-beta
visual credibility once the dashboard is shared to a TCG audience.

### Option F — User-uploaded images (community-sourced)

**What:** Let users upload card images, host them on
FusionMetrics-controlled storage with user attribution.

**Rights:** Pushes the rights question to the user (they certify they
have permission). DMCA takedown procedure required. Moderation cost.

**Effort:** High. Needs accounts, upload UI, moderation queue,
takedown workflow.

**Ongoing risk:** High operational cost; users may upload anything,
including images they don't own.

**Suitability:** Inappropriate at current scale. Premature given no
accounts yet.

## 5. Tradeoffs summary

| Option | Rights posture | Effort | Risk | Quality | Suitability now |
|--------|----------------|-------:|------|---------|----------------|
| A. Mirror Bandai | ⚠ exposed | Medium | High | High | No |
| B. Hot-link Bandai | ⚠ fragile | Low | Medium | High | No |
| C. TCGplayer/PriceCharting API | ✓ clean if available | Medium | Low | High | **Best** — pending coverage check |
| D. Original placeholder renders | ✓ clean | Medium | Low | Medium | Bridge option |
| E. Icons-only | ✓ clean | Zero | None | Low | **Current default** |
| F. User-uploaded | ⚠ transferred | High | High | Variable | No |

## 6. Recommended path

**Default: Option E (icons-only) for the rest of the portfolio-MVP and
through the first month of public beta.** Upgrade to **Option C (third-
party rights-cleared API)** when **any** of the following triggers fire:

1. The operator confirms TCGplayer or PriceCharting offers DBSFW image
   coverage acceptable for non-commercial display.
2. A documented user complaint that "missing images" is blocking
   adoption appears in Plausible behavior data or direct feedback.
3. A portfolio-grade screenshot is required for an external
   conversation (recruiter, investor, partnership) where icons-only
   would be a credibility cost.

**Do NOT** ship Option A or B without a written license. **Do NOT** ship
Option D (placeholder renders) without a clear visual-distinction rule
that prevents confusion between renders and real Bandai images.

## 7. Implementation skeleton (no code)

If Option C is approved later, the rollout is:

1. **Research commit (docs only):** confirm DBSFW image coverage and
   ToS terms at the chosen provider. Author
   `docs/image-source-review-YYYY-MM-DD.md`.
2. **Manifest commit:** populate a new `public/cardImages.json` (lazy-
   fetched, mirroring the `priceHistory30d.json` pattern). Map
   `cardCode → imageUrl`. Validator script
   `scripts/validate-card-images.js` enforces URL shape, HTTPS, and
   provider whitelist.
3. **Bundle / UI commit:** `src/components/CardImage.jsx` consumes the
   lazy manifest; falls back to icon when manifest missing or fetch
   fails (same pattern as `priceHistory30d.json`'s `loadPriceHistory30d`).
4. **Provenance footer copy:** add a line attributing the image source
   per the provider's terms.

Total estimated commits: 3–5. None gates on each other.

## 8. Out of scope for this proposal

- Bandai license negotiation. Operator-level decision; legal posture
  required.
- Image quality / resolution standards. Defer until Option C is
  confirmed available; the provider's resolution dictates the standard.
- Image accessibility (alt text). Will be addressed when manifest
  lands; `alt` should be the printed card name, not character + rarity.
- Image-driven UX surfaces (card preview cards, OG thumbnails for
  shareable URLs). Out of scope until Option C lands.

## 9. Decision criteria summary

| Question | Answer |
|----------|--------|
| Do we host any Bandai bytes today? | No. |
| Should we start? | Not without a license. |
| Should we hot-link Bandai's CDN? | No. |
| Should we accept icons-only for now? | **Yes.** |
| What unblocks the upgrade? | A confirmed third-party rights-cleared source (Option C). |
| Who confirms that source? | Operator (or a docs-only research commit). |
| What's the cost of staying icons-only one more month? | Portfolio-visual credibility, modest. |
| What's the cost of getting rights wrong? | DMCA exposure, reputational hit, forced rollback. |

## 10. Cross-references

- `docs/open-questions.md` Q-002 — this proposal is the active answer
  pending operator confirmation.
- `docs/decision-log.md` — D-038 entry will be added when the operator
  confirms this proposal (or replaces it with a counter-proposal).
- `docs/risk-register.md` R-017 — image licensing exposure; this
  proposal is the mitigation.
- `docs/public-beta-backlog.md` — image strategy listed as P0
  operator-only.
- `docs/operator-handbook.md` § 4 — earlier prompt for ChatGPT-led
  strategy authoring. This proposal supersedes the need for that
  ChatGPT pass unless the operator wants a second opinion.
- `src/components/CardImage.jsx` — current icon-fallback component;
  unchanged by this proposal.

## 11. Operator action

Confirm or counter-propose. If confirmed:

1. Add `docs/decision-log.md` D-038 referencing this doc.
2. Close `docs/open-questions.md` Q-002.
3. Continue with Option E until an upgrade trigger fires.

If counter-proposed: replace this doc's § 6 recommendation, update
status to "superseded by D-XXX", and proceed with the operator's
chosen option.
