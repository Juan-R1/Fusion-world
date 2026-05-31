// src/lib/setAggregates.js
//
// Pure aggregation functions for the Set Rankings and Chase Radar
// surfaces (P3-010). Every output is derived ONLY from the CARDS array
// that data.js already exports — no new data sources, no synthetic
// values, no demand/supply heuristics (those are eBay-gated; see
// docs/restoration-prompts-prestage.md).
//
// Honesty rails enforced here:
//   - Aggregates over PRICE use live-priced cards only. Estimated
//     cards (priceStatus === 'estimated', delta === 0 by D-008) are
//     excluded from value/median/delta aggregates per D-009.
//   - Coverage ratio = live-priced / total-in-set, the honest
//     runtime-available metric (we don't carry prior-run counts in
//     the bundle).
//   - Chase Radar ranks by observed delta only; live-priced only.
//
// All functions are pure and dependency-free for easy unit testing.

const isLive = c => c.priceStatus === 'live'

export function median(nums) {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// Coverage-status chip per spec § 5. Ratio is live-priced / total.
export function coverageStatus(liveCount, totalCount) {
  if (totalCount === 0) return { tier: 'red', label: 'No cards' }
  const ratio = liveCount / totalCount
  if (ratio >= 0.95) return { tier: 'green', label: 'On track' }
  if (ratio >= 0.90) return { tier: 'yellow', label: 'Partial' }
  return { tier: 'red', label: 'Degraded' }
}

// Days since the oldest included live-price timestamp. Returns null if
// no live card carries a timestamp. "Oldest" so a single stale card
// drags the visible freshness down honestly (spec § 6).
export function oldestFreshnessDays(cards, now = Date.now()) {
  const ts = cards
    .filter(isLive)
    .map(c => (c.priceTimestamp ? Date.parse(c.priceTimestamp) : NaN))
    .filter(Number.isFinite)
  if (!ts.length) return null
  const oldest = Math.min(...ts)
  return Math.floor((now - oldest) / 86_400_000)
}

// One row per set. Price aggregates use live cards only.
export function computeSetAggregates(cards, now = Date.now()) {
  const bySet = new Map()
  for (const c of cards) {
    if (!bySet.has(c.set)) bySet.set(c.set, [])
    bySet.get(c.set).push(c)
  }

  const rows = []
  for (const [set, group] of bySet) {
    const live = group.filter(isLive)
    const liveCount = live.length
    const totalCount = group.length
    const livePrices = live.map(c => c.marketPrice)
    const aggregateLiveValue = livePrices.reduce((s, p) => s + p, 0)
    const medianLivePrice = median(livePrices)
    const avgDelta = liveCount
      ? live.reduce((s, c) => s + c.delta, 0) / liveCount
      : 0
    const topCard = live.length
      ? live.reduce((top, c) => (c.marketPrice > top.marketPrice ? c : top))
      : null

    rows.push({
      set,
      setName: group[0].setName,
      totalCount,
      liveCount,
      coverageRatio: totalCount ? liveCount / totalCount : 0,
      coverage: coverageStatus(liveCount, totalCount),
      aggregateLiveValue: +aggregateLiveValue.toFixed(2),
      medianLivePrice: +medianLivePrice.toFixed(2),
      avgDelta: +avgDelta.toFixed(1),
      freshnessDays: oldestFreshnessDays(group, now),
      topCard: topCard
        ? { name: topCard.name, cardCode: topCard.cardCode, rarity: topCard.rarity, marketPrice: topCard.marketPrice }
        : null,
    })
  }

  // Default sort: highest aggregate live value first.
  return rows.sort((a, b) => b.aggregateLiveValue - a.aggregateLiveValue)
}

export const CHASE_SORTS = {
  'delta-undervalued': (a, b) => a.delta - b.delta,        // most negative first
  'delta-overvalued':  (a, b) => b.delta - a.delta,        // most positive first
  'recently-refreshed':(a, b) => parseTs(b) - parseTs(a),  // newest first
  'largest-market':    (a, b) => b.marketPrice - a.marketPrice,
}

function parseTs(c) {
  const t = c.priceTimestamp ? Date.parse(c.priceTimestamp) : NaN
  return Number.isFinite(t) ? t : 0
}

// Top-N cards by the chosen sort. Live-priced only — estimated cards
// have delta === 0 and no real signal (D-009).
export function computeChaseRadar(cards, { sort = 'delta-undervalued', limit = 20, sets = null, rarities = null } = {}) {
  let pool = cards.filter(isLive)
  if (sets && sets.length) pool = pool.filter(c => sets.includes(c.set))
  if (rarities && rarities.length) pool = pool.filter(c => rarities.includes(c.rarity))
  const cmp = CHASE_SORTS[sort] || CHASE_SORTS['delta-undervalued']
  return [...pool].sort(cmp).slice(0, limit)
}
