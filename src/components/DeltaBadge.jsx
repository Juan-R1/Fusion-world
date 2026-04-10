import { T } from '../theme.js'

export default function DeltaBadge({ delta }) {
  const col = delta < -15 ? T.green    : delta > 15 ? T.red    : T.yellow
  const bg  = delta < -15 ? T.greenDim : delta > 15 ? T.redDim : T.yellowDim
  const sign = delta > 0 ? '+' : ''

  return (
    <span
      style={{
        background: bg,
        color: col,
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: T.mono,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {sign}{delta.toFixed(1)}%
    </span>
  )
}
