#!/usr/bin/env node
/**
 * scripts/fetch-cards.js
 * Generates src/cardData.json — base card metadata for all 9 DBFW sets.
 * Image URLs reference HighDefined/TCG-Arena-DBSFW (99 confirmed PNGs).
 * Run with: node scripts/fetch-cards.js
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IMG_BASE = 'https://raw.githubusercontent.com/HighDefined/TCG-Arena-DBSFW/main'

// ── Confirmed image codes from HighDefined/TCG-Arena-DBSFW ───────────────────
function buildImageCodes() {
  const s = new Set()
  const add = (set, n) => s.add(`${set}-${String(n).padStart(3, '0')}`)

  // FB01: 003, 004, 006-034, 139
  add('FB01', 3); add('FB01', 4)
  for (let n = 6;  n <= 34;  n++) add('FB01', n)
  add('FB01', 139)

  // FB02: 002-030, 032-035
  for (let n = 2;  n <= 30;  n++) add('FB02', n)
  for (let n = 32; n <= 35;  n++) add('FB02', n)

  // FB03: 002-026
  for (let n = 2;  n <= 26;  n++) add('FB03', n)

  // FB04: 002-010
  for (let n = 2;  n <= 10;  n++) add('FB04', n)

  return s
}

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
function mkRng(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Set definitions ───────────────────────────────────────────────────────────
const SETS = [
  { code: 'FB01', name: 'Awakened Pulse',   total: 140, spr: 1 },
  { code: 'FB02', name: 'Blazing Aura',     total: 140, spr: 1 },
  { code: 'FB03', name: 'Raging Roar',      total: 164, spr: 2 },
  { code: 'FB04', name: 'Ultra Limit',      total: 159, spr: 2 },
  { code: 'FB05', name: 'New Adventure',    total: 159, spr: 1 },
  { code: 'FB06', name: 'Rivals Clash',     total: 123, spr: 0 },
  { code: 'FB07', name: 'Wish for Shenron', total: 125, spr: 0 },
  { code: 'FB08', name: "Saiyan's Pride",   total: 125, spr: 0 },
  { code: 'FB09', name: 'Dual Evolution',   total: 123, spr: 0 },
]

// ── Rarities ──────────────────────────────────────────────────────────────────
const RARITIES = {
  C:   { name: 'Common',       pullRate: 0.55,  color: '#6b7280' },
  UC:  { name: 'Uncommon',     pullRate: 0.28,  color: '#3b82f6' },
  R:   { name: 'Rare',         pullRate: 0.12,  color: '#a855f7' },
  SR:  { name: 'Super Rare',   pullRate: 0.04,  color: '#f59e0b' },
  SCR: { name: 'Secret Rare',  pullRate: 0.008, color: '#f97316' },
  SPR: { name: 'Special Rare', pullRate: 0.003, color: '#dc2626' },
}

// ── Characters ────────────────────────────────────────────────────────────────
// tier 1 = chases (SPR/SCR), tier 4 = commons
const CHARS = [
  { name: 'Goku',       icon: '🔥', tier: 1, avgRank: 1,  googleTrends: 100 },
  { name: 'Gogeta',     icon: '🌟', tier: 1, avgRank: 2,  googleTrends: 92  },
  { name: 'Vegeta',     icon: '⚡', tier: 1, avgRank: 3,  googleTrends: 85  },
  { name: 'Broly',      icon: '💪', tier: 1, avgRank: 5,  googleTrends: 90  },
  { name: 'Vegito',     icon: '💫', tier: 2, avgRank: 4,  googleTrends: 87  },
  { name: 'Goku Black', icon: '⚫', tier: 2, avgRank: 6,  googleTrends: 88  },
  { name: 'Frieza',     icon: '❄️', tier: 2, avgRank: 7,  googleTrends: 80  },
  { name: 'Beerus',     icon: '👁️', tier: 2, avgRank: 8,  googleTrends: 72  },
  { name: 'Jiren',      icon: '🔴', tier: 2, avgRank: 9,  googleTrends: 68  },
  { name: 'Gohan',      icon: '🟡', tier: 2, avgRank: 10, googleTrends: 70  },
  { name: 'Cell',       icon: '🧬', tier: 3, avgRank: 11, googleTrends: 65  },
  { name: 'Trunks',     icon: '⚔️', tier: 3, avgRank: 12, googleTrends: 62  },
  { name: 'Hit',        icon: '🔷', tier: 3, avgRank: 13, googleTrends: 58  },
  { name: 'Android 18', icon: '🤖', tier: 3, avgRank: 14, googleTrends: 60  },
  { name: 'Piccolo',    icon: '💚', tier: 3, avgRank: 15, googleTrends: 55  },
  { name: 'Whis',       icon: '🪄', tier: 3, avgRank: 16, googleTrends: 50  },
  { name: 'Kefla',      icon: '🌀', tier: 3, avgRank: 17, googleTrends: 62  },
  { name: 'Cabba',      icon: '🔵', tier: 4, avgRank: 18, googleTrends: 40  },
  { name: 'Goten',      icon: '👦', tier: 4, avgRank: 19, googleTrends: 45  },
  { name: 'Pan',        icon: '🌸', tier: 4, avgRank: 20, googleTrends: 42  },
]

// ── Per-set art theme pools ───────────────────────────────────────────────────
const SET_ARTS = {
  FB01: [
    'Awakened Pulse','Rising Surge','First Ascension','Primal Force','Dormant Power',
    'Awakened Soul','Emergence','Kindled Flame','Origin Strike','Unbound Will',
    'Breaking Limits','Initial Impact','Force Unleashed','Dawn of Power','Opening Gambit',
    'Primal Awakening','Inner Fire','First Steps','Surge of Power','Limitless Potential',
    'Core Instinct','Rising Phoenix','Base Pressure','Fundamental Drive','Primal Energy',
    'Spark of Battle','Latent Strength','Pressure Point','Controlled Fury','Awakened Might',
    'Ignited Will','Pulse of Power','Stirring Soul','Edge of Potential','First Light',
    'Crackling Aura','Wild Intent','Sharpened Edge','Gathering Storm','Uncharted Power',
    'Focused Rage','Warrior Born','Raw Potential','Burning Resolve','Quiet Fury',
  ],
  FB02: [
    'Blazing Strike','Infernal Rush','Scorched Earth','Searing Edge','Molten Core',
    'Firestorm','Burning Soul','Ignition Point','Heat Wave','Combustion',
    'Ember Rage','Solar Flare','Conflagration','Wildfire','Blaze of Glory',
    'Lava Surge','Inferno Drive','Cinder Force','Phoenix Burst','Thermal Blast',
    'Flame Veil','Incendiary Charge','Scorching Fist','Blazing Trail','Fire Storm',
    'Searing Aura','Volcanic Intent','White Hot','Burning Rush','Flare Kick',
    'Fire Wall','Blaze Dash','Sear and Sunder','Cataclysm','Eruption',
    'Heatstroke','Magma Fist','Ignited Path','Flash Burn','Afterburn',
    'Pyre Surge','Scalded Earth','Burning Vortex','Scorched Soul','Ember Wake',
  ],
  FB03: [
    'Roaring Tide','Savage Howl','Beast Instinct','Primal Roar','Feral Rush',
    'War Cry','Battle Hunger','Apex Fury','Predator\'s Edge','Unleashed Rage',
    'Berserker Mode','Fang and Claw','Thunderous Charge','Primal Surge','Raging Tempest',
    'Wild Assault','Beast Rush','Howling Strike','Savage Surge','Primal Stampede',
    'Feral Instinct','Ferocious Blow','Untamed Force','Primal Fury','Berserk Drive',
    'Savage Rhythm','Bloodlust','Rampant Power','Untethered Rage','Pack Mentality',
    'Iron Jaw','Predator Pounce','Apex Predator','Thunderclap','Tidal Rage',
    'Primitive Force','Roaring Power','Feral Tempest','Savage Rush','Bestial Fury',
    'Primal Roar II','Howl of Battle','Rampage Mode','Stampede','War Hunger',
    'Combat Frenzy','Battle Howl','Primal Torrent','Raw Fury','Surge and Smash',
  ],
  FB04: [
    'Limit Exceeded','Beyond Bounds','Peak Performance','Ultimate Form','Transcendence',
    'Breaking Point','Maximum Output','Extreme Force','Overdrive','Full Throttle',
    'Critical Strike','Zenith Form','Absolute Limit','Final Push','Ultra Mode',
    'Pinnacle Power','Overclocked','Supreme Force','Maximum Reach','Terminal Velocity',
    'Limit Shattering','Apex Drive','Overdrive II','Surpassing All','Boundless',
    'Exceed the Max','Critical Mass','Push the Limits','Final Form','All In',
    'No Holding Back','Infinite Ceiling','Redline','Power Ceiling','At the Limit',
    'One Step Beyond','Threshold Broken','Over the Edge','Maximum Potential','Absolute Peak',
    'Beyond All Limits','Limitless Ascent','Red Zone','Full Release','Ultimate Ceiling',
    'Ascendant Drive','Maximum Evolution','Last Barrier','Limitless','Pure Force',
  ],
  FB05: [
    'New Horizon','Uncharted Path','Fresh Chapter','Unexplored Depths','Reborn Warrior',
    'Second Wind','Rising Star','Rebirth','Genesis Form','New Dawn',
    'Evolution Begins','Renewed Strength','New Era','Infinite Potential','Boundless Future',
    'New Beginning','Fresh Start','First Day','Renewed Purpose','Blank Slate',
    'Clean Break','New Chapter','Untested Path','Beginning Again','Rebirth Drive',
    'Second Chance','Next Step','Opening Move','Forward March','New Road',
    'Blank Canvas','New Journey','Renewed Oath','Fresh Awakening','New Resolve',
    'Reborn Strength','Horizon Ahead','New Path','Second Sunrise','Evolution Drive',
    'First Breath','New Force','Rising Tide','Fresh Surge','New Potential',
    'Dawn Drive','New Strength','New Intent','Reborn Power','New Apex',
  ],
  FB06: [
    'Rival\'s Challenge','Clash of Titans','Face-Off','Worthy Opponent','Battle of Equals',
    'Supreme Duel','Head-to-Head','Mutual Respect','Power Struggle','Contest of Wills',
    'Epic Showdown','Final Clash','Rivals Unite','Duel at Dawn','Rival Rising',
    'Countermatch','Force vs Force','Power Mirror','Opponent Worthy','Clash Drive',
    'Parallel Paths','Rivals Collide','Battle Mirror','Opposing Force','Rivalry Born',
    'Challenge Accepted','Strength to Strength','Peer Battle','Worthy Match','Equal Power',
    'Rival Surge','Clash Instinct','Duel Force','Rival Energy','Power Standoff',
    'Matched Fury','Rival Pulse','Showdown Drive','Equal Rivals','Clash Mode',
    'Power Contest','Rival Ascent','Duel Pressure','Rival Flame','Supreme Clash',
  ],
  FB07: [
    'Dragon\'s Wish','Eternal Desire','Wish Granted','Divine Request','Sacred Dragon',
    'Shenron Calls','Granted Power','Dragon Blessing','Ultimate Wish','Dragon Awakens',
    'Stars Align','Dragon Summon','Miracle Granted','Seven Stars','Dragon\'s Gaze',
    'Wish of Power','Dragon Rising','Star Collection','Eternal Dragon','Granted Strength',
    'Dragon\'s Might','Wish Fulfilled','Sacred Balls','Dragon Call','Divine Grant',
    'Shenron\'s Gift','Wish Seeker','Dragon Pulse','Eternal Wish','Power Granted',
    'Miracle Drive','Dragon Fire','Granted Desire','Sacred Summon','Dragon Energy',
    'Wish Surge','Dragon\'s Path','Star Aligned','Miracle Awakened','Dragon Surge',
    'Granted Fury','Divine Dragon','Shenron\'s Power','Wish Drive','Dragon Strike',
    'Star Dragon','Granted Force','Dragon\'s Fury','Eternal Power','Dragon Mode',
  ],
  FB08: [
    'Saiyan Heritage','Blood of Warriors','Saiyan Pride','Warrior\'s Honor','Battle-Born',
    'Saiyan Resolve','Iron Will','Heritage of Battle','Born Fighter','Warrior Blood',
    'Saiyan Might','Elite Warrior','Battle Legacy','Warrior Gene','Saiyan Soul',
    'Pride of Warriors','Battle in Blood','Warrior Heritage','Saiyan Drive','Legacy Strike',
    'Born to Fight','Warrior Instinct','Saiyan Force','Pride Strike','Legacy Surge',
    'Battle Bred','Warrior\'s Path','Saiyan Legacy','Blood Drive','Elite Path',
    'Warrior\'s Pride','Saiyan Surge','Legacy Power','Honor Strike','Battle Heritage',
    'Saiyan Intent','Warrior Legacy','Honor Drive','Elite Surge','Battle Force',
    'Saiyan Honor','Warrior Strength','Blood Pride','Elite Power','Legacy Mode',
    'Saiyan Strength','Warrior Drive','Legacy Force','Honor Power','Battle Soul',
  ],
  FB09: [
    'Fusion Evolution','Fused Strength','Perfect Union','Dual Nature','Combined Power',
    'Evolving Bond','Unified Form','Evolved State','Composite Power','Dual Strike',
    'Fusion Mastery','Evolution Complete','Fused Destiny','Unified Might','Perfect Fusion',
    'Dual Surge','Evolving Strength','Composite Strike','Fused Drive','Union Force',
    'Perfect Bond','Dual Power','Fused Mode','Evolution Drive','Composite Fury',
    'United Strength','Perfect Evolution','Dual Force','Fused Surge','Union Strike',
    'Evolving Drive','Composite Bond','Fusion Strike','United Power','Perfect Drive',
    'Dual Mode','Fused Force','Evolution Strike','Composite Mode','Union Surge',
    'Perfect Surge','Dual Drive','Fused Evolution','United Drive','Perfect Mode',
    'Dual Mastery','Fused Power','Evolution Force','Composite Drive','Union Mode',
  ],
}

// ── Rarity from card number ───────────────────────────────────────────────────
// Approximate real DBFW distribution: ~42% C, ~21% UC, ~14% R, ~9% SR, ~11% SCR, ~3% SPR
function getRarity(cardNum, total, sprCount) {
  if (sprCount > 0 && cardNum > total - sprCount) return 'SPR'
  const pct = cardNum / total
  if (pct <= 0.420) return 'C'
  if (pct <= 0.640) return 'UC'
  if (pct <= 0.780) return 'R'
  if (pct <= 0.870) return 'SR'
  return 'SCR'
}

// ── Character from rarity + seeded rng ───────────────────────────────────────
function pickChar(rarity, rng) {
  let pool
  switch (rarity) {
    case 'SPR': pool = CHARS.filter(c => c.tier === 1);      break
    case 'SCR': pool = CHARS.filter(c => c.tier <= 2);       break
    case 'SR':  pool = CHARS.filter(c => c.tier <= 2);       break
    case 'R':   pool = CHARS.filter(c => c.tier <= 3);       break
    default:    pool = CHARS;                                  break
  }
  return pool[Math.floor(rng() * pool.length)]
}

// ── Generate all cards ────────────────────────────────────────────────────────
const IMAGE_CODES = buildImageCodes()

const cards = []
SETS.forEach((set, si) => {
  const arts = SET_ARTS[set.code]
  let artIdx = 0

  for (let n = 1; n <= set.total; n++) {
    const code    = `${set.code}-${String(n).padStart(3, '0')}`
    const rarity  = getRarity(n, set.total, set.spr)
    const rar     = RARITIES[rarity]
    const rng     = mkRng(si * 100000 + n * 7 + 13)
    const char    = pickChar(rarity, rng)
    const art     = arts[artIdx % arts.length]
    artIdx++

    cards.push({
      code,
      set:          set.code,
      setName:      set.name,
      rarity,
      rarityName:   rar.name,
      rarityColor:  rar.color,
      pullRate:     rar.pullRate,
      character:    char.name,
      icon:         char.icon,
      avgRank:      char.avgRank,
      googleTrends: char.googleTrends,
      name:         `${char.name} — ${art}`,
      image:        IMAGE_CODES.has(code) ? `${IMG_BASE}/${code}.png` : null,
    })
  }
})

// ── Write output ──────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'src', 'cardData.json')
fs.writeFileSync(outPath, JSON.stringify(cards, null, 2))
console.log(`✓ Wrote ${cards.length} cards to src/cardData.json`)
console.log(`  Images: ${cards.filter(c => c.image).length} cards`)
console.log(`  Sets: ${SETS.map(s => `${s.code}(${s.total})`).join(', ')}`)
