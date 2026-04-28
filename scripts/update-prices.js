#!/usr/bin/env node
/**
 * scripts/update-prices.js
 * Fetches live market prices + 30d priceHistory from JustTCG → writes:
 *   src/livePrices.json          (current prices only — bundled)
 *   public/priceHistory30d.json  (cardCode → [{p,t}] — lazy-fetched by UI)
 * Run AFTER accumulate-prices.js in CI.
 * Usage: JUSTTCG_API_KEY=tcg_xxx node scripts/update-prices.js
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

// JustTCG set slugs — confirmed from /v1/sets?game=dragon-ball-super-fusion-world
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

// Load local card index — keyed by full code "FB01-001"
const cardDataPath = path.join(__dirname, '..', 'src', 'cardData.json')
const localCards   = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'))
const LOCAL_MAP    = new Map(localCards.map(c => [c.code, c]))

// ── Typed errors so main() can route on cause ────────────────────────────────
class AuthError        extends Error { constructor(m)         { super(m); this.name = 'AuthError' } }
class RateLimitedError extends Error { constructor(m)         { super(m); this.name = 'RateLimitedError' } }
class ApiError         extends Error { constructor(m, status) { super(m); this.name = 'ApiError'; this.status = status } }

// ── Single global request queue ──────────────────────────────────────────────
// All API calls go through request(). It is the ONLY place that owns spacing
// and retry logic, so set-level and run-level loops cannot accidentally diverge.
const MIN_SPACING_MS         = 8000
const RATE_LIMIT_BACKOFFS_MS = [90_000, 180_000, 360_000]   // up to 3 retries on 429
const TRANSIENT_BACKOFFS_MS  = [15_000, 30_000]             // up to 2 retries on 5xx / network

let nextAllowedAt  = 0
let requestCounter = 0
let totalRequests  = 0   // populated at the start of main()

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Retry-After can be seconds (integer) or an HTTP-date. Returns ms or null.
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
    // Global spacing
    const wait = Math.max(0, nextAllowedAt - Date.now())
    if (wait > 0) await sleep(wait)

    const cycleStart = Date.now()
    let res
    try {
      res = await fetch(url, {
        headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' },
      })
    } catch (err) {
      // Network / DNS failure
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

    // 2xx
    if (res.ok) {
      const totalRetries = rateLimitAttempt + transientAttempt
      const retryNote    = totalRetries > 0 ? ` retry=${totalRetries}` : ''
      console.log(`${tag} ${setCode} offset=${offset} → ${status} cycle=${cycleS}s${retryNote}`)
      nextAllowedAt = Date.now() + MIN_SPACING_MS
      return res
    }

    // 401 / 403 — auth, do not retry, abort run
    if (status === 401 || status === 403) {
      console.error(`${tag} ${setCode} offset=${offset} → ${status} AUTH_ERROR — no retry`)
      throw new AuthError(`HTTP ${status} on ${url}`)
    }

    // 429 — rate limited
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

    // 5xx — transient server error
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

    // Any other 4xx — unexpected, no retry
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
  const limit = 20   // free tier max

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

  // De-duplicate by code: keep lowest Near Mint Normal price (base card, not alt art).
  // Each entry stores marketPrice plus the chosen variant's priceHistory ({p, t}[]).
  const entryMap = new Map()  // code → { marketPrice, history }

  for (const card of allCards) {
    const code = card.number
    if (!code || code === 'N/A') continue        // skip sealed products
    if (!LOCAL_MAP.has(code)) continue           // skip codes not in our dataset

    const variant = bestVariant(card.variants)
    if (variant?.price == null) continue

    const price   = +Number(variant.price).toFixed(2)
    const history = Array.isArray(variant.priceHistory) ? variant.priceHistory : []

    // If same code appears multiple times (alt art), keep the lowest price
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

// Estimate total page-requests for the log header. Based on local cardData
// counts; the actual count may differ by a page or two if JustTCG's catalog
// for a set doesn't perfectly match ours.
function estimateTotalRequests() {
  const bySet = {}
  for (const c of localCards) bySet[c.set] = (bySet[c.set] ?? 0) + 1
  let total = 0
  for (const setCode of Object.keys(SET_SLUGS)) {
    total += Math.max(1, Math.ceil((bySet[setCode] ?? 0) / 20))
  }
  return total
}

async function main() {
  const allPrices = []
  let abortReason = null

  totalRequests = estimateTotalRequests()
  console.log('── JustTCG full refresh ───────────────────────────────────')
  console.log(`Estimated requests:  ${totalRequests}  (limit=20 across 9 sets)`)
  console.log(`Min request spacing: ${MIN_SPACING_MS}ms`)
  console.log(`Rate-limit retries:  ${RATE_LIMIT_BACKOFFS_MS.length} (waits: ${RATE_LIMIT_BACKOFFS_MS.map(n => n/1000 + 's').join(', ')}, Retry-After honored)`)
  console.log('')

  for (const [setCode, slug] of Object.entries(SET_SLUGS)) {
    if (abortReason) {
      console.log(`Skipping ${setCode}: ${abortReason}`)
      continue
    }

    console.log(`Fetching ${setCode}...`)
    try {
      const prices = await fetchSetPrices(setCode, slug)
      allPrices.push(...prices)
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
      // ApiError or unexpected — log and continue with remaining sets
      console.error(`\n[${setCode}] ${err.message}`)
    }
  }

  if (abortReason) {
    console.error(`\n✗ Run aborted: ${abortReason}`)
    console.error('Coverage guard will run anyway and likely fail, protecting existing files.')
  }

  // ── Coverage regression guard ───────────────────────────────────────────
  // Refuse to write files when this run's coverage is materially below the
  // last known-good baseline. Two checks:
  //   1. Absolute floor: total ≥ MIN_TOTAL (97% of the 1,156-card baseline).
  //   2. Per-set floor: each set ≥ 90% of the previous file's per-set count.
  // If either fails, log loudly, exit non-zero, do NOT touch the JSON files.
  // The bot's add-and-commit step will see no changes and skip its commit.
  const MIN_TOTAL          = 1121          // 1156 × 0.97 = 1121.32 → floor 1121
  const PER_SET_FLOOR_RATIO = 0.90

  const livePath    = path.join(__dirname, '..', 'src', 'livePrices.json')
  const historyPath = path.join(__dirname, '..', 'public', 'priceHistory30d.json')

  // Read the previous on-disk livePrices for per-set baseline.
  const prevPerSet = {}
  let prevTotal    = 0
  if (fs.existsSync(livePath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(livePath, 'utf8'))
      if (Array.isArray(prev)) {
        prevTotal = prev.length
        for (const e of prev) {
          const s = e.cardCode?.split('-')[0]
          if (s) prevPerSet[s] = (prevPerSet[s] ?? 0) + 1
        }
      }
    } catch { /* unreadable prev file: treat as no baseline; absolute floor still applies */ }
  }

  const newPerSet = {}
  for (const e of allPrices) {
    const s = e.cardCode?.split('-')[0]
    if (s) newPerSet[s] = (newPerSet[s] ?? 0) + 1
  }

  console.log('\n── Coverage guard ─────────────────────────────────────────')
  console.log(`Previous file count: ${prevTotal}`)
  console.log(`Current run count:   ${allPrices.length}`)
  console.log(`Minimum required:    ${MIN_TOTAL}  (97% of 1156 baseline)`)

  const failures = []
  if (allPrices.length < MIN_TOTAL) {
    failures.push(`total ${allPrices.length} < minimum ${MIN_TOTAL}`)
  }

  console.log('Per-set check (must be ≥ 90% of previous):')
  const sets = new Set([...Object.keys(prevPerSet), ...Object.keys(newPerSet)])
  for (const s of [...sets].sort()) {
    const prev   = prevPerSet[s] ?? 0
    const curr   = newPerSet[s]  ?? 0
    const minSet = Math.floor(prev * PER_SET_FLOOR_RATIO)
    const ok     = curr >= minSet
    console.log(`  ${s}: prev=${prev}  curr=${curr}  min=${minSet}  ${ok ? '✓' : '✗'}`)
    if (!ok) failures.push(`set ${s}: ${curr} < ${minSet} (90% of ${prev})`)
  }

  if (failures.length > 0) {
    console.error('\n✗ Coverage guard FAILED — refusing to write degraded files:')
    for (const f of failures) console.error(`    ${f}`)
    console.error('\nNo files were written. The bot will see no diff and skip commit.')
    process.exit(1)
  }

  console.log('\n✓ Coverage guard PASSED — writing files.')

  // Split persistence:
  //   src/livePrices.json          → bundled, current prices only (no history)
  //   public/priceHistory30d.json  → static asset, lazy-fetched by CardDetail
  const livePrices = allPrices.map(({ cardCode, marketPrice, timestamp }) => ({
    cardCode,
    marketPrice,
    timestamp,
  }))

  const historyMap = {}
  for (const { cardCode, history } of allPrices) {
    if (Array.isArray(history) && history.length > 0) {
      historyMap[cardCode] = history
    }
  }

  fs.mkdirSync(path.dirname(historyPath), { recursive: true })
  fs.writeFileSync(livePath,    JSON.stringify(livePrices, null, 2))
  fs.writeFileSync(historyPath, JSON.stringify(historyMap, null, 2))

  console.log(`\nWrote ${livePrices.length} live prices → src/livePrices.json`)
  console.log(`Wrote ${Object.keys(historyMap).length} history entries → public/priceHistory30d.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
