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

async function fetchWithRetry(url, options, retries = 4) {
  let delay = 65000   // free tier: 10 req/min → wait >60s on 429
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options)
    if (res.status === 429) {
      console.warn(`Rate limited. Waiting ${Math.round(delay/1000)}s...`)
      await new Promise(r => setTimeout(r, delay))
      delay *= 2
      continue
    }
    return res
  }
  throw new Error(`Failed after ${retries} retries: ${url}`)
}

// Pick the best variant: Near Mint Normal > Near Mint > first available
function bestVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null
  const nmNormal = variants.find(v => v.condition === 'Near Mint' && v.printing === 'Normal')
  const nm       = variants.find(v => v.condition === 'Near Mint')
  return nmNormal ?? nm ?? variants[0]
}

async function fetchAllCards(slug) {
  const headers = { 'x-api-key': API_KEY, 'Accept': 'application/json' }
  const cards   = []
  let offset    = 0
  const limit   = 20   // free tier max

  while (true) {
    const url = `${BASE_URL}/cards?set=${encodeURIComponent(slug)}&limit=${limit}&offset=${offset}`
                + `&include_price_history=true&priceHistoryDuration=30d`
    const res = await fetchWithRetry(url, { headers })

    if (!res.ok) {
      console.warn(`  HTTP ${res.status} at offset ${offset} — stopping`)
      break
    }

    const body = await res.json()
    const page = body.data ?? []
    cards.push(...page)

    if (!body.meta?.hasMore || page.length < limit) break
    offset += limit
    await new Promise(r => setTimeout(r, 7000))  // 10 req/min limit → 7s between pages
  }

  return cards
}

async function fetchSetPrices(setCode, slug) {
  const allCards = await fetchAllCards(slug)

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

async function main() {
  const allPrices = []

  for (const [setCode, slug] of Object.entries(SET_SLUGS)) {
    process.stdout.write(`Fetching ${setCode}... `)
    try {
      const prices = await fetchSetPrices(setCode, slug)
      allPrices.push(...prices)
    } catch (err) {
      console.error(`\n[${setCode}] Error: ${err.message}`)
    }
    // Extra buffer between sets (inter-page delay already handles most of it)
    await new Promise(r => setTimeout(r, 3000))
  }

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

  const livePath    = path.join(__dirname, '..', 'src', 'livePrices.json')
  const historyPath = path.join(__dirname, '..', 'public', 'priceHistory30d.json')
  fs.mkdirSync(path.dirname(historyPath), { recursive: true })

  fs.writeFileSync(livePath,    JSON.stringify(livePrices, null, 2))
  fs.writeFileSync(historyPath, JSON.stringify(historyMap, null, 2))

  console.log(`\nWrote ${livePrices.length} live prices → src/livePrices.json`)
  console.log(`Wrote ${Object.keys(historyMap).length} history entries → public/priceHistory30d.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
