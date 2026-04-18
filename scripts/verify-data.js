#!/usr/bin/env node
/**
 * scripts/verify-data.js
 * Asserts structural invariants on src/cardData.json and src/livePrices.json.
 * Exits 1 on any violation, 0 on success. No dependencies beyond fs.
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

const CARDS_PATH = path.join(ROOT, 'src', 'cardData.json')
const LIVE_PATH  = path.join(ROOT, 'src', 'livePrices.json')

const VALID_RARITIES = new Set(['L', 'C', 'UC', 'R', 'SR', 'SCR', 'SPR'])
const SET_PATTERN    = /^FB0[1-9]$/
const EXPECTED_CARDS = 1258

function fail(msg) {
  console.error(`✗ verify-data: ${msg}`)
  process.exit(1)
}

// ── Invariant 1: cardData.json is an array of exactly 1258 entries ──────────
let cards
try {
  cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'))
} catch (err) {
  fail(`cardData.json failed to parse — ${err.message}`)
}
if (!Array.isArray(cards))        fail('cardData.json is not an array')
if (cards.length !== EXPECTED_CARDS) fail(`cardData.json has ${cards.length} entries, expected ${EXPECTED_CARDS}`)

// ── Invariant 2: every card has truthy code, set, rarity string fields ──────
for (const c of cards) {
  for (const field of ['code', 'set', 'rarity']) {
    if (typeof c[field] !== 'string' || c[field].length === 0)
      fail(`card missing "${field}" string — entry: ${JSON.stringify(c).slice(0, 120)}`)
  }
}

// ── Invariant 3: no duplicate code values ───────────────────────────────────
const seen = new Set()
for (const c of cards) {
  if (seen.has(c.code)) fail(`duplicate card code "${c.code}"`)
  seen.add(c.code)
}

// ── Invariant 4: every rarity is one of L/C/UC/R/SR/SCR/SPR ─────────────────
for (const c of cards) {
  if (!VALID_RARITIES.has(c.rarity))
    fail(`invalid rarity "${c.rarity}" on card ${c.code}`)
}

// ── Invariant 5: every set matches /^FB0[1-9]$/ ─────────────────────────────
for (const c of cards) {
  if (!SET_PATTERN.test(c.set))
    fail(`invalid set "${c.set}" on card ${c.code}`)
}

// ── Invariant 6: livePrices.json parses and has > 0 entries ─────────────────
let live
try {
  live = JSON.parse(fs.readFileSync(LIVE_PATH, 'utf8'))
} catch (err) {
  fail(`livePrices.json failed to parse — ${err.message}`)
}
if (!Array.isArray(live)) fail('livePrices.json is not an array')
if (live.length === 0)    fail('livePrices.json is empty — HAS_LIVE_PRICES would be false')

// ── Invariant 7: every marketPrice is a finite positive number ──────────────
for (const e of live) {
  const p = e?.marketPrice
  if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0)
    fail(`invalid marketPrice ${JSON.stringify(p)} on entry ${JSON.stringify(e).slice(0, 120)}`)
}

console.log(`✓ ${cards.length} cards, ${live.length} live prices, 7 invariants passed`)
