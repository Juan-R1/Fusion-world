import { useState } from 'react'
import { T } from '../theme.js'

/**
 * Displays a card image with a graceful fallback placeholder.
 * props:
 *   src      – image URL (may be undefined/null)
 *   cardCode – e.g. "FB01-001", shown in placeholder
 *   alt      – img alt text
 *   width    – CSS value, default 40
 *   height   – CSS value, default 56
 *   radius   – border-radius, default 4
 */
export default function CardImage({ src, cardCode, alt, width = 40, height = 56, radius = 4 }) {
  const [failed, setFailed] = useState(false)

  const containerStyle = {
    width,
    height,
    borderRadius: radius,
    overflow: 'hidden',
    flexShrink: 0,
    background: T.s2,
    border: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (!src || failed) {
    return (
      <div style={containerStyle}>
        <span
          style={{
            fontSize: 7,
            fontFamily: T.mono,
            color: T.dim,
            textAlign: 'center',
            padding: '2px 3px',
            lineHeight: 1.3,
            wordBreak: 'break-all',
          }}
        >
          {cardCode}
        </span>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <img
        src={src}
        alt={alt || cardCode}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}
