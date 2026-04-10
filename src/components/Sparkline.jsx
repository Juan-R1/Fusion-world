export default function Sparkline({ data, color = '#f97316', height = 40, width = 120, fill = false }) {
  if (!data || data.length < 2) return null
  const mn  = Math.min(...data)
  const mx  = Math.max(...data)
  const rng = mx - mn || 1
  const pad = height * 0.08
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - pad - ((v - mn) / rng) * (height - pad * 2),
  ])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && (
        <path
          d={`${line} L${width},${height} L0,${height} Z`}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
