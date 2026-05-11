#!/usr/bin/env node
/**
 * scripts/validate-ebay-comps.js
 *
 * Validates data-staging/ebay-comps/ebay-sold-comps.csv against the canonical
 * spec in docs/ebay-comps-import-spec.md.
 *
 * Standalone Node ESM. No dependencies. Not consumed by the app.
 *
 * Run: node scripts/validate-ebay-comps.js
 * Exit 0 on success; 1 on the first violation.
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

const FIXTURE_PATH  = path.join(ROOT, 'data-staging', 'ebay-comps', 'ebay-sold-comps.csv')
const CARDDATA_PATH = path.join(ROOT, 'src', 'cardData.json')

// ── Canonical vocabulary (docs/ebay-comps-import-spec.md § 6) ───────────────

const REQUIRED_HEADERS = [
  'listingId', 'cardCode', 'setCode', 'title', 'soldPrice', 'shipping',
  'totalPrice', 'currency', 'soldDate', 'condition', 'rawOrGraded',
  'gradeCompany', 'grade', 'variant', 'variantMatch', 'quantity',
  'itemType', 'outlierFlag', 'confidence', 'sourceUrl', 'reviewer',
  'reviewedAt', 'notes',
]

const RAW_OR_GRADED  = new Set(['raw', 'graded', 'sealed', 'unknown'])
const VARIANT_MATCH  = new Set(['exact', 'likely', 'ambiguous', 'mismatch', 'excluded'])
const CONFIDENCE     = new Set(['high', 'medium', 'low', 'excluded'])
const ITEM_TYPE      = new Set(['single', 'lot', 'sealed', 'gradedCard', 'bundle', 'proxyCustom', 'unknown'])
const GRADE_COMPANY  = new Set(['PSA', 'BGS', 'CGC', 'TAG', 'other', ''])

// Forbidden language in notes (per AGENTS.md § 3)
const FORBIDDEN_PATTERNS = [
  /\bguarantee/i, /\bguaranteed\b/i, /\bmust\s+buy\b/i, /\bsafe\s+invest/i,
  /\bmoonshot\b/i, /\block\b/i, /\bprofit\s+signal\b/i,
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`✗ validate-ebay-comps: ${msg}`)
  process.exit(1)
}

// Minimal CSV split — fixture must avoid commas inside fields. A real
// production CSV parser would handle quoted fields; we deliberately keep
// the fixture format simple to make the validator dependency-free.
function splitCsvLine(line) {
  return line.split(',').map(s => s.trim())
}

function isPositiveFiniteNumber(s, { allowZero = false } = {}) {
  if (s === '' || s == null) return false
  const n = Number(s)
  if (!Number.isFinite(n)) return false
  if (n < 0) return false
  if (!allowZero && n <= 0) return false
  return true
}

function isIsoDate(s) {
  // Accept YYYY-MM-DD or full ISO timestamp.
  if (typeof s !== 'string' || s.length === 0) return false
  const t = Date.parse(s)
  return Number.isFinite(t)
}

// ── Load ────────────────────────────────────────────────────────────────────

let cards
try {
  cards = JSON.parse(fs.readFileSync(CARDDATA_PATH, 'utf8'))
} catch (err) {
  fail(`failed to read src/cardData.json — ${err.message}`)
}
const KNOWN_CODES = new Set(cards.map(c => c.code))

let raw
try {
  raw = fs.readFileSync(FIXTURE_PATH, 'utf8')
} catch (err) {
  fail(`failed to read fixture ${FIXTURE_PATH} — ${err.message}`)
}

const lines = raw.split(/\r?\n/).filter(l => l.length > 0)
if (lines.length < 2) fail('fixture is empty or has only a header')

// ── Header check ────────────────────────────────────────────────────────────

const headers = splitCsvLine(lines[0])
if (headers.length !== REQUIRED_HEADERS.length)
  fail(`header column count ${headers.length} does not match required ${REQUIRED_HEADERS.length}`)
for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
  if (headers[i] !== REQUIRED_HEADERS[i])
    fail(`header[${i}] expected "${REQUIRED_HEADERS[i]}", got "${headers[i]}"`)
}

// ── Per-row checks ──────────────────────────────────────────────────────────

const seenListingIds = new Set()
let rowCount = 0

for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
  const cells = splitCsvLine(lines[rowIdx])
  const where = `row ${rowIdx + 1}`

  if (cells.length !== REQUIRED_HEADERS.length)
    fail(`${where}: column count ${cells.length} does not match header (${REQUIRED_HEADERS.length}). Make sure no field contains a comma.`)

  const row = Object.fromEntries(headers.map((h, i) => [h, cells[i]]))

  // Required strings
  if (!row.listingId)  fail(`${where}: listingId is empty`)
  if (!row.cardCode)   fail(`${where}: cardCode is empty`)
  if (!row.setCode)    fail(`${where}: setCode is empty`)
  if (!row.title)      fail(`${where}: title is empty`)
  if (!row.currency)   fail(`${where}: currency is empty`)
  if (!row.sourceUrl)  fail(`${where}: sourceUrl is empty (required for traceability)`)

  // cardCode existence
  if (!KNOWN_CODES.has(row.cardCode))
    fail(`${where}: cardCode "${row.cardCode}" not found in src/cardData.json`)

  // setCode consistency with cardCode prefix
  if (row.setCode !== row.cardCode.split('-')[0])
    fail(`${where}: setCode "${row.setCode}" does not match cardCode prefix "${row.cardCode.split('-')[0]}"`)

  // Numeric fields
  if (!isPositiveFiniteNumber(row.soldPrice))
    fail(`${where}: soldPrice "${row.soldPrice}" is not a positive finite number`)
  if (row.shipping !== '' && !isPositiveFiniteNumber(row.shipping, { allowZero: true }))
    fail(`${where}: shipping "${row.shipping}" must be non-negative finite or empty`)
  if (row.totalPrice !== '' && !isPositiveFiniteNumber(row.totalPrice))
    fail(`${where}: totalPrice "${row.totalPrice}" must be positive finite or empty`)
  if (!isPositiveFiniteNumber(row.quantity))
    fail(`${where}: quantity "${row.quantity}" must be a positive number`)

  // Dates
  if (!isIsoDate(row.soldDate))
    fail(`${where}: soldDate "${row.soldDate}" is not a valid date`)
  if (row.reviewedAt !== '' && !isIsoDate(row.reviewedAt))
    fail(`${where}: reviewedAt "${row.reviewedAt}" is not a valid date`)

  // Enums
  if (!RAW_OR_GRADED.has(row.rawOrGraded))
    fail(`${where}: rawOrGraded "${row.rawOrGraded}" not in {${[...RAW_OR_GRADED].join(',')}}`)
  if (!VARIANT_MATCH.has(row.variantMatch))
    fail(`${where}: variantMatch "${row.variantMatch}" not in {${[...VARIANT_MATCH].join(',')}}`)
  if (!CONFIDENCE.has(row.confidence))
    fail(`${where}: confidence "${row.confidence}" not in {${[...CONFIDENCE].join(',')}}`)
  if (!ITEM_TYPE.has(row.itemType))
    fail(`${where}: itemType "${row.itemType}" not in {${[...ITEM_TYPE].join(',')}}`)
  if (!GRADE_COMPANY.has(row.gradeCompany))
    fail(`${where}: gradeCompany "${row.gradeCompany}" not in {${[...GRADE_COMPANY].join(',')}}`)

  // outlierFlag must be 'true' or 'false' (string-typed CSV bool)
  if (row.outlierFlag !== 'true' && row.outlierFlag !== 'false')
    fail(`${where}: outlierFlag "${row.outlierFlag}" must be "true" or "false"`)

  // Raw / graded separation
  if (row.rawOrGraded === 'graded') {
    if (!row.gradeCompany) fail(`${where}: graded row missing gradeCompany`)
    if (!row.grade)        fail(`${where}: graded row missing grade`)
  }
  if (row.rawOrGraded === 'raw') {
    if (row.gradeCompany) fail(`${where}: raw row must NOT populate gradeCompany`)
    if (row.grade)        fail(`${where}: raw row must NOT populate grade`)
  }

  // Excluded rows: variantMatch=excluded should accompany confidence=excluded
  if (row.variantMatch === 'excluded' && row.confidence !== 'excluded')
    fail(`${where}: variantMatch=excluded requires confidence=excluded`)

  // Duplicate listingId guard
  if (seenListingIds.has(row.listingId))
    fail(`${where}: duplicate listingId "${row.listingId}". Correction-flow rows must be documented in notes.`)
  seenListingIds.add(row.listingId)

  // sourceUrl shape
  if (!/^https?:\/\//.test(row.sourceUrl))
    fail(`${where}: sourceUrl "${row.sourceUrl}" must start with http(s)://`)

  // Forbidden language in notes
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(row.notes))
      fail(`${where}: notes contain forbidden language matching ${pat}`)
  }

  rowCount++
}

console.log(`✓ ${rowCount} comp rows validated · ebay-comps sample fixture`)
