# FusionMetrics Data Staging

This directory is empty by design. It exists as the approved home for future
Phase 2 staging inputs, not as active product data.

No generated artifacts may live here without:

- An approved schema/spec.
- A dedicated validator.
- Explicit operator approval for the specific fixture or artifact.

Governing specs:

- `docs/sb-set-staging-spec.md`
- `docs/premium-metadata-schema.md`
- `docs/ebay-comps-import-spec.md`
- `docs/graded-comps-spec.md`
- `docs/sealed-products-spec.md`
- `docs/expanded-data-validation-plan.md`

Forbidden actions:

- No scraping.
- No backend / database work.
- No fixtures committed without explicit operator approval.
- No external API calls.

Staging path convention: use `data-staging/<topic>/<artifact>.csv` or
`data-staging/<topic>/<artifact>.json` for future approved inputs. Add a
topic-level `README.md` when content lands so reviewers know the source,
validator, and activation status.
