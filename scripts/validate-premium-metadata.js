#!/usr/bin/env node
/**
 * scripts/validate-premium-metadata.js
 *
 * Validates data-staging/premium-metadata/sample.json against the canonical
 * schema in docs/premium-metadata-schema.md.
 *
 * Standalone Node ESM script. No dependencies. Not consumed by the app.
 *
 * Exit 0: every row passes validation. Prints a success summary.
 * Exit 1: any violation. Prints the first violating row and stops.
 *
 * Run: node scripts/validate-premium-metadata.js
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

const FIXTURE_PATH   = path.join(ROOT, 'data-staging', 'premium-metadata', 'sample.json')
const CARDDATA_PATH  = path.join(ROOT, 'src', 'cardData.json')

// ── Canonical vocabulary (mirrors docs/premium-metadata-schema.md §§ 5–7) ───

const PREMIUM_FLAGS = new Set([
  'manga', 'mangaAdjacent', 'godRare', 'gdr', 'altArt',
  'secretRareChase', 'specialRareChase', 'sealedChase',
  'gogetaChase', 'sonGokuChase', 'brolyChase',
  'eventPromo', 'winnerPromo', 'serialized', 'starterDeckChase',
])

const COLLECTOR_TAGS = new Set([
  'fusionCharacter', 'heroCharacter', 'villainCharacter', 'fanFavorite',
  'setChase', 'boxTopHit', 'artDriven', 'playabilityRelevant',
  'lowPopulationPotential', 'nostalgiaAppeal', 'newReleaseAttention',
])

const RISK_TAGS = new Set([
  'variantAmbiguity', 'rawGradedContamination', 'lowVolume', 'stalePrice',
  'sourceDisagreement', 'reprintRisk', 'sealedVariance', 'manualReviewOnly',
  'unverifiedTreatment', 'thinMarket',
])

const CONFIDENCE       = new Set(['high', 'medium', 'low'])
const GRADE_STATUS     = new Set(['unknown', 'notReviewed', 'candidate', 'confirmed', 'avoid'])
const GRADE_CONFIDENCE = new Set(['high', 'medium', 'low', 'unknown'])

// ── Helpers ───────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`✗ validate-premium-metadata: ${msg}`)
  process.exit(1)
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function isIsoTimestamp(v) {
  if (typeof v !== 'string') return false
  const t = Date.parse(v)
  return Number.isFinite(t)
}

// ── Load ──────────────────────────────────────────────────────────────────

let cards
try {
  cards = JSON.parse(fs.readFileSync(CARDDATA_PATH, 'utf8'))
} catch (err) {
  fail(`failed to read src/cardData.json — ${err.message}`)
}
const KNOWN_CODES = new Set(cards.map(c => c.code))

let fixture
try {
  fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'))
} catch (err) {
  fail(`failed to read fixture at ${FIXTURE_PATH} — ${err.message}`)
}

// ── Root-level checks ─────────────────────────────────────────────────────

if (!isPlainObject(fixture))                 fail('fixture root is not a plain object')
if (fixture.version !== 1)                   fail(`fixture.version must be 1, got ${JSON.stringify(fixture.version)}`)
if (!isIsoTimestamp(fixture.updatedAt))      fail(`fixture.updatedAt is not a valid ISO timestamp: ${JSON.stringify(fixture.updatedAt)}`)
if (!isPlainObject(fixture.items))           fail('fixture.items is not a plain object')

const itemKeys = Object.keys(fixture.items)
if (itemKeys.length === 0)                   fail('fixture.items is empty')

// ── Per-item checks ───────────────────────────────────────────────────────

let rowCount = 0
for (const [key, item] of Object.entries(fixture.items)) {
  const where = `items["${key}"]`

  if (!isPlainObject(item))                     fail(`${where}: not a plain object`)
  if (item.cardCode !== key)                    fail(`${where}: item.cardCode "${item.cardCode}" does not match key "${key}"`)
  if (!KNOWN_CODES.has(item.cardCode))          fail(`${where}: cardCode "${item.cardCode}" not found in src/cardData.json`)

  // premiumFlags: array of canonical values (may be empty for negative-review rows)
  if (!Array.isArray(item.premiumFlags))        fail(`${where}: premiumFlags is not an array`)
  for (const flag of item.premiumFlags) {
    if (!PREMIUM_FLAGS.has(flag))               fail(`${where}: premiumFlags contains unknown value "${flag}"`)
  }

  // collectorTags: optional array; if present, every value canonical
  if (item.collectorTags !== undefined) {
    if (!Array.isArray(item.collectorTags))     fail(`${where}: collectorTags is not an array`)
    for (const tag of item.collectorTags) {
      if (!COLLECTOR_TAGS.has(tag))             fail(`${where}: collectorTags contains unknown value "${tag}"`)
    }
  }

  // riskTags: optional array; if present, every value canonical
  if (item.riskTags !== undefined) {
    if (!Array.isArray(item.riskTags))          fail(`${where}: riskTags is not an array`)
    for (const tag of item.riskTags) {
      if (!RISK_TAGS.has(tag))                  fail(`${where}: riskTags contains unknown value "${tag}"`)
    }
  }

  // confidence: required enum
  if (!CONFIDENCE.has(item.confidence))         fail(`${where}: confidence must be one of high/medium/low, got "${item.confidence}"`)

  // sourceRefs: required non-empty array of strings
  if (!Array.isArray(item.sourceRefs))          fail(`${where}: sourceRefs is not an array`)
  if (item.sourceRefs.length === 0)             fail(`${where}: sourceRefs must be non-empty`)
  for (const ref of item.sourceRefs) {
    if (typeof ref !== 'string' || ref.length === 0)
      fail(`${where}: sourceRefs contains a non-string or empty value`)
  }

  // updatedAt: required ISO timestamp
  if (!isIsoTimestamp(item.updatedAt))          fail(`${where}: updatedAt is not a valid ISO timestamp`)

  // gradeUpside: optional object with status enum; if 'confirmed', must have sourceRefs
  if (item.gradeUpside !== undefined) {
    if (!isPlainObject(item.gradeUpside))       fail(`${where}: gradeUpside is not an object`)
    if (!GRADE_STATUS.has(item.gradeUpside.status))
      fail(`${where}: gradeUpside.status must be one of ${[...GRADE_STATUS].join('/')}, got "${item.gradeUpside.status}"`)
    if (item.gradeUpside.confidence !== undefined && !GRADE_CONFIDENCE.has(item.gradeUpside.confidence))
      fail(`${where}: gradeUpside.confidence must be one of ${[...GRADE_CONFIDENCE].join('/')}, got "${item.gradeUpside.confidence}"`)
    if (item.gradeUpside.status === 'confirmed') {
      const refs = Array.isArray(item.gradeUpside.sourceRefs) ? item.gradeUpside.sourceRefs : []
      if (refs.length === 0)
        fail(`${where}: gradeUpside.status='confirmed' requires non-empty gradeUpside.sourceRefs`)
    }
  }

  rowCount++
}

console.log(`✓ ${rowCount} items validated · premium-metadata sample fixture`)
