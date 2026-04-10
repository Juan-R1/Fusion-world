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
  { code: 'C',   name: 'Common',       pullRate: 0.55,  color: '#6b7280' },
  { code: 'UC',  name: 'Uncommon',     pullRate: 0.28,  color: '#3b82f6' },
  { code: 'R',   name: 'Rare',         pullRate: 0.12,  color: '#a855f7' },
  { code: 'SR',  name: 'Super Rare',   pullRate: 0.04,  color: '#f59e0b' },
  { code: 'SCR', name: 'Secret Rare',  pullRate: 0.008, color: '#f97316' },
  { code: 'SPR', name: 'Special Rare', pullRate: 0.003, color: '#dc2626' },
]

// ── Characters ───────────────────────────────────────────────────────────────
// avgRank: lower = more desirable in the TCG meta (1 = most desirable)
// googleTrends: 0–100 public interest score
export const CHARACTERS = [
  { name: 'Goku',       icon: '🔥', avgRank: 1,  googleTrends: 100 },
  { name: 'Gogeta',     icon: '🌟', avgRank: 2,  googleTrends: 92  },
  { name: 'Vegeta',     icon: '⚡', avgRank: 3,  googleTrends: 85  },
  { name: 'Vegito',     icon: '💫', avgRank: 4,  googleTrends: 87  },
  { name: 'Broly',      icon: '💪', avgRank: 5,  googleTrends: 90  },
  { name: 'Goku Black', icon: '⚫', avgRank: 6,  googleTrends: 88  },
  { name: 'Frieza',     icon: '❄️', avgRank: 7,  googleTrends: 80  },
  { name: 'Beerus',     icon: '👁️', avgRank: 8,  googleTrends: 72  },
  { name: 'Jiren',      icon: '🔴', avgRank: 9,  googleTrends: 68  },
  { name: 'Gohan',      icon: '🟡', avgRank: 10, googleTrends: 70  },
  { name: 'Cell',       icon: '🧬', avgRank: 11, googleTrends: 65  },
  { name: 'Trunks',     icon: '⚔️', avgRank: 12, googleTrends: 62  },
  { name: 'Hit',        icon: '🔷', avgRank: 13, googleTrends: 58  },
  { name: 'Android 18', icon: '🤖', avgRank: 14, googleTrends: 60  },
  { name: 'Piccolo',    icon: '💚', avgRank: 15, googleTrends: 55  },
  { name: 'Whis',       icon: '🪄', avgRank: 16, googleTrends: 50  },
  { name: 'Kefla',      icon: '🌀', avgRank: 17, googleTrends: 62  },
  { name: 'Cabba',      icon: '🔵', avgRank: 18, googleTrends: 40  },
  { name: 'Goten',      icon: '👦', avgRank: 19, googleTrends: 45  },
  { name: 'Pan',        icon: '🌸', avgRank: 20, googleTrends: 42  },
]

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
const pullCostOf = r =>
  ((Math.log(1 / r.pullRate) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 9 + 1

// Character premium: rank 1 → 10, rank 20 → 1
const charPremiumOf = c => ((20 - c.avgRank) / 19) * 9 + 1

function makeSparkline(rng, base, n, vol) {
  const d = [base]
  for (let i = 1; i < n; i++)
    d.push(Math.max(0.001, d[i - 1] * (1 + (rng() - 0.5) * 2 * vol)))
  return d
}

// ── Card generation ───────────────────────────────────────────────────────────
// FB01–FB05 (larger sets ~140–164): 15 cards each
// FB06–FB09 (streamlined ~123–125): 13 cards each (no SPR)
const DIST_LARGE = [['C',4],['UC',3],['R',3],['SR',2],['SCR',2],['SPR',1]]
const DIST_SMALL = [['C',4],['UC',3],['R',3],['SR',2],['SCR',1],['SPR',0]]

// Per-set art pools — each set has its own theme vocabulary.
// Sized to cover max cards per set (15 for large, 13 for small) with no repeats.
const SET_ARTS = {
  FB01: ['Awakened Pulse','Rising Surge','First Ascension','Primal Force','Dormant Power',
         'Awakened Soul','Emergence','Kindled Flame','Origin Strike','Unbound Will',
         'Breaking Limits','Initial Impact','Force Unleashed','Dawn of Power','Opening Gambit'],
  FB02: ['Blazing Strike','Infernal Rush','Scorched Earth','Searing Edge','Molten Core',
         'Firestorm','Burning Soul','Ignition Point','Heat Wave','Combustion',
         'Ember Rage','Solar Flare','Conflagration','Wildfire','Blaze of Glory'],
  FB03: ['Roaring Tide','Savage Howl','Beast Instinct','Primal Roar','Feral Rush',
         'War Cry','Battle Hunger','Apex Fury','Predator\'s Edge','Unleashed Rage',
         'Berserker Mode','Fang & Claw','Thunderous Charge','Primal Surge','Raging Tempest'],
  FB04: ['Limit Exceeded','Beyond Bounds','Peak Performance','Ultimate Form','Transcendence',
         'Breaking Point','Maximum Output','Extreme Force','Overdrive','Full Throttle',
         'Critical Strike','Zenith Form','Absolute Limit','Final Push','Ultra Mode'],
  FB05: ['New Horizon','Uncharted Path','Fresh Chapter','Unexplored Depths','Reborn Warrior',
         'Second Wind','Rising Star','Rebirth','Genesis Form','New Dawn',
         'Evolution Begins','Renewed Strength','New Era','Infinite Potential','Boundless Future'],
  FB06: ['Rival\'s Challenge','Clash of Titans','Face-Off','Worthy Opponent','Battle of Equals',
         'Supreme Duel','Head-to-Head','Mutual Respect','Power Struggle','Contest of Wills',
         'Epic Showdown','Final Clash','Rivals Unite'],
  FB07: ['Dragon\'s Wish','Eternal Desire','Wish Granted','Divine Request','Sacred Dragon',
         'Shenron Calls','Granted Power','Dragon Blessing','Ultimate Wish','Dragon Awakens',
         'Stars Align','Dragon Summon','Miracle Granted'],
  FB08: ['Saiyan Heritage','Blood of Warriors','Saiyan Pride','Warrior\'s Honor','Battle-Born',
         'Saiyan Resolve','Iron Will','Heritage of Battle','Born Fighter','Warrior Blood',
         'Saiyan Might','Elite Warrior','Battle Legacy'],
  FB09: ['Fusion Evolution','Fused Strength','Perfect Union','Dual Nature','Combined Power',
         'Evolving Bond','Unified Form','Evolved State','Composite Power','Dual Strike',
         'Fusion Mastery','Evolution Complete','Fused Destiny'],
}

export const CARDS = (() => {
  const out = []
  let gid = 0
  SETS.forEach((set, si) => {
    const dist    = si < 5 ? DIST_LARGE : DIST_SMALL
    const setArts = SET_ARTS[set.code]
    let cardN  = 1
    let artIdx = 0   // sequential within each set — guarantees unique art per card
    dist.forEach(([code, count], ri) => {
      if (count === 0) return
      const rar = RARITIES.find(r => r.code === code)
      for (let i = 0; i < count; i++) {
        const rng  = mkRng(si * 9999 + ri * 999 + i * 13 + 42)
        const char = CHARACTERS[(si * 5 + ri * count + i) % CHARACTERS.length]
        const art  = setArts[artIdx++ % setArts.length]

        const pullCost        = pullCostOf(rar)
        const charPremium     = charPremiumOf(char)
        const artScore        = 3 + rng() * 7          // 3–10
        const universalAppeal = char.googleTrends / 10  // 0–10
        const desirability    = charPremium * 0.45 + artScore * 0.45 + universalAppeal * 0.10

        const predictedPrice = Math.exp(0.80 + 0.17 * pullCost + 0.38 * desirability)
        const marketPrice    = predictedPrice * (0.7 + rng() * 0.6)
        const delta          = ((marketPrice - predictedPrice) / predictedPrice) * 100

        const totalSupply      = Math.floor(100 + rng() * 1400)
        const absorbed         = Math.floor(totalSupply * (0.15 + rng() * 0.80))
        const demandPressure   = absorbed / totalSupply
        const supplySaturation = 0.4 + rng() * 1.7

        out.push({
          id:              gid++,
          set:             set.code,
          setName:         set.name,
          rarity:          code,
          rarityName:      rar.name,
          rarityColor:     rar.color,
          character:       char.name,
          icon:            char.icon,
          name:            `${char.name} — ${art}`,
          cardCode:        `${set.code}-${String(cardN++).padStart(3, '0')}`,
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
          priceHistory:  makeSparkline(rng, marketPrice,    30, 0.06),
          demandHistory: makeSparkline(rng, demandPressure, 30, 0.05),
        })
      }
    })
  })
  return out
})()
