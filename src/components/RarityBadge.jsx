import { T } from '../theme.js'

export default function RarityBadge({ rarity, color }) {
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        padding: '1px 6px',
        borderRadius: 3,
        fontSize: 10,
        fontFamily: T.mono,
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      {rarity}
    </span>
  )
}
