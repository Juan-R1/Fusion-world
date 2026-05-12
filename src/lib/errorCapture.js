let installed = false

function messageOf(value) {
  if (!value) return 'Unknown error'
  if (typeof value === 'string') return value
  if (value.message) return String(value.message)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function emitJsError({ message, source, lineno }) {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  window.plausible('js-error', {
    props: {
      message: String(message || 'Unknown error').slice(0, 240),
      source: String(source || 'unknown').slice(0, 160),
      lineno: Number.isFinite(Number(lineno)) ? Number(lineno) : 0,
    },
  })
}

export function setupErrorCapture() {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', event => {
    emitJsError({
      message: messageOf(event.error || event.message),
      source: event.filename || 'window.onerror',
      lineno: event.lineno,
    })
  })

  window.addEventListener('unhandledrejection', event => {
    emitJsError({
      message: messageOf(event.reason),
      source: 'unhandledrejection',
      lineno: 0,
    })
  })
}
