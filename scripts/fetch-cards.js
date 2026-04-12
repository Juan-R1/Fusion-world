#!/usr/bin/env node
/**
 * scripts/fetch-cards.js
 * Generates src/cardData.json — base card metadata for all 9 DBFW sets.
 * Loads real names from scripts/known-cards.json (143 verified entries).
 * Run with: node scripts/fetch-cards.js
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IMG_BASE = 'https://raw.githubusercontent.com/HighDefined/TCG-Arena-DBSFW/main'

// ── Load known (verified) cards ───────────────────────────────────────────────
const KNOWN_ARR = JSON.parse(fs.readFileSync(path.join(__dirname, 'known-cards.json'), 'utf8'))
const KNOWN = Object.fromEntries(KNOWN_ARR.map(c => [c.code, c]))

// ── Image codes from HighDefined/TCG-Arena-DBSFW ─────────────────────────────
function buildImageCodes() {
  const s = new Set()
  const add = (set, n) => s.add(`${set}-${String(n).padStart(3,'0')}`)
  add('FB01',3); add('FB01',4)
  for (let n=6;  n<=34;  n++) add('FB01',n)
  add('FB01',139)
  for (let n=2;  n<=30;  n++) add('FB02',n)
  for (let n=32; n<=35;  n++) add('FB02',n)
  for (let n=2;  n<=26;  n++) add('FB03',n)
  for (let n=2;  n<=10;  n++) add('FB04',n)
  return s
}

// ── googleTrends per character — drives charPremium in data.js ────────────────
const GT = {
  'Son Goku':100,'Gogeta':92,'Broly':90,'Vegito':87,'Vegeta':85,'Goku Black':88,
  'Frieza':80,'Beerus':72,'Son Gohan':70,'Jiren':68,'Kefla':67,'Cell':65,
  'Trunks':62,'Android 18':60,'Caulifla':58,'Android 17':58,'Hit':58,
  'Piccolo':55,'Majin Buu':55,'Kale':54,'Cooler':52,'Krillin':52,
  'Zamasu':50,'Whis':50,'Shenron':48,'Vados':48,'Champa':45,'Zen-Oh':45,
  'Goten':45,'Yamcha':42,'Tien Shinhan':42,'Pan':42,'Hercule':40,
  'King Piccolo':40,'Cabba':40,'Master Roshi':50,'Ginyu':38,
  'Great Priest':38,'Frost':38,'Shin':35,'Gamma 2':35,'King Cold':35,
  'Mai':35,'Syn Shenron':35,'Dabura':32,'Chi-Chi':32,'Android 16':30,
  'Gowasu':30,'Recoome':30,'Mecha Frieza':30,'Babidi':30,'Pilaf':28,
  'Meta-Cooler':28,'Saonel':25,'Android 20':25,'Baby Vegeta':25,'Veku':22,
  'Pirina':22,'Botamo':22,'Anilaza':20,'Kakunsa':20,'Quitela':20,
  'King Gomah':20,'Glorio':20,'Magetta':20,'Fuwa':20,'Salza':20,
  'Mafuba':20,'Katopesla':18,'Dore':18,'Yajirobe':18,'Kahseral':15,
  'Dr. Rota':15,'Banan':15,
}
const ICON = {
  'Son Goku':'🔥','Gogeta':'🌟','Broly':'💪','Vegito':'💫','Vegeta':'⚡',
  'Goku Black':'⚫','Frieza':'❄️','Beerus':'👁️','Son Gohan':'🟡','Jiren':'🔴',
  'Kefla':'🌀','Cell':'🧬','Trunks':'⚔️','Android 18':'🤖','Caulifla':'🌺',
  'Android 17':'🤖','Hit':'🔷','Piccolo':'💚','Majin Buu':'🩷','Kale':'🌿',
  'Cooler':'❄️','Krillin':'🥚','Zamasu':'😤','Whis':'🪄','Shenron':'🐉',
  'Vados':'🌸','Champa':'👑','Zen-Oh':'👼','Goten':'👦','Yamcha':'🐺',
  'Tien Shinhan':'🔱','Pan':'🌸','Hercule':'🏆','King Piccolo':'💚',
  'Cabba':'🔵','Master Roshi':'🐢','Ginyu':'💜','Great Priest':'⚪',
  'Frost':'❄️','Shin':'⭕','Gamma 2':'🦸','King Cold':'❄️','Mai':'🔫',
  'Syn Shenron':'🐉','Dabura':'😈','Chi-Chi':'👩','Android 16':'🤖',
  'Gowasu':'⭕','Recoome':'💜','Mecha Frieza':'❄️','Babidi':'🪄',
  'Pilaf':'👿','Meta-Cooler':'❄️','Saonel':'💙','Android 20':'🤖',
  'Baby Vegeta':'👹','Veku':'🌟','Pirina':'💙','Botamo':'🐻',
  'Anilaza':'🔮','Kakunsa':'🐯','Quitela':'🐭','King Gomah':'👹',
  'Glorio':'👹','Magetta':'🔩','Fuwa':'⭕','Salza':'🗡️','Mafuba':'🌊',
  'Katopesla':'🔵','Dore':'💪','Yajirobe':'🗡️','Kahseral':'🔴',
  'Dr. Rota':'🔬','Banan':'🍌',
}

function gtOf(c) { return GT[c] ?? 50 }
function iconOf(c) { return ICON[c] ?? '🃏' }

// ── Rarities ──────────────────────────────────────────────────────────────────
const RARITIES = {
  L:   {name:'Leader',       pullRate:0.04,  color:'#10b981'},
  C:   {name:'Common',       pullRate:0.55,  color:'#6b7280'},
  UC:  {name:'Uncommon',     pullRate:0.28,  color:'#3b82f6'},
  R:   {name:'Rare',         pullRate:0.12,  color:'#a855f7'},
  SR:  {name:'Super Rare',   pullRate:0.04,  color:'#f59e0b'},
  SCR: {name:'Secret Rare',  pullRate:0.008, color:'#f97316'},
  SPR: {name:'Special Rare', pullRate:0.003, color:'#dc2626'},
}

// ── Synthetic fallback characters ─────────────────────────────────────────────
const SYNTH_POOL = [
  'Son Goku','Gogeta','Broly','Vegito','Vegeta','Goku Black','Frieza','Beerus',
  'Son Gohan','Jiren','Kefla','Cell','Trunks','Android 18','Caulifla','Hit',
  'Piccolo','Kale','Cooler','Krillin','Whis','Champa','Cabba','Goten','Pan',
]
function synthChar(rarity, rng) {
  const pools = {SPR:4,SCR:6,SR:10,R:16}
  const n = pools[rarity] ?? SYNTH_POOL.length
  return SYNTH_POOL[Math.floor(rng() * n)]
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

// ── Rarity from position (synthetic only) ────────────────────────────────────
function getRarity(n, total, spr) {
  if (spr > 0 && n > total - spr) return 'SPR'
  const p = n / total
  if (p <= 0.42) return 'C'
  if (p <= 0.64) return 'UC'
  if (p <= 0.78) return 'R'
  if (p <= 0.87) return 'SR'
  return 'SCR'
}

// ── Per-set art pools ─────────────────────────────────────────────────────────
const ARTS = {
  FB01:['Awakened Pulse','Rising Surge','First Ascension','Primal Force','Dormant Power','Awakened Soul','Emergence','Kindled Flame','Origin Strike','Unbound Will','Breaking Limits','Initial Impact','Force Unleashed','Dawn of Power','Opening Gambit','Primal Awakening','Inner Fire','First Steps','Surge of Power','Limitless Potential','Core Instinct','Rising Phoenix','Base Pressure','Fundamental Drive','Primal Energy','Spark of Battle','Latent Strength','Pressure Point','Controlled Fury','Awakened Might'],
  FB02:['Blazing Strike','Infernal Rush','Scorched Earth','Searing Edge','Molten Core','Firestorm','Burning Soul','Ignition Point','Heat Wave','Combustion','Ember Rage','Solar Flare','Conflagration','Wildfire','Blaze of Glory','Lava Surge','Inferno Drive','Cinder Force','Phoenix Burst','Thermal Blast','Flame Veil','Incendiary Charge','Scorching Fist','Blazing Trail','Fire Storm','Searing Aura','Volcanic Intent','White Hot','Burning Rush','Flare Kick'],
  FB03:['Roaring Tide','Savage Howl','Beast Instinct','Primal Roar','Feral Rush','War Cry','Battle Hunger','Apex Fury',"Predator's Edge",'Unleashed Rage','Berserker Mode','Fang and Claw','Thunderous Charge','Primal Surge','Raging Tempest','Wild Assault','Beast Rush','Howling Strike','Savage Surge','Primal Stampede','Feral Instinct','Ferocious Blow','Untamed Force','Primal Fury','Berserk Drive','Savage Rhythm','Bloodlust','Rampant Power','Untethered Rage','Pack Mentality'],
  FB04:['Limit Exceeded','Beyond Bounds','Peak Performance','Ultimate Form','Transcendence','Breaking Point','Maximum Output','Extreme Force','Overdrive','Full Throttle','Critical Strike','Zenith Form','Absolute Limit','Final Push','Ultra Mode','Pinnacle Power','Overclocked','Supreme Force','Maximum Reach','Terminal Velocity','Limit Shattering','Apex Drive','Surpassing All','Boundless','Exceed the Max','Critical Mass','Push the Limits','Final Form','All In','No Holding Back'],
  FB05:['New Horizon','Uncharted Path','Fresh Chapter','Unexplored Depths','Reborn Warrior','Second Wind','Rising Star','Rebirth','Genesis Form','New Dawn','Evolution Begins','Renewed Strength','New Era','Infinite Potential','Boundless Future','New Beginning','Fresh Start','First Day','Renewed Purpose','Blank Slate','Clean Break','New Chapter','Untested Path','Beginning Again','Rebirth Drive','Second Chance','Next Step','Opening Move','Forward March','New Road'],
  FB06:["Rival's Challenge",'Clash of Titans','Face-Off','Worthy Opponent','Battle of Equals','Supreme Duel','Head-to-Head','Mutual Respect','Power Struggle','Contest of Wills','Epic Showdown','Final Clash','Rivals Unite','Duel at Dawn','Rival Rising','Countermatch','Force vs Force','Power Mirror','Opponent Worthy','Clash Drive','Parallel Paths','Rivals Collide','Battle Mirror','Opposing Force','Rivalry Born','Challenge Accepted','Strength to Strength','Peer Battle','Worthy Match','Equal Power'],
  FB07:["Dragon's Wish",'Eternal Desire','Wish Granted','Divine Request','Sacred Dragon','Shenron Calls','Granted Power','Dragon Blessing','Ultimate Wish','Dragon Awakens','Stars Align','Dragon Summon','Miracle Granted','Seven Stars',"Dragon's Gaze",'Wish of Power','Dragon Rising','Star Collection','Eternal Dragon','Granted Strength',"Dragon's Might",'Wish Fulfilled','Sacred Balls','Dragon Call','Divine Grant',"Shenron's Gift",'Wish Seeker','Dragon Pulse','Eternal Wish','Power Granted'],
  FB08:['Saiyan Heritage','Blood of Warriors','Saiyan Pride',"Warrior's Honor",'Battle-Born','Saiyan Resolve','Iron Will','Heritage of Battle','Born Fighter','Warrior Blood','Saiyan Might','Elite Warrior','Battle Legacy','Warrior Gene','Saiyan Soul','Pride of Warriors','Battle in Blood','Warrior Heritage','Saiyan Drive','Legacy Strike','Born to Fight','Warrior Instinct','Saiyan Force','Pride Strike','Legacy Surge','Battle Bred',"Warrior's Path",'Saiyan Legacy','Blood Drive','Elite Path'],
  FB09:['Fusion Evolution','Fused Strength','Perfect Union','Dual Nature','Combined Power','Evolving Bond','Unified Form','Evolved State','Composite Power','Dual Strike','Fusion Mastery','Evolution Complete','Fused Destiny','Unified Might','Perfect Fusion','Dual Surge','Evolving Strength','Composite Strike','Fused Drive','Union Force','Perfect Bond','Dual Power','Fused Mode','Evolution Drive','Composite Fury','United Strength','Perfect Evolution','Dual Force','Fused Surge','Union Strike'],
}

// ── Set definitions ───────────────────────────────────────────────────────────
const SETS = [
  {code:'FB01',name:'Awakened Pulse',  total:140,spr:0},
  {code:'FB02',name:'Blazing Aura',    total:140,spr:0},
  {code:'FB03',name:'Raging Roar',     total:164,spr:0},
  {code:'FB04',name:'Ultra Limit',     total:159,spr:0},
  {code:'FB05',name:'New Adventure',   total:159,spr:0},
  {code:'FB06',name:'Rivals Clash',    total:123,spr:0},
  {code:'FB07',name:'Wish for Shenron',total:125,spr:0},
  {code:'FB08',name:"Saiyan's Pride",  total:125,spr:0},
  {code:'FB09',name:'Dual Evolution',  total:123,spr:0},
]

// ── Generate all cards ────────────────────────────────────────────────────────
const IMAGE_CODES = buildImageCodes()
const cards = []

SETS.forEach((set, si) => {
  const arts = ARTS[set.code]
  let artIdx = 0

  for (let n = 1; n <= set.total; n++) {
    const code  = `${set.code}-${String(n).padStart(3,'0')}`
    const known = KNOWN[code]
    const rng   = mkRng(si * 100003 + n * 7 + 13)

    let rarity, character, name, cardColor, cardType, trait, verified

    if (known) {
      rarity    = known.rarity
      character = known.character
      name      = known.name
      cardColor = known.color
      cardType  = known.type
      trait     = known.trait
      verified  = true
    } else {
      rarity    = getRarity(n, set.total, set.spr)
      character = synthChar(rarity, rng)
      name      = `${character} — ${arts[artIdx % arts.length]}`
      cardColor = 'Red'
      cardType  = 'Battle'
      trait     = null
      verified  = false
    }
    artIdx++

    const rar = RARITIES[rarity] ?? RARITIES.C
    cards.push({
      code, set: set.code, setName: set.name,
      rarity, rarityName: rar.name, rarityColor: rar.color, pullRate: rar.pullRate,
      character, icon: iconOf(character), googleTrends: gtOf(character),
      name, cardColor, cardType, trait, verified,
      image: IMAGE_CODES.has(code) ? `${IMG_BASE}/${code}.png` : null,
    })
  }
})

const outPath = path.join(__dirname, '..', 'src', 'cardData.json')
fs.writeFileSync(outPath, JSON.stringify(cards, null, 2))

const verified = cards.filter(c => c.verified).length
const withImg  = cards.filter(c => c.image).length
console.log(`✓ ${cards.length} cards → src/cardData.json`)
console.log(`  Verified (real names): ${verified}`)
console.log(`  Synthetic:             ${cards.length - verified}`)
console.log(`  With images:           ${withImg}`)
const bySet = SETS.map(s => {
  const sc = cards.filter(c => c.set === s.code)
  const v  = sc.filter(c => c.verified).length
  return `    ${s.code}: ${v}/${sc.length} verified`
})
console.log(bySet.join('\n'))
