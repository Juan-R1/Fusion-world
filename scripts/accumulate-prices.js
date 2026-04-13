#!/usr/bin/env node
/**
 * scripts/accumulate-prices.js
 * Archives the current src/livePrices.json snapshot into src/priceHistory.json.
 * Keeps a rolling 4-week window per card. Run BEFORE update-prices.js in CI.
 * Usage: node scripts/accumulate-prices.js
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MAX_WEEKS    = 4
const LIVE_PATH    = path.join(__dirname, '..', 'src', 'livePrices.json')
const HISTORY_PATH = path.join(__dirname, '..', 'src', 'priceHistory.json')

const live    = JSON.parse(fs.readFileSync(LIVE_PATH,    'utf8'))
const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'))

if (!Array.isArray(live) || live.length === 0) {
  console.log('livePrices.json is empty — nothing to accumulate yet')
  process.exit(0)
}

let archived = 0
for (const { cardCode, marketPrice, timestamp } of live) {
  if (!cardCode || marketPrice == null) continue
  if (!history[cardCode]) history[cardCode] = []

  // Idempotent: skip if this exact timestamp is already stored
  if (history[cardCode].some(e => e.timestamp === timestamp)) continue

  history[cardCode].push({ price: marketPrice, timestamp })

  // Rolling window: keep only the most recent MAX_WEEKS entries
  if (history[cardCode].length > MAX_WEEKS)
    history[cardCode] = history[cardCode].slice(-MAX_WEEKS)

  archived++
}

fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2))
console.log(`Archived ${archived} new price points → src/priceHistory.json`)
