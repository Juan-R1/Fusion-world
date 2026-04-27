import RAW      from './cardData.json'     assert { type: 'json' }
import LIVE_RAW from './livePrices.json'   assert { type: 'json' }

// priceHistory.json is no longer imported here — JustTCG now serves 30d history
// natively (see scripts/update-prices.js). The accumulator pipeline still
// writes priceHistory.json on every weekly run; it is kept as a possible
// long-term archive layer and will be reconsidered after JustTCG history is
// stable for several cycles. See CLAUDE.md §10 P2 for cleanup status.

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

// ── Live price map ───────────────────────────────────────────────────────────
// LIVE_RAW: [{cardCode, marketPrice, timestamp, history: [{p, t}]}]
// LIVE_MAP keys by cardCode → full entry so we can read both price and history.
const LIVE_MAP = new Map(LIVE_RAW.map(e => [e.cardCode, e]))

export const HAS_LIVE_PRICES = LIVE_MAP.size > 0

// ── Calibrated rarity base prices (geometric means from 1,156 real prices) ──
// SPR extrapolated via log-linear pull-rate trend (no SPR price data available).
// UC smoothed upward from noisy 27-card sample to enforce C < UC < R ordering.
const RARITY_BASE_PRICE = {
  L:   0.2304,
  C:   0.1598,
  UC:  0.2000,   // smoothed (27-card sample was below C; enforced C < UC < R)
  R:   0.2440,
  SR:  1.1144,
  SCR: 12.9869,
  SPR: 24.99,    // extrapolated via log-linear pull-rate trend
}
const CHAR_PREMIUM_BETA = 0.0803   // within-rarity charPremium effect (OLS, R²=0.32)
const MEAN_CHAR_PREMIUM = 5.9386   // global mean charPremium across 1,156 priced cards

// ── Helpers ───────────────────────────────────────────────────────────────────

// Seeded PRNG (mulberry32) — reproducible, no external deps. Used for non-price
// synthetic fields (artScore, totalSupply, absorbed, supplySaturation) which are
// internal mechanics, not visualized as time series.
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

// History state classification — the contract the UI reads off each card.
// Keep these strings stable; CardDetail and Sparkline branch on them.
//   'real'    >= 7 valid points  → render real sparkline + "30d JustTCG history"
//   'limited' 1–6 valid points   → render observed points + "Limited history (N points)"
//   'none'    0 points            → render placeholder + "Not enough JustTCG history"
function historyStateOf(points) {
  if (points >= 7) return 'real'
  if (points >= 1) return 'limited'
  return 'none'
}

// Normalize a JustTCG {p, t} history array into UI-friendly {price, ts}, sorted
// oldest → newest, dropping any malformed points.
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(h =>
      typeof h?.p === 'number' && Number.isFinite(h.p) && h.p > 0 &&
      typeof h?.t === 'number' && Number.isFinite(h.t) && h.t > 0
    )
    .map(h => ({ price: h.p, ts: h.t }))
    .sort((a, b) => a.ts - b.ts)
}

// ── Apply analytics model to each real card ───────────────────────────────────
export const CARDS = RAW.map((raw, idx) => {
  const rng = mkRng(idx * 7919 + 42)

  const pullCost        = pullCostOf(raw.pullRate)
  const charPremium     = charPremiumOf(raw.googleTrends)
  const artScore        = 3 + rng() * 7           // rng #1: 3–10
  const universalAppeal = raw.googleTrends / 10
  const desirability    = charPremium * 0.45 + artScore * 0.45 + universalAppeal * 0.10

  const rarityBase      = RARITY_BASE_PRICE[raw.rarity] ?? RARITY_BASE_PRICE['C']
  const predictedPrice  = rarityBase * Math.exp(CHAR_PREMIUM_BETA * (charPremium - MEAN_CHAR_PREMIUM))

  // Live data wins. For estimated cards (no live price), the model price is the
  // best honest estimate — no RNG noise. delta is therefore 0 for estimated.
  const liveEntry  = LIVE_MAP.get(raw.code) ?? null
  const livePrice  = liveEntry?.marketPrice ?? null
  const marketPrice = livePrice ?? predictedPrice
  const delta      = ((marketPrice - predictedPrice) / predictedPrice) * 100

  const totalSupply      = Math.floor(100 + rng() * 1400)                  // rng #2
  const absorbed         = Math.floor(totalSupply * (0.15 + rng() * 0.80)) // rng #3
  const demandPressure   = absorbed / totalSupply
  const supplySaturation = 0.4 + rng() * 1.7                               // rng #4

  // Real history pulled from JustTCG. May be empty for cards JustTCG hasn't
  // sampled yet (currently rare — 1156/1156 priced cards have history as of
  // 2026-04-25, but the UI must handle the 0-point case anyway).
  const priceHistory = normalizeHistory(liveEntry?.history)
  const historyState = historyStateOf(priceHistory.length)

  // Trust labels surfaced to the UI:
  //   priceStatus: 'live' (real market price) | 'estimated' (model fallback)
  //   confidence:  'high' (live + ≥7 history) | 'medium' (live, <7 history) | 'low' (estimated)
  const priceStatus = livePrice !== null ? 'live' : 'estimated'
  const confidence  = priceStatus === 'live'
    ? (historyState === 'real' ? 'high' : 'medium')
    : 'low'

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
    priceStatus,           // 'live' | 'estimated'
    historyState,          // 'real' | 'limited' | 'none'
    confidence,            // 'high' | 'medium' | 'low'
    hasLivePrice:    livePrice !== null,  // legacy alias used by Watchlist/BoxEV/ValueScanner LIVE chip
    priceHistory,          // [{price, ts}] sorted oldest→newest, may be empty
  }
})
