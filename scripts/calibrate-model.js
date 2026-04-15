#!/usr/bin/env node
/**
 * scripts/calibrate-model.js
 * Fits a rarity-stratified price model against real prices.
 *
 * Model:
 *   log(predictedPrice) = log(basePrice[rarity]) + β * (charPremium - meanCharPremium)
 *
 *   → basePrice[rarity]  = geometric mean of real prices for that rarity
 *   → β                  = OLS slope of log(price) on charPremium, within-rarity
 *   → meanCharPremium    = global mean charPremium across all cards with prices
 *
 * This fixes the global-OLS problem where 600 common cards dominated the fit
 * and made SCR/SPR predictions 10–100× too low.
 *
 * Outputs:
 *   - Per-rarity geometric mean prices and card counts
 *   - Fitted β and R²
 *   - Example price table (old → new) for all rarities
 *   - Exact replacement constants to paste into src/data.js
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const cardData   = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/cardData.json'),  'utf8'))
const livePrices = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/livePrices.json'), 'utf8'))

const priceMap = new Map(livePrices.map(e => [e.cardCode, e.marketPrice]))

// ── Feature helpers (mirror data.js exactly) ───────────────────────────────
const LOG_MIN = Math.log(1 / 0.55)
const LOG_MAX = Math.log(1 / 0.003)
const pullCostOf    = r => ((Math.log(1 / r) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 9 + 1
const charPremiumOf = g => Math.max(1, Math.min(10, (g / 100) * 9 + 1))

// ── Build dataset ──────────────────────────────────────────────────────────
const rows = []
for (const card of cardData) {
  const price = priceMap.get(card.code)
  if (!price || price <= 0) continue
  rows.push({
    rarity:      card.rarity,
    pullCost:    pullCostOf(card.pullRate),
    charPremium: charPremiumOf(card.googleTrends),
    logPrice:    Math.log(price),
    price,
  })
}

console.log(`Dataset: ${rows.length} cards with live prices\n`)

// ── Step 1: Per-rarity stats ───────────────────────────────────────────────
const RARITY_ORDER = ['C', 'UC', 'R', 'SR', 'SCR', 'SPR', 'L']
const byRarity = {}
for (const r of RARITY_ORDER) byRarity[r] = []
for (const row of rows) {
  if (byRarity[row.rarity]) byRarity[row.rarity].push(row)
}

console.log('── Per-rarity real price distribution ───────────────────────')
console.log('  Rarity  Count   GeoMean    Median      P10      P90')
console.log('  ──────────────────────────────────────────────────────────')

const geoMeans = {}
for (const rar of RARITY_ORDER) {
  const group = byRarity[rar]
  if (!group.length) { geoMeans[rar] = null; continue }
  const prices = group.map(r => r.price).sort((a, b) => a - b)
  const geoMean = Math.exp(group.reduce((s, r) => s + r.logPrice, 0) / group.length)
  const median  = prices[Math.floor(prices.length / 2)]
  const p10     = prices[Math.floor(prices.length * 0.10)]
  const p90     = prices[Math.floor(prices.length * 0.90)]
  geoMeans[rar] = geoMean
  console.log(`  ${rar.padEnd(6)}  ${String(group.length).padStart(4)}   $${geoMean.toFixed(2).padStart(7)}  $${median.toFixed(2).padStart(7)}  $${p10.toFixed(2).padStart(6)}  $${p90.toFixed(2).padStart(6)}`)
}

// ── Step 2: Fit β for charPremium within-rarity ────────────────────────────
// Within each rarity, regress (logPrice - log(geoMean)) ~ charPremium
// This gives a single β that applies across all rarities.
//
// β = Σ (cp - cp̄)(logP - logGeoMean[rarity]) / Σ (cp - cp̄)²
// where cp̄ is the global mean charPremium across all rows.

const meanCP = rows.reduce((s, r) => s + r.charPremium, 0) / rows.length

let num = 0, den = 0
for (const row of rows) {
  if (!geoMeans[row.rarity]) continue
  const y = row.logPrice - Math.log(geoMeans[row.rarity])  // residual after rarity mean
  const x = row.charPremium - meanCP
  num += x * y
  den += x * x
}
const beta = num / den

// ── Step 3: R² of the full model ───────────────────────────────────────────
const yMean = rows.reduce((s, r) => s + r.logPrice, 0) / rows.length
const ssTot = rows.reduce((s, r) => s + (r.logPrice - yMean) ** 2, 0)
const ssRes = rows.reduce((s, r) => {
  if (!geoMeans[r.rarity]) return s
  const yHat = Math.log(geoMeans[r.rarity]) + beta * (r.charPremium - meanCP)
  return s + (r.logPrice - yHat) ** 2
}, 0)
const r2 = 1 - ssRes / ssTot

console.log(`\n── Fitted charPremium coefficient ────────────────────────────`)
console.log(`  β (charPremium effect):  ${beta.toFixed(4)}`)
console.log(`  mean charPremium:        ${meanCP.toFixed(4)}`)
console.log(`  R²:                      ${r2.toFixed(4)}  (${(r2*100).toFixed(1)}% variance explained)`)

// ── Step 4: Example predictions ────────────────────────────────────────────
const RARITY_META = [
  { code:'C',   pullRate:0.55,  name:'Common'       },
  { code:'UC',  pullRate:0.28,  name:'Uncommon'     },
  { code:'R',   pullRate:0.12,  name:'Rare'         },
  { code:'SR',  pullRate:0.04,  name:'Super Rare'   },
  { code:'SCR', pullRate:0.008, name:'Secret Rare'  },
  { code:'SPR', pullRate:0.003, name:'Special Rare' },
  { code:'L',   pullRate:0.04,  name:'Leader'       },
]

const artScoreMid = 6.5

function oldModel(pullRate, googleTrends) {
  const pc  = pullCostOf(pullRate)
  const cp  = charPremiumOf(googleTrends)
  const ua  = googleTrends / 10
  const des = cp * 0.45 + artScoreMid * 0.45 + ua * 0.10
  return Math.exp(0.80 + 0.17 * pc + 0.38 * des)
}

function newModel(rar, googleTrends) {
  if (!geoMeans[rar]) return null
  const cp = charPremiumOf(googleTrends)
  return Math.exp(Math.log(geoMeans[rar]) + beta * (cp - meanCP))
}

console.log('\n── Predicted price: popular character (googleTrends=100) ──────')
console.log('  Rarity           OLD model    NEW model')
console.log('  ─────────────────────────────────────────────')
for (const r of RARITY_META) {
  const oldP = oldModel(r.pullRate, 100)
  const newP = newModel(r.code, 100) ?? 0
  console.log(`  ${(r.code + ' ' + r.name).padEnd(22)} $${oldP.toFixed(2).padStart(8)}   $${newP.toFixed(2).padStart(8)}`)
}

console.log('\n── Predicted price: mid character (googleTrends=50) ────────────')
console.log('  Rarity           OLD model    NEW model')
console.log('  ─────────────────────────────────────────────')
for (const r of RARITY_META) {
  const oldP = oldModel(r.pullRate, 50)
  const newP = newModel(r.code, 50) ?? 0
  console.log(`  ${(r.code + ' ' + r.name).padEnd(22)} $${oldP.toFixed(2).padStart(8)}   $${newP.toFixed(2).padStart(8)}`)
}

console.log('\n── Predicted price: obscure character (googleTrends=10) ────────')
console.log('  Rarity           OLD model    NEW model')
console.log('  ─────────────────────────────────────────────')
for (const r of RARITY_META) {
  const oldP = oldModel(r.pullRate, 10)
  const newP = newModel(r.code, 10) ?? 0
  console.log(`  ${(r.code + ' ' + r.name).padEnd(22)} $${oldP.toFixed(2).padStart(8)}   $${newP.toFixed(2).padStart(8)}`)
}

// ── Step 5: Output replacement code ──────────────────────────────────────
console.log('\n── Replacement constants for src/data.js ───────────────────────')
console.log(`\n// Rarity base prices — geometric means from ${rows.length} real market prices`)
console.log('const RARITY_BASE_PRICE = {')
for (const rar of RARITY_ORDER) {
  const gm = geoMeans[rar]
  if (gm != null)
    console.log(`  ${rar.padEnd(3)}: ${gm.toFixed(4)},   // geometric mean from real data`)
}
console.log('}')
console.log(`const CHAR_PREMIUM_BETA = ${beta.toFixed(4)}  // within-rarity charPremium effect`)
console.log(`const MEAN_CHAR_PREMIUM = ${meanCP.toFixed(4)}  // global mean charPremium`)
console.log(`
// Replace predictedPrice line in data.js with:
const rarityBase     = RARITY_BASE_PRICE[raw.rarity] ?? RARITY_BASE_PRICE['C']
const predictedPrice = rarityBase * Math.exp(CHAR_PREMIUM_BETA * (charPremium - MEAN_CHAR_PREMIUM))
`)
