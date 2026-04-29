#!/usr/bin/env node
/**
 * scripts/update-prices.js
 * Quota-safe JustTCG price refresh with set rotation + merge.
 *
 * Modes (env UPDATE_MODE, default 'rotation'):
 *   rotation  Fetch only the target sets, merge into the previous known-good
 *             snapshot, carry forward all other sets unchanged. ~21–25 reqs.
 *             Auto-picks group A/B/C from ISO week unless UPDATE_SETS is set.
 *   full      Fetch all 9 sets. ~67 reqs. Quota-risky on the free tier.
 *
 * Target sets (env UPDATE_SETS, e.g. "FB01,FB02"):
 *   When provided in rotation mode, overrides ISO-week auto-rotation.
 *   Ignored in full mode.
 *
 * Outputs (only when the merged-output coverage guard passes):
 *   src/livePrices.json          current prices, no inline history
 *   public/priceHistory30d.json  cardCode → [{p,t}] (lazy-fetched by UI)
 *   public/priceUpdateLog.json   metadata: which sets refreshed and when
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const API_KEY  = process.env.JUSTTCG_API_KEY
const BASE_URL = 'https://api.justtcg.com/v1'

if (!API_KEY) {
  console.error('ERROR: JUSTTCG_API_KEY environment variable not set')
  process.exit(1)
}

const SET_SLUGS = {
  FB01: 'awakened-pulse-dragon-ball-super-fusion-world',
  FB02: 'blazing-aura-dragon-ball-super-fusion-world',
  FB03: 'raging-roar-dragon-ball-super-fusion-world',
  FB04: 'ultra-limit-dragon-ball-super-fusion-world',
  FB05: 'new-adventure-dragon-ball-super-fusion-world',
  FB06: 'rivals-clash-dragon-ball-super-fusion-world',
  FB07: 'wish-for-shenron-dragon-ball-super-fusion-world',
  FB08: 'saiyan-s-pride-dragon-ball-super-fusion-world',   // apostrophe → -s-
  FB09: 'dual-evolution-dragon-ball-super-fusion-world',
}
const ALL_SETS = Object.keys(SET_SLUGS)

// Rotation groups — 3 sets per group → ~21–25 requests per run, 3-week cycle.
const ROTATION_GROUPS = {
  A: ['FB01', 'FB02', 'FB03'],
  B: ['FB04', 'FB05', 'FB06'],
  C: ['FB07', 'FB08', 'FB09'],
}

// Load local card index — keyed by full code "FB01-001"
const cardDataPath = path.join(__dirname, '..', 'src', 'cardData.json')
const localCards   = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'))
const LOCAL_MAP    = new Map(localCards.map(c => [c.code, c]))

// ── Typed errors so main() can route on cause ────────────────────────────────
class AuthError        extends Error { constructor(m)         { super(m); this.name = 'AuthError' } }
class RateLimitedError extends Error { constructor(m)         { super(m); this.name = 'RateLimitedError' } }
class ApiError         extends Error { constructor(m, status) { super(m); this.name = 'ApiError'; this.status = status } }

// ── Single global request queue ──────────────────────────────────────────────
const MIN_SPACING_MS         = 8000
const RATE_LIMIT_BACKOFFS_MS = [90_000, 180_000, 360_000]   // up to 3 retries on 429
const TRANSIENT_BACKOFFS_MS  = [15_000, 30_000]             // up to 2 retries on 5xx / network

let nextAllowedAt  = 0
let requestCounter = 0
let totalRequests  = 0

const sleep = ms => new Promise(r => setTimeout(r, ms))

function parseRetryAfter(headerVal) {
  if (!headerVal) return null
  const seconds = Number(headerVal)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(headerVal)
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now())
  return null
}

async function request(url, { setCode, offset }) {
  const reqNum = ++requestCounter
  const tag    = `[req ${reqNum}/${totalRequests}]`

  let rateLimitAttempt = 0
  let transientAttempt = 0

  while (true) {
    const wait = Math.max(0, nextAllowedAt - Date.now())
    if (wait > 0) await sleep(wait)

    const cycleStart = Date.now()
    let res
    try {
      res = await fetch(url, {
        headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' },
      })
    } catch (err) {
      if (transientAttempt < TRANSIENT_BACKOFFS_MS.length) {
        const backoff = TRANSIENT_BACKOFFS_MS[transientAttempt++]
        console.warn(`${tag} ${setCode} offset=${offset} → NETWORK_ERROR retry=${transientAttempt} wait=${backoff/1000}s (${err.message})`)
        nextAllowedAt = Date.now() + backoff
        continue
      }
      throw new ApiError(`Network failure after ${TRANSIENT_BACKOFFS_MS.length} retries on ${url}: ${err.message}`)
    }

    const status = res.status
    const cycleS = ((Date.now() - cycleStart) / 1000).toFixed(1)

    if (res.ok) {
      const totalRetries = rateLimitAttempt + transientAttempt
      const retryNote    = totalRetries > 0 ? ` retry=${totalRetries}` : ''
      console.log(`${tag} ${setCode} offset=${offset} → ${status} cycle=${cycleS}s${retryNote}`)
      nextAllowedAt = Date.now() + MIN_SPACING_MS
      return res
    }

    if (status === 401 || status === 403) {
      console.error(`${tag} ${setCode} offset=${offset} → ${status} AUTH_ERROR — no retry`)
      throw new AuthError(`HTTP ${status} on ${url}`)
    }

    if (status === 429) {
      if (rateLimitAttempt >= RATE_LIMIT_BACKOFFS_MS.length) {
        console.error(`${tag} ${setCode} offset=${offset} → 429 after ${RATE_LIMIT_BACKOFFS_MS.length} retries — RATE_LIMITED`)
        throw new RateLimitedError(`429 after ${RATE_LIMIT_BACKOFFS_MS.length} retries on ${setCode} offset=${offset}`)
      }
      const headerMs   = parseRetryAfter(res.headers.get('retry-after'))
      const usedHeader = headerMs != null
      const waitMs     = usedHeader ? headerMs : RATE_LIMIT_BACKOFFS_MS[rateLimitAttempt]
      rateLimitAttempt++
      const headerNote = usedHeader ? ' (Retry-After)' : ''
      console.warn(`${tag} ${setCode} offset=${offset} → 429 retry=${rateLimitAttempt} wait=${(waitMs/1000).toFixed(0)}s${headerNote}`)
      nextAllowedAt = Date.now() + waitMs
      continue
    }

    if (status >= 500) {
      if (transientAttempt >= TRANSIENT_BACKOFFS_MS.length) {
        console.error(`${tag} ${setCode} offset=${offset} → ${status} after ${TRANSIENT_BACKOFFS_MS.length} retries`)
        throw new ApiError(`HTTP ${status} after ${TRANSIENT_BACKOFFS_MS.length} retries on ${url}`, status)
      }
      const backoff = TRANSIENT_BACKOFFS_MS[transientAttempt++]
      console.warn(`${tag} ${setCode} offset=${offset} → ${status} retry=${transientAttempt} wait=${backoff/1000}s (5xx)`)
      nextAllowedAt = Date.now() + backoff
      continue
    }

    console.error(`${tag} ${setCode} offset=${offset} → ${status} unexpected`)
    throw new ApiError(`HTTP ${status} on ${url}`, status)
  }
}

// Pick the best variant: Near Mint Normal > Near Mint > first available
function bestVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null
  const nmNormal = variants.find(v => v.condition === 'Near Mint' && v.printing === 'Normal')
  const nm       = variants.find(v => v.condition === 'Near Mint')
  return nmNormal ?? nm ?? variants[0]
}

async function fetchAllCards(setCode, slug) {
  const cards = []
  let offset  = 0
  const limit = 20

  while (true) {
    const url = `${BASE_URL}/cards?set=${encodeURIComponent(slug)}&limit=${limit}&offset=${offset}`
              + `&include_price_history=true&priceHistoryDuration=30d`
    const res = await request(url, { setCode, offset })

    const body = await res.json()
    const page = body.data ?? []
    cards.push(...page)

    if (!body.meta?.hasMore || page.length < limit) break
    offset += limit
  }

  return cards
}

async function fetchSetPrices(setCode, slug) {
  const allCards = await fetchAllCards(setCode, slug)

  if (allCards.length === 0) {
    console.warn(`[${setCode}] WARNING: 0 cards returned for slug "${slug}" — slug may be wrong`)
    return []
  }

  const entryMap = new Map()  // code → { marketPrice, history }
  for (const card of allCards) {
    const code = card.number
    if (!code || code === 'N/A') continue
    if (!LOCAL_MAP.has(code)) continue

    const variant = bestVariant(card.variants)
    if (variant?.price == null) continue

    const price   = +Number(variant.price).toFixed(2)
    const history = Array.isArray(variant.priceHistory) ? variant.priceHistory : []

    const existing = entryMap.get(code)
    if (!existing || price < existing.marketPrice)
      entryMap.set(code, { marketPrice: price, history })
  }

  const ts      = new Date().toISOString()
  const results = [...entryMap.entries()].map(([code, { marketPrice, history }]) => ({
    cardCode:    code,
    marketPrice,
    timestamp:   ts,
    history,
  }))

  console.log(`[${setCode}] matched ${results.length} / ${allCards.length} entries`)
  return results
}

// ── Rotation / target-set resolution ─────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(date.getTime())
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function pickRotationGroup(date = new Date()) {
  const week = getISOWeek(date)
  const idx  = ((week - 1) % 3 + 3) % 3
  return ['A', 'B', 'C'][idx]
}

function parseSetsEnv(envVal) {
  if (!envVal) return null
  const requested = envVal.split(',').map(s => s.trim()).filter(Boolean)
  if (requested.length === 0) return null
  const invalid = requested.filter(s => !SET_SLUGS[s])
  if (invalid.length > 0) {
    throw new Error(`Unknown set codes in UPDATE_SETS: ${invalid.join(', ')}. Valid: ${ALL_SETS.join(', ')}`)
  }
  return requested
}

function resolveTargetSets() {
  const mode     = (process.env.UPDATE_MODE || 'rotation').toLowerCase()
  const explicit = parseSetsEnv(process.env.UPDATE_SETS)

  if (mode === 'full') {
    return { mode: 'full', group: null, targetSets: ALL_SETS }
  }
  if (mode === 'rotation') {
    if (explicit) return { mode: 'rotation', group: 'manual', targetSets: explicit }
    const group = pickRotationGroup()
    return { mode: 'rotation', group, targetSets: ROTATION_GROUPS[group] }
  }
  throw new Error(`Unknown UPDATE_MODE: "${mode}" (expected 'rotation' or 'full')`)
}

function estimateTotalRequests(targetSets) {
  const bySet = {}
  for (const c of localCards) bySet[c.set] = (bySet[c.set] ?? 0) + 1
  let total = 0
  for (const setCode of targetSets) {
    total += Math.max(1, Math.ceil((bySet[setCode] ?? 0) / 20))
  }
  return total
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { mode, group, targetSets } = resolveTargetSets()
  const targetSetSet = new Set(targetSets)

  const livePath      = path.join(__dirname, '..', 'src', 'livePrices.json')
  const historyPath   = path.join(__dirname, '..', 'public', 'priceHistory30d.json')
  const updateLogPath = path.join(__dirname, '..', 'public', 'priceUpdateLog.json')

  // Load previous live prices (mandatory for rotation; recommended for full)
  let previousLive = []
  if (fs.existsSync(livePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(livePath, 'utf8'))
      if (Array.isArray(parsed)) previousLive = parsed
    } catch { /* treat as missing */ }
  }
  if (mode === 'rotation' && previousLive.length === 0) {
    console.error('Rotation mode requires a previous src/livePrices.json baseline.')
    console.error('Run with UPDATE_MODE=full once to bootstrap, then return to rotation.')
    process.exit(1)
  }

  // Load (or bootstrap) previous history map
  let previousHistory = {}
  let historySource   = 'none'
  if (fs.existsSync(historyPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        previousHistory = parsed
        historySource = 'public/priceHistory30d.json'
      }
    } catch { /* fall through to bootstrap */ }
  }
  if (historySource === 'none' && previousLive.some(e => Array.isArray(e.history) && e.history.length > 0)) {
    for (const e of previousLive) {
      if (Array.isArray(e.history) && e.history.length > 0) {
        previousHistory[e.cardCode] = e.history
      }
    }
    historySource = 'bootstrapped from inline history in src/livePrices.json'
  }

  totalRequests = estimateTotalRequests(targetSets)

  const carrySets = ALL_SETS.filter(s => !targetSetSet.has(s))
  console.log('── JustTCG quota-safe refresh ─────────────────────────────')
  console.log(`Mode:                ${mode}${group ? `  (group ${group})` : ''}`)
  console.log(`Refresh targets:     ${targetSets.join(', ')}`)
  console.log(`Carry forward:       ${carrySets.length > 0 ? carrySets.join(', ') : '(none — full refresh)'}`)
  console.log(`Estimated requests:  ${totalRequests}  (limit=20)`)
  console.log(`Min request spacing: ${MIN_SPACING_MS}ms`)
  console.log(`History source:      ${historySource}`)
  console.log('')

  // Fetch only the target sets
  const fetchedPrices = []
  let abortReason = null

  for (const setCode of targetSets) {
    if (abortReason) {
      console.log(`Skipping ${setCode}: ${abortReason}`)
      continue
    }
    const slug = SET_SLUGS[setCode]
    console.log(`Fetching ${setCode}...`)
    try {
      const prices = await fetchSetPrices(setCode, slug)
      fetchedPrices.push(...prices)
    } catch (err) {
      if (err instanceof RateLimitedError) {
        console.error(`\n[${setCode}] ${err.message}`)
        abortReason = `rate-limited on ${setCode}`
        break
      }
      if (err instanceof AuthError) {
        console.error(`\n[${setCode}] ${err.message}`)
        abortReason = `auth error on ${setCode}`
        break
      }
      console.error(`\n[${setCode}] ${err.message}`)
    }
  }

  if (abortReason) {
    console.error(`\n✗ Run aborted: ${abortReason}`)
    console.error('Coverage guard will run anyway and likely fail, protecting existing files.')
  }

  // ── Merge: carry-forward + freshly fetched ─────────────────────────────
  const carryForward = previousLive.filter(e => {
    const s = e.cardCode?.split('-')[0]
    return s && !targetSetSet.has(s)
  })

  // Final livePrices: split shape, no inline history
  const merged = []
  for (const e of carryForward) {
    merged.push({ cardCode: e.cardCode, marketPrice: e.marketPrice, timestamp: e.timestamp })
  }
  for (const e of fetchedPrices) {
    merged.push({ cardCode: e.cardCode, marketPrice: e.marketPrice, timestamp: e.timestamp })
  }

  // Final historyMap: carry-forward history for non-target sets, fresh for target
  const mergedHistory = {}
  for (const [code, hist] of Object.entries(previousHistory)) {
    const s = code.split('-')[0]
    if (!targetSetSet.has(s) && Array.isArray(hist) && hist.length > 0) {
      mergedHistory[code] = hist
    }
  }
  for (const e of fetchedPrices) {
    if (Array.isArray(e.history) && e.history.length > 0) {
      mergedHistory[e.cardCode] = e.history
    }
  }

  // ── Coverage regression guard (validates the merged output) ────────────
  const MIN_TOTAL          = 1121          // 1156 × 0.97 floor
  const PER_SET_FLOOR_RATIO = 0.90

  const prevPerSet = {}
  for (const e of previousLive) {
    const s = e.cardCode?.split('-')[0]
    if (s) prevPerSet[s] = (prevPerSet[s] ?? 0) + 1
  }
  const newPerSet = {}
  for (const e of merged) {
    const s = e.cardCode?.split('-')[0]
    if (s) newPerSet[s] = (newPerSet[s] ?? 0) + 1
  }

  console.log('\n── Coverage guard (merged output) ─────────────────────────')
  console.log(`Refreshed entries:   ${fetchedPrices.length}  (sets: ${targetSets.join(', ')})`)
  console.log(`Carried forward:     ${carryForward.length}`)
  console.log(`Merged total:        ${merged.length}`)
  console.log(`Minimum required:    ${MIN_TOTAL}  (97% of 1156 baseline)`)

  const failures = []
  if (merged.length < MIN_TOTAL) {
    failures.push(`merged total ${merged.length} < minimum ${MIN_TOTAL}`)
  }

  console.log('Per-set check (must be ≥ 90% of previous):')
  const allUnion = new Set([...Object.keys(prevPerSet), ...Object.keys(newPerSet)])
  for (const s of [...allUnion].sort()) {
    const prev   = prevPerSet[s] ?? 0
    const curr   = newPerSet[s]  ?? 0
    const minSet = Math.floor(prev * PER_SET_FLOOR_RATIO)
    const ok     = curr >= minSet
    const note   = targetSetSet.has(s) ? '(refreshed)' : '(carried forward)'
    console.log(`  ${s}: prev=${prev}  curr=${curr}  min=${minSet}  ${ok ? '✓' : '✗'} ${note}`)
    if (!ok) failures.push(`set ${s}: ${curr} < ${minSet} (90% of ${prev})`)
  }

  if (failures.length > 0) {
    console.error('\n✗ Coverage guard FAILED — refusing to write degraded files:')
    for (const f of failures) console.error(`    ${f}`)
    console.error('\nNo files were written. The bot will see no diff and skip commit.')
    process.exit(1)
  }

  console.log('\n✓ Coverage guard PASSED — writing files.')

  // ── Write outputs ──────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(historyPath), { recursive: true })
  fs.writeFileSync(livePath,    JSON.stringify(merged,         null, 2))
  fs.writeFileSync(historyPath, JSON.stringify(mergedHistory,  null, 2))

  // Update log (capped at 12 entries)
  const runRecord = {
    runAt:    new Date().toISOString(),
    mode,
    group:    group ?? 'manual',
    sets:     targetSets,
    fetched:  fetchedPrices.length,
    merged:   merged.length,
  }
  let log = { history: [] }
  if (fs.existsSync(updateLogPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(updateLogPath, 'utf8'))
      if (parsed && typeof parsed === 'object') log = parsed
      if (!Array.isArray(log.history)) log.history = []
    } catch { /* start fresh */ }
  }
  log.lastRunAt          = runRecord.runAt
  log.lastMode           = runRecord.mode
  log.lastGroup          = runRecord.group
  log.lastRefreshedSets  = runRecord.sets
  log.lastFetchedCount   = runRecord.fetched
  log.lastMergedCount    = runRecord.merged
  log.history.unshift(runRecord)
  log.history = log.history.slice(0, 12)
  fs.writeFileSync(updateLogPath, JSON.stringify(log, null, 2))

  console.log(`\nWrote ${merged.length} live prices → src/livePrices.json (split shape, no inline history)`)
  console.log(`Wrote ${Object.keys(mergedHistory).length} history entries → public/priceHistory30d.json`)
  console.log(`Wrote refresh metadata → public/priceUpdateLog.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
