#!/usr/bin/env node
/**
 * scripts/import-premium-metadata.js (P2-014)
 *
 * Reads data-staging/premium-metadata/sample.json (after validation), and
 * emits public/premiumMetadata.sample.json — a sample-flagged artifact
 * that the production UI must NOT consume.
 *
 * Sample-flag contract (matches the trust principle):
 *   - emitted artifact filename ends in `.sample.json`
 *   - emitted JSON includes `_isSample: true` and `_disclaimer` at root
 *   - UI consumers (P2-015) gate on `!_isSample` AND filename without
 *     `.sample.` before reading
 *
 * Standalone Node ESM. No dependencies. Not consumed by the app.
 *
 * Workflow:
 *   1. Spawn `scripts/validate-premium-metadata.js`; abort on any failure.
 *   2. Read the fixture.
 *   3. Emit `public/premiumMetadata.sample.json` with row-grain items,
 *      generation metadata, and the sample marker.
 *
 * Run: node scripts/import-premium-metadata.js
 * Exit 0 on success; 1 on validation or write failure.
 */
import fs            from 'fs'
import path          from 'path'
import { execSync }  from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

const FIXTURE_PATH   = path.join(ROOT, 'data-staging', 'premium-metadata', 'sample.json')
const VALIDATOR_PATH = path.join(ROOT, 'scripts', 'validate-premium-metadata.js')
const OUTPUT_PATH    = path.join(ROOT, 'public', 'premiumMetadata.sample.json')

function fail(msg) {
  console.error(`✗ import-premium-metadata: ${msg}`)
  process.exit(1)
}

// ── Step 1: validate upstream fixture ──────────────────────────────────────

try {
  execSync(`node "${VALIDATOR_PATH}"`, { stdio: 'inherit' })
} catch {
  fail('upstream fixture validation failed — importer aborted')
}

// ── Step 2: read fixture ───────────────────────────────────────────────────

let fixture
try {
  fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'))
} catch (err) {
  fail(`failed to read fixture — ${err.message}`)
}

if (!fixture.items || typeof fixture.items !== 'object') {
  fail('fixture has no items object (should have been caught by validator)')
}

// ── Step 3: emit sample-flagged artifact ───────────────────────────────────

const generatedAt = new Date().toISOString()
const items       = {}
for (const [code, item] of Object.entries(fixture.items)) {
  items[code] = {
    cardCode:      item.cardCode,
    premiumFlags:  Array.isArray(item.premiumFlags)  ? [...item.premiumFlags]  : [],
    collectorTags: Array.isArray(item.collectorTags) ? [...item.collectorTags] : [],
    riskTags:      Array.isArray(item.riskTags)      ? [...item.riskTags]      : [],
    confidence:    item.confidence,
    sourceRefs:    Array.isArray(item.sourceRefs) ? [...item.sourceRefs] : [],
    gradeUpside:   item.gradeUpside ? { ...item.gradeUpside } : { status: 'unknown', confidence: 'unknown', sourceRefs: [] },
    notes:         typeof item.notes === 'string' ? item.notes : '',
    updatedAt:     item.updatedAt,
  }
}

const output = {
  version:       1,
  _isSample:     true,
  _disclaimer:   'ILLUSTRATIVE SAMPLE ONLY. Not consumed by production UI. Not financial advice. Every row is manualReviewOnly. See data-staging/premium-metadata/README.md.',
  generatedAt,
  sourceFixture: 'data-staging/premium-metadata/sample.json',
  rowCount:      Object.keys(items).length,
  items,
}

try {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8')
} catch (err) {
  fail(`failed to write ${OUTPUT_PATH} — ${err.message}`)
}

console.log(`✓ wrote ${path.relative(ROOT, OUTPUT_PATH)} (${output.rowCount} items, _isSample=true)`)
