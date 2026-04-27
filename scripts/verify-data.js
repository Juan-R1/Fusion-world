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

const CARDS_PATH   = path.join(ROOT, 'src', 'cardData.json')
const LIVE_PATH    = path.join(ROOT, 'src', 'livePrices.json')
const HISTORY_PATH = path.join(ROOT, 'public', 'priceHistory30d.json')

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

// ── Invariant 6: livePrices.json parses and meets the coverage floor ────────
// The floor (1121 = 97% of the 1156 known-good baseline) catches partial
// JustTCG runs that truncate mid-fetch. The pipeline guard in update-prices.js
// is the first line of defence; this is the CI gate.
const MIN_LIVE_PRICES = 1121
let live
try {
  live = JSON.parse(fs.readFileSync(LIVE_PATH, 'utf8'))
} catch (err) {
  fail(`livePrices.json failed to parse — ${err.message}`)
}
if (!Array.isArray(live)) fail('livePrices.json is not an array')
if (live.length < MIN_LIVE_PRICES)
  fail(`livePrices.json has ${live.length} entries — below coverage floor of ${MIN_LIVE_PRICES} (97% of 1156 baseline). Likely a partial JustTCG run.`)

// ── Invariant 7: every marketPrice is a finite positive number ──────────────
for (const e of live) {
  const p = e?.marketPrice
  if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0)
    fail(`invalid marketPrice ${JSON.stringify(p)} on entry ${JSON.stringify(e).slice(0, 120)}`)
}

// ── Invariants 8 & 9 (TRANSITIONAL — see TODO below) ────────────────────────
// History is moving from inline (livePrices.json entries) to a separate
// asset (public/priceHistory30d.json). During the split, accept either
// shape so the dev branch is not broken between the script change and the
// bot's first regenerated commit.
//
// TODO(post-split-tighten): once the bot has committed both new files at
// least once, tighten these to:
//   - livePrices entries MUST NOT contain a `history` field
//   - public/priceHistory30d.json MUST exist
//   - every key in priceHistory30d.json must be present in livePrices.json
// Any inline history detected at that point should be a hard fail.

// Inline history schema — old shape (kept lenient during transition).
function validateInlineHistory(entry) {
  if (entry.history == null) return false
  if (!Array.isArray(entry.history))
    fail(`livePrices entry ${entry.cardCode}: "history" is not an array`)
  for (const h of entry.history) {
    if (typeof h?.p !== 'number' || !Number.isFinite(h.p) || h.p <= 0)
      fail(`livePrices entry ${entry.cardCode}: invalid history price ${JSON.stringify(h)}`)
    if (typeof h?.t !== 'number' || !Number.isFinite(h.t) || h.t <= 0)
      fail(`livePrices entry ${entry.cardCode}: invalid history timestamp ${JSON.stringify(h)}`)
  }
  return entry.history.length > 0
}

// External history schema — new shape (cardCode → [{p,t}]).
function validateExternalHistory(historyMap, liveCardCodes) {
  if (typeof historyMap !== 'object' || historyMap === null || Array.isArray(historyMap))
    fail('priceHistory30d.json is not a plain object')
  let count = 0
  for (const [code, hist] of Object.entries(historyMap)) {
    if (!liveCardCodes.has(code))
      fail(`priceHistory30d.json contains cardCode "${code}" not in livePrices.json`)
    if (!Array.isArray(hist))
      fail(`priceHistory30d.json[${code}]: not an array`)
    for (const h of hist) {
      if (typeof h?.p !== 'number' || !Number.isFinite(h.p) || h.p <= 0)
        fail(`priceHistory30d.json[${code}]: invalid price ${JSON.stringify(h)}`)
      if (typeof h?.t !== 'number' || !Number.isFinite(h.t) || h.t <= 0)
        fail(`priceHistory30d.json[${code}]: invalid timestamp ${JSON.stringify(h)}`)
    }
    if (hist.length > 0) count++
  }
  return count
}

let inlineCount  = 0
let externalCount = 0
let shapeLabel   = ''

const hasInlineHistory   = live.some(e => Array.isArray(e.history))
const hasExternalHistory = fs.existsSync(HISTORY_PATH)

// Invariant 8: at least one history source must exist
if (!hasInlineHistory && !hasExternalHistory) {
  fail('no priceHistory found — neither inline in livePrices.json nor at public/priceHistory30d.json')
}

// Invariant 9: whichever sources exist, their schemas must validate
if (hasInlineHistory) {
  for (const e of live) {
    if (validateInlineHistory(e)) inlineCount++
  }
}
if (hasExternalHistory) {
  let externalHistory
  try {
    externalHistory = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'))
  } catch (err) {
    fail(`priceHistory30d.json failed to parse — ${err.message}`)
  }
  const liveCardCodes = new Set(live.map(e => e.cardCode))
  externalCount = validateExternalHistory(externalHistory, liveCardCodes)
}

if (hasInlineHistory && hasExternalHistory) shapeLabel = 'BOTH shapes (transitional)'
else if (hasExternalHistory)                shapeLabel = 'split shape'
else                                        shapeLabel = 'inline shape (transitional)'

const totalHistory = inlineCount + externalCount
console.log(`✓ ${cards.length} cards, ${live.length} live prices (${totalHistory} with history, ${shapeLabel}), 9 invariants passed`)
