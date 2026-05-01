import { T } from '../theme.js'

export default function DeltaBadge({ delta }) {
  const safeDelta = Number.isFinite(Number(delta)) ? Number(delta) : 0
  const col = safeDelta < -15 ? T.green    : safeDelta > 15 ? T.red    : T.yellow
  const bg  = safeDelta < -15 ? T.greenDim : safeDelta > 15 ? T.redDim : T.yellowDim
  const sign = safeDelta > 0 ? '+' : ''

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
      {sign}{safeDelta.toFixed(1)}%
    </span>
  )
}
