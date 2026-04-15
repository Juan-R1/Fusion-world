// src/hooks/useWatchlist.js
// Persists watched card codes to localStorage.
// Returns a stable Set reference so consumers can do watchedCodes.has(code).

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'fw-watchlist-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function save(set) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])) }
  catch {}
}

export function useWatchlist() {
  const [watchedCodes, setWatchedCodes] = useState(load)

  const toggle = useCallback(code => {
    setWatchedCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      save(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setWatchedCodes(new Set())
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return { watchedCodes, toggle, clear }
}
