#!/usr/bin/env node
/**
 * scripts/update-prices.js
 * Fetches live market prices from JustTCG API → writes src/livePrices.json
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

async function fetchWithRetry(url, options, retries = 3) {
  let delay = 1000
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options)
    if (res.status === 429) {
      console.warn(`Rate limited. Waiting ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
      delay *= 2
      continue
    }
    return res
  }
  throw new Error(`Failed after ${retries} retries: ${url}`)
}

// Pick the best price variant: Near Mint Normal > Near Mint > first available
function bestPrice(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null
  const nmNormal = variants.find(v => v.condition === 'Near Mint' && v.printing === 'Normal')
  const nm       = variants.find(v => v.condition === 'Near Mint')
  const variant  = nmNormal ?? nm ?? variants[0]
  return variant?.price ?? null
}

async function fetchAllCards(slug) {
  const headers = { 'x-api-key': API_KEY, 'Accept': 'application/json' }
  const cards   = []
  let offset    = 0
  const limit   = 250

  while (true) {
    const url = `${BASE_URL}/cards?set=${encodeURIComponent(slug)}&limit=${limit}&offset=${offset}`
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
    await new Promise(r => setTimeout(r, 300))   // polite inter-page delay
  }

  return cards
}

async function fetchSetPrices(setCode, slug) {
  const allCards = await fetchAllCards(slug)

  if (allCards.length === 0) {
    console.warn(`[${setCode}] WARNING: 0 cards returned for slug "${slug}" — slug may be wrong`)
    return []
  }

  // De-duplicate by code: keep lowest Near Mint Normal price (base card, not alt art)
  const priceMap = new Map()  // code → price

  for (const card of allCards) {
    const code = card.number
    if (!code || code === 'N/A') continue        // skip sealed products
    if (!LOCAL_MAP.has(code)) continue           // skip codes not in our dataset

    const price = bestPrice(card.variants)
    if (price == null) continue

    // If same code appears multiple times (alt art), keep the lowest price
    if (!priceMap.has(code) || price < priceMap.get(code))
      priceMap.set(code, price)
  }

  const ts      = new Date().toISOString()
  const results = [...priceMap.entries()].map(([code, price]) => ({
    cardCode:    code,
    marketPrice: +Number(price).toFixed(2),
    timestamp:   ts,
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
    // Polite delay between sets — free tier: 100 req/day, rate limit: 10/min
    await new Promise(r => setTimeout(r, 600))
  }

  const outPath = path.join(__dirname, '..', 'src', 'livePrices.json')
  fs.writeFileSync(outPath, JSON.stringify(allPrices, null, 2))
  console.log(`\nWrote ${allPrices.length} live prices → src/livePrices.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
