import { T } from '../theme.js'

const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 }

const DESCRIPTIVE_FLAGS = new Set([
  'altArt', 'manga', 'mangaAdjacent', 'parallel', 'gdr', 'godRare',
  'winnerPromo', 'eventPromo', 'serialized', 'starterDeckChase',
])

const RANKING_FLAGS = new Set([
  'secretRareChase', 'specialRareChase', 'sealedChase',
  'gogetaChase', 'sonGokuChase', 'brolyChase',
])

const FLAG_LABELS = {
  altArt: 'Alt Art',
  manga: 'Manga',
  mangaAdjacent: 'Manga Style',
  parallel: 'Parallel',
  gdr: 'GDR',
  godRare: 'God Rare',
  winnerPromo: 'Winner Promo',
  eventPromo: 'Event Promo',
  serialized: 'Serialized',
  starterDeckChase: 'Starter Deck Chase',
  secretRareChase: 'Secret Rare Chase',
  specialRareChase: 'Special Rare Chase',
  sealedChase: 'Sealed Chase',
  gogetaChase: 'Gogeta Chase',
  sonGokuChase: 'Son Goku Chase',
  brolyChase: 'Broly Chase',
}

const TAG_LABELS = {
  fusionCharacter: 'Fusion character',
  heroCharacter: 'Hero character',
  villainCharacter: 'Villain character',
  fanFavorite: 'Fan favorite',
  setChase: 'Set chase',
  boxTopHit: 'Box top hit',
  artDriven: 'Art-driven',
  playabilityRelevant: 'Playability relevant',
  lowPopulationPotential: 'Low-pop potential',
  nostalgiaAppeal: 'Nostalgia appeal',
  newReleaseAttention: 'New-release attention',
  variantAmbiguity: 'Variant ambiguity',
  rawGradedContamination: 'Raw/graded mixing',
  lowVolume: 'Low volume',
  stalePrice: 'Stale price',
  sourceDisagreement: 'Source disagreement',
  reprintRisk: 'Reprint risk',
  sealedVariance: 'Sealed variance',
  manualReviewOnly: 'Manual review',
  unverifiedTreatment: 'Unverified treatment',
  thinMarket: 'Thin market',
}

const labelFor = value => TAG_LABELS[value] || FLAG_LABELS[value] || String(value)

function Chip({ label, tone = 'muted', compact = false }) {
  const styles = tone === 'primary'
    ? { color: T.orange, background: `${T.orange}1a`, border: `${T.orange}55` }
    : tone === 'risk'
      ? { color: T.muted, background: T.s2, border: T.border2 }
      : { color: T.dim, background: T.s1, border: T.border }

  return (
    <span
      style={{
        color: styles.color,
        background: styles.background,
        border: `1px solid ${styles.border}`,
        borderRadius: 999,
        padding: compact ? '1px 5px' : '2px 7px',
        fontSize: compact ? 8 : 10,
        lineHeight: 1.4,
        fontFamily: T.mono,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default function PremiumBadges({ metadata, compact = false }) {
  if (!metadata || CONFIDENCE_RANK[metadata.confidence] <= 0) return null

  const confidence = CONFIDENCE_RANK[metadata.confidence] ?? 0
  const premiumFlags = Array.isArray(metadata.premiumFlags) ? metadata.premiumFlags : []
  const collectorTags = Array.isArray(metadata.collectorTags) ? metadata.collectorTags : []
  const riskTags = Array.isArray(metadata.riskTags) ? metadata.riskTags : []

  const surfacedFlags = premiumFlags.filter(flag =>
    DESCRIPTIVE_FLAGS.has(flag)
      ? confidence >= CONFIDENCE_RANK.medium
      : RANKING_FLAGS.has(flag) && confidence >= CONFIDENCE_RANK.high
  )
  if (!surfacedFlags.length) return null

  const shownCollectorTags = collectorTags.filter(tag => tag !== 'boxTopHit').slice(0, compact ? 1 : 3)
  const shownRiskTags = riskTags.slice(0, compact ? 1 : 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 3 : 5, marginTop: compact ? 3 : 8 }}>
      <div style={{ display: 'flex', gap: compact ? 3 : 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {surfacedFlags.map(flag => (
          <Chip key={flag} label={labelFor(flag)} tone="primary" compact={compact} />
        ))}
      </div>
      {!compact && (shownCollectorTags.length > 0 || shownRiskTags.length > 0) && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {shownCollectorTags.map(tag => (
            <Chip key={tag} label={labelFor(tag)} compact />
          ))}
          {shownRiskTags.map(tag => (
            <Chip key={tag} label={labelFor(tag)} tone="risk" compact />
          ))}
        </div>
      )}
    </div>
  )
}
