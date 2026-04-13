#!/usr/bin/env node
/**
 * scripts/merge-known-cards.js
 * Merges per-set scraped JSON files (scripts/official-card-db/{SET}.json)
 * into scripts/known-cards.json. Only adds cards whose code is not already
 * present — existing manual verifications are never overwritten.
 *
 * Run AFTER scrape-official-fw.js, BEFORE fetch-cards.js.
 * Usage: node scripts/merge-known-cards.js
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SCRAPED_DIR  = path.join(__dirname, 'official-card-db')
const KNOWN_PATH   = path.join(__dirname, 'known-cards.json')

// Load existing known cards → Map keyed by code for fast lookup
const known    = JSON.parse(fs.readFileSync(KNOWN_PATH, 'utf8'))
const knownMap = new Map(known.map(c => [c.code, c]))
const before   = knownMap.size

// Collect all scraped per-set files
let scrapedFiles
try {
  scrapedFiles = fs.readdirSync(SCRAPED_DIR).filter(f => f.endsWith('.json'))
} catch {
  console.error(`ERROR: ${SCRAPED_DIR} not found. Run scrape-official-fw.js first.`)
  process.exit(1)
}

if (!scrapedFiles.length) {
  console.log('No scraped files found in official-card-db/ — nothing to merge')
  process.exit(0)
}

let added = 0
let skipped = 0

for (const file of scrapedFiles.sort()) {
  const setPath = path.join(SCRAPED_DIR, file)
  const cards   = JSON.parse(fs.readFileSync(setPath, 'utf8'))

  for (const card of cards) {
    if (!card.code) continue
    if (knownMap.has(card.code)) {
      skipped++
      continue
    }
    // Normalize: ensure all required fields are present
    knownMap.set(card.code, {
      code:      card.code,
      name:      card.name      ?? card.code,
      character: card.character ?? null,
      rarity:    card.rarity    ?? 'C',
      color:     card.color     ?? 'Red',
      type:      card.type      ?? 'Battle',
      trait:     card.trait     ?? null,
    })
    added++
  }
}

// Sort by set then by card number
const merged = [...knownMap.values()].sort((a, b) => {
  const [aSet, aNum] = a.code.split('-')
  const [bSet, bNum] = b.code.split('-')
  return aSet !== bSet
    ? aSet.localeCompare(bSet)
    : parseInt(aNum, 10) - parseInt(bNum, 10)
})

fs.writeFileSync(KNOWN_PATH, JSON.stringify(merged, null, 2))
console.log(`Merge complete:`)
console.log(`  Before: ${before} entries`)
console.log(`  Added:  ${added} new entries`)
console.log(`  Kept:   ${skipped} existing entries unchanged`)
console.log(`  After:  ${merged.length} total entries → ${KNOWN_PATH}`)
