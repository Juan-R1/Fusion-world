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

// JustTCG set slugs — update these if the API returns 0 cards for a set
const SET_SLUGS = {
  FB01: 'awakened-pulse-dragon-ball-super-fusion-world',
  FB02: 'blazing-aura-dragon-ball-super-fusion-world',
  FB03: 'raging-roar-dragon-ball-super-fusion-world',
  FB04: 'ultra-limit-dragon-ball-super-fusion-world',
  FB05: 'new-adventure-dragon-ball-super-fusion-world',
  FB06: 'rivals-clash-dragon-ball-super-fusion-world',
  FB07: 'wish-for-shenron-dragon-ball-super-fusion-world',
  FB08: 'saiyans-pride-dragon-ball-super-fusion-world',
  FB09: 'dual-evolution-dragon-ball-super-fusion-world',
}

// Load local card index
const cardDataPath = path.join(__dirname, '..', 'src', 'cardData.json')
const localCards   = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'))

// Build lookup: setCode → Map<paddedNum|intNum, card>
// Registers both "001" and "1" so matching survives whatever format JustTCG uses
const setMaps = {}
for (const local of localCards) {
  const [setCode, num] = local.code.split('-')
  if (!setMaps[setCode]) setMaps[setCode] = new Map()
  setMaps[setCode].set(num, local)                          // zero-padded: "001"
  setMaps[setCode].set(String(parseInt(num, 10)), local)    // integer:     "1"
}

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

async function fetchSetPrices(setCode, slug) {
  const url = `${BASE_URL}/products?set=${encodeURIComponent(slug)}&limit=250`
  const res = await fetchWithRetry(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept':        'application/json',
    },
  })

  if (!res.ok) {
    console.warn(`[${setCode}] HTTP ${res.status} for slug "${slug}" — skipping`)
    return []
  }

  const data     = await res.json()
  const products = Array.isArray(data) ? data : (data.products ?? data.data ?? [])

  if (products.length === 0) {
    console.warn(`[${setCode}] WARNING: 0 products returned for slug "${slug}" — slug may be wrong`)
    return []
  }

  const map     = setMaps[setCode] ?? new Map()
  const results = []
  const ts      = new Date().toISOString()

  for (const product of products) {
    const numRaw  = product.number ?? product.cardNumber ?? product.card_number ?? ''
    const numMatch = String(numRaw).match(/(\d+)/)
    if (!numMatch) continue

    const local = map.get(numMatch[1].padStart(3, '0')) ?? map.get(numMatch[1])
    if (!local) continue

    const price = product.marketPrice ?? product.market_price ?? product.price ?? null
    if (price == null) continue

    results.push({
      cardCode:    local.code,   // "FB01-001" — field name matches LIVE_MAP key in data.js
      marketPrice: +Number(price).toFixed(2),
      timestamp:   ts,
    })
  }

  console.log(`[${setCode}] matched ${results.length} / ${products.length} products`)
  return results
}

async function main() {
  const allPrices = []

  for (const [setCode, slug] of Object.entries(SET_SLUGS)) {
    process.stdout.write(`Fetching ${setCode}...`)
    try {
      const prices = await fetchSetPrices(setCode, slug)
      allPrices.push(...prices)
    } catch (err) {
      console.error(`\n[${setCode}] Error: ${err.message}`)
    }
    // Polite delay — free tier is 100 req/day, 9 sets = well within limit
    await new Promise(r => setTimeout(r, 500))
  }

  const outPath = path.join(__dirname, '..', 'src', 'livePrices.json')
  fs.writeFileSync(outPath, JSON.stringify(allPrices, null, 2))
  console.log(`\nWrote ${allPrices.length} live prices → src/livePrices.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
