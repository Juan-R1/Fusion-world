export default function MiniBar({ value, max = 1, color = '#f97316', w = 80 }) {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100
  return (
    <div style={{ width: w, height: 5, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}
