import { T } from '../theme.js'

export default function GaugeRing({ value, max = 1, color = '#f97316', size = 80, label = '' }) {
  const pct  = Math.min(Math.max(value / max, 0), 1)
  const r    = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const cx   = size / 2
  const cy   = size / 2

  return (
    <svg width={size} height={size}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border2} strokeWidth={7} />
      {/* Fill arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center percentage */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={T.text}
        fontSize={size * 0.19}
        fontFamily={T.mono}
        fontWeight="600"
      >
        {(pct * 100).toFixed(0)}%
      </text>
      {/* Optional label below */}
      {label && (
        <text
          x={cx} y={cy + size * 0.30}
          textAnchor="middle"
          fill={T.muted}
          fontSize={size * 0.13}
          fontFamily={T.display}
        >
          {label}
        </text>
      )}
    </svg>
  )
}
