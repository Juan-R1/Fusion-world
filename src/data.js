import RAW      from './cardData.json'     assert { type: 'json' }
import LIVE_RAW from './livePrices.json'   assert { type: 'json' }
import HIST_RAW from './priceHistory.json' assert { type: 'json' }

// ── Sets (FB01–FB09) ─────────────────────────────────────────────────────────
export const SETS = [
  { code: 'FB01', name: 'Awakened Pulse',   cards: 140, released: '2024-02-16' },
  { code: 'FB02', name: 'Blazing Aura',     cards: 140, released: '2024-05-10' },
  { code: 'FB03', name: 'Raging Roar',      cards: 164, released: '2024-08-09' },
  { code: 'FB04', name: 'Ultra Limit',      cards: 159, released: '2024-11-08' },
  { code: 'FB05', name: 'New Adventure',    cards: 159, released: '2025-02-08' },
  { code: 'FB06', name: 'Rivals Clash',     cards: 123, released: '2025-04-26' },
  { code: 'FB07', name: 'Wish for Shenron', cards: 125, released: '2025-09-19' },
  { code: 'FB08', name: "Saiyan's Pride",   cards: 125, released: '2025-12-12' },
  { code: 'FB09', name: 'Dual Evolution',   cards: 123, released: '2026-03-13' },
]

// ── Rarities ─────────────────────────────────────────────────────────────────
export const RARITIES = [
  { code: 'L',   name: 'Leader',        pullRate: 0.04,  color: '#10b981' },
  { code: 'C',   name: 'Common',        pullRate: 0.55,  color: '#6b7280' },
  { code: 'UC',  name: 'Uncommon',      pullRate: 0.28,  color: '#3b82f6' },
  { code: 'R',   name: 'Rare',          pullRate: 0.12,  color: '#a855f7' },
  { code: 'SR',  name: 'Super Rare',    pullRate: 0.04,  color: '#f59e0b' },
  { code: 'SCR', name: 'Secret Rare',   pullRate: 0.008, color: '#f97316' },
  { code: 'SPR', name: 'Special Rare',  pullRate: 0.003, color: '#dc2626' },
]

// ── Live price maps ───────────────────────────────────────────────────────────
// LIVE_RAW: [{cardCode, marketPrice, timestamp}]
// HIST_RAW: {[cardCode]: [{price, timestamp}]}
const LIVE_MAP = new Map(LIVE_RAW.map(e => [e.cardCode, e.marketPrice]))
const HIST_MAP = HIST_RAW

export const HAS_LIVE_PRICES = LIVE_MAP.size > 0

// ── Helpers ───────────────────────────────────────────────────────────────────

// Seeded PRNG (mulberry32) — reproducible, no external deps
function mkRng(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LOG_MIN = Math.log(1 / 0.55)   // log(packs for Common)
const LOG_MAX = Math.log(1 / 0.003)  // log(packs for SPR)

// Pull cost: log-normalized to 1–10 (higher = rarer = harder to pull)
const pullCostOf = pullRate =>
  ((Math.log(1 / pullRate) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 9 + 1

// Character premium: googleTrends 100 → 10, 0 → 1
const charPremiumOf = googleTrends => Math.max(1, Math.min(10, (googleTrends / 100) * 9 + 1))

function makeSparkline(rng, base, n, vol) {
  const d = [base]
  for (let i = 1; i < n; i++)
    d.push(Math.max(0.001, d[i - 1] * (1 + (rng() - 0.5) * 2 * vol)))
  return d
}

// ── Apply analytics model to each real card ───────────────────────────────────
export const CARDS = RAW.map((raw, idx) => {
  const rng = mkRng(idx * 7919 + 42)

  const pullCost        = pullCostOf(raw.pullRate)
  const charPremium     = charPremiumOf(raw.googleTrends)
  const artScore        = 3 + rng() * 7           // rng #1: 3–10
  const universalAppeal = raw.googleTrends / 10
  const desirability    = charPremium * 0.45 + artScore * 0.45 + universalAppeal * 0.10

  const predictedPrice  = Math.exp(0.80 + 0.17 * pullCost + 0.38 * desirability)

  // rng #2: ALWAYS consumed regardless of live data — preserves RNG stability
  // for all downstream calls (totalSupply, absorbed, supplySaturation, sparklines)
  const syntheticNoise  = 0.7 + rng() * 0.6
  const syntheticPrice  = predictedPrice * syntheticNoise

  const livePrice       = LIVE_MAP.get(raw.code) ?? null
  const marketPrice     = livePrice ?? syntheticPrice
  const delta           = ((marketPrice - predictedPrice) / predictedPrice) * 100

  const totalSupply     = Math.floor(100 + rng() * 1400)          // rng #3
  const absorbed        = Math.floor(totalSupply * (0.15 + rng() * 0.80)) // rng #4
  const demandPressure  = absorbed / totalSupply
  const supplySaturation = 0.4 + rng() * 1.7                      // rng #5

  // rng #6–34: always generated — do NOT skip even when live price exists
  const syntheticPriceHistory = makeSparkline(rng, syntheticPrice, 30, 0.06)

  // Graft real historical prices onto the tail of the synthetic sparkline
  const realPrices = (HIST_MAP[raw.code] ?? []).map(e => e.price)
  const priceHistory = realPrices.length > 0
    ? [...syntheticPriceHistory.slice(0, 30 - realPrices.length), ...realPrices]
    : syntheticPriceHistory

  // rng #35–63: always generated
  const demandHistory = makeSparkline(rng, demandPressure, 30, 0.05)

  return {
    id:              idx,
    set:             raw.set,
    setName:         raw.setName,
    rarity:          raw.rarity,
    rarityName:      raw.rarityName,
    rarityColor:     raw.rarityColor,
    character:       raw.character,
    icon:            raw.icon,
    name:            raw.name,
    cardCode:        raw.code,
    image:           raw.image,
    cardColor:       raw.cardColor,
    cardType:        raw.cardType,
    trait:           raw.trait   ?? null,
    verified:        raw.verified ?? false,
    pullCost:        +pullCost.toFixed(2),
    charPremium:     +charPremium.toFixed(2),
    artScore:        +artScore.toFixed(2),
    universalAppeal: +universalAppeal.toFixed(2),
    desirability:    +desirability.toFixed(2),
    predictedPrice:  +predictedPrice.toFixed(2),
    marketPrice:     +marketPrice.toFixed(2),
    delta:           +delta.toFixed(1),
    totalSupply,
    absorbed,
    demandPressure:    +demandPressure.toFixed(3),
    supplySaturation:  +supplySaturation.toFixed(3),
    hasLivePrice:    livePrice !== null,
    priceHistory,
    demandHistory,
  }
})
