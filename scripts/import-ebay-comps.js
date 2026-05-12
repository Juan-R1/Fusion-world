#!/usr/bin/env node
/**
 * scripts/import-ebay-comps.js (P2-014)
 *
 * Reads data-staging/ebay-comps/ebay-sold-comps.csv (after validation),
 * parses each row, groups by cardCode, and emits
 * public/ebayCompsSummary.sample.json — a sample-flagged row-grain
 * artifact that the production UI must NOT consume.
 *
 * Per D-046, aggregates (median / trimmed mean / IQR / count) are NOT
 * pre-computed at import. The consumer computes them on demand. The
 * importer's job is row-grain emission with raw/graded separation
 * preserved.
 *
 * Per D-042, the consumer must also gate manipulationRisk on >= 10
 * eligible comps in the analysis window — this artifact intentionally
 * does not annotate that gate; it just provides the row set.
 *
 * Sample-flag contract:
 *   - filename ends in `.sample.json`
 *   - JSON includes `_isSample: true` and `_disclaimer` at root
 *   - UI consumers (P2-016) gate on both before reading
 *
 * Standalone Node ESM. No dependencies. Not consumed by the app.
 *
 * Workflow:
 *   1. Spawn `scripts/validate-ebay-comps.js`; abort on any failure.
 *   2. Re-parse the CSV (the validator does not return parsed rows).
 *   3. Group rows by cardCode; preserve original column types.
 *   4. Emit `public/ebayCompsSummary.sample.json`.
 *
 * Run: node scripts/import-ebay-comps.js
 * Exit 0 on success; 1 on validation or write failure.
 */
import fs            from 'fs'
import path          from 'path'
import { execSync }  from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

const FIXTURE_PATH   = path.join(ROOT, 'data-staging', 'ebay-comps', 'ebay-sold-comps.csv')
const VALIDATOR_PATH = path.join(ROOT, 'scripts', 'validate-ebay-comps.js')
const OUTPUT_PATH    = path.join(ROOT, 'public', 'ebayCompsSummary.sample.json')

const REQUIRED_HEADERS = [
  'listingId', 'cardCode', 'setCode', 'title', 'soldPrice', 'shipping',
  'totalPrice', 'currency', 'soldDate', 'condition', 'rawOrGraded',
  'gradeCompany', 'grade', 'variant', 'variantMatch', 'quantity',
  'itemType', 'outlierFlag', 'confidence', 'sourceUrl', 'reviewer',
  'reviewedAt', 'notes',
]

const NUMERIC_FIELDS = new Set(['soldPrice', 'shipping', 'totalPrice', 'quantity'])
const BOOL_FIELDS    = new Set(['outlierFlag'])

function fail(msg) {
  console.error(`✗ import-ebay-comps: ${msg}`)
  process.exit(1)
}

function splitCsvLine(line) {
  return line.split(',').map(s => s.trim())
}

function toRowValue(field, raw) {
  if (NUMERIC_FIELDS.has(field)) {
    if (raw === '' || raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  if (BOOL_FIELDS.has(field)) {
    return raw === 'true'
  }
  return raw
}

// ── Step 1: validate upstream fixture ──────────────────────────────────────

try {
  execSync(`node "${VALIDATOR_PATH}"`, { stdio: 'inherit' })
} catch {
  fail('upstream fixture validation failed — importer aborted')
}

// ── Step 2: re-read the CSV ────────────────────────────────────────────────

let raw
try {
  raw = fs.readFileSync(FIXTURE_PATH, 'utf8')
} catch (err) {
  fail(`failed to read fixture — ${err.message}`)
}

const lines = raw.split(/\r?\n/).filter(l => l.length > 0)
if (lines.length < 2) fail('fixture is empty after validation (unexpected)')

const headers = splitCsvLine(lines[0])
for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
  if (headers[i] !== REQUIRED_HEADERS[i]) {
    fail(`unexpected header drift: column ${i} was "${headers[i]}", expected "${REQUIRED_HEADERS[i]}"`)
  }
}

// ── Step 3: parse and group ────────────────────────────────────────────────

const byCardCode = {}
let rowCount = 0

for (let i = 1; i < lines.length; i++) {
  const cells = splitCsvLine(lines[i])
  if (cells.length !== REQUIRED_HEADERS.length) {
    fail(`row ${i + 1} column count drift: ${cells.length} vs ${REQUIRED_HEADERS.length}`)
  }
  const row = {}
  for (let c = 0; c < REQUIRED_HEADERS.length; c++) {
    row[REQUIRED_HEADERS[c]] = toRowValue(REQUIRED_HEADERS[c], cells[c])
  }
  const code = row.cardCode
  if (!byCardCode[code]) byCardCode[code] = []
  byCardCode[code].push(row)
  rowCount++
}

// ── Step 4: emit sample-flagged artifact ───────────────────────────────────

const generatedAt = new Date().toISOString()
const output = {
  version:       1,
  _isSample:     true,
  _disclaimer:   'ILLUSTRATIVE SAMPLE ONLY. Not consumed by production UI. Not financial advice. No real eBay listings. Placeholder URLs only. Per D-046 aggregates are computed on demand by consumers. Per D-042 manipulationRisk gates on >=10 eligible comps. See data-staging/ebay-comps/README.md.',
  generatedAt,
  sourceFixture: 'data-staging/ebay-comps/ebay-sold-comps.csv',
  rowCount,
  cardCount:     Object.keys(byCardCode).length,
  byCardCode,
}

try {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8')
} catch (err) {
  fail(`failed to write ${OUTPUT_PATH} — ${err.message}`)
}

console.log(`✓ wrote ${path.relative(ROOT, OUTPUT_PATH)} (${rowCount} rows across ${output.cardCount} cards, _isSample=true)`)
