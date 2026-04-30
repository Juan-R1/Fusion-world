// src/hooks/useWatchlist.js
// Persists local watchlist positions to localStorage.
// Returns watchedCodes as a Set so existing consumers can do watchedCodes.has(code).

import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY_V1 = 'fw-watchlist-v1'
const STORAGE_KEY_V2 = 'fw-watchlist-v2'

function hasStorage() {
  return typeof localStorage !== 'undefined'
}

function coerceQuantity(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.max(1, Math.floor(n))
}

function coerceEntryPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

function defaultEntryPrice(cardByCode, cardCode) {
  const price = cardByCode.get(cardCode)?.marketPrice
  return coerceEntryPrice(Number.isFinite(price) ? price : 0)
}

function createItem(cardByCode, cardCode, nowIso = new Date().toISOString()) {
  return {
    cardCode,
    quantity: 1,
    entryPrice: defaultEntryPrice(cardByCode, cardCode),
    addedAt: nowIso,
  }
}

function normalizeItem(raw, cardByCode) {
  const cardCode = typeof raw?.cardCode === 'string' ? raw.cardCode : null
  if (!cardCode) return null

  const addedAt = typeof raw.addedAt === 'string' && !Number.isNaN(Date.parse(raw.addedAt))
    ? raw.addedAt
    : new Date().toISOString()

  return {
    cardCode,
    quantity: coerceQuantity(raw.quantity),
    entryPrice: coerceEntryPrice(raw.entryPrice ?? defaultEntryPrice(cardByCode, cardCode)),
    addedAt,
  }
}

function normalizeItems(rawItems, cardByCode) {
  if (!rawItems || typeof rawItems !== 'object' || Array.isArray(rawItems)) return {}

  return Object.values(rawItems).reduce((items, raw) => {
    const item = normalizeItem(raw, cardByCode)
    if (item) items[item.cardCode] = item
    return items
  }, {})
}

function saveV2(items) {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ version: 2, items }))
  } catch {}
}

function loadV2(cardByCode) {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (parsed?.version !== 2) return {}

    const items = normalizeItems(parsed.items, cardByCode)
    saveV2(items)
    return items
  } catch {
    return {}
  }
}

function migrateV1(cardByCode) {
  if (!hasStorage()) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1)
    const codes = raw ? JSON.parse(raw) : []
    if (!Array.isArray(codes)) return {}

    const nowIso = new Date().toISOString()
    const items = codes.reduce((next, code) => {
      if (typeof code === 'string' && code) next[code] = createItem(cardByCode, code, nowIso)
      return next
    }, {})

    saveV2(items)
    return items
  } catch {
    return {}
  }
}

function load(cardByCode) {
  const v2 = loadV2(cardByCode)
  return v2 ?? migrateV1(cardByCode)
}

export function useWatchlist(cards = []) {
  const cardByCode = useMemo(() => new Map(cards.map(card => [card.cardCode, card])), [cards])
  const [watchlistItems, setWatchlistItems] = useState(() => load(cardByCode))

  const watchedCodes = useMemo(() => new Set(Object.keys(watchlistItems)), [watchlistItems])

  const toggle = useCallback(code => {
    setWatchlistItems(prev => {
      const next = { ...prev }
      if (next[code]) delete next[code]
      else next[code] = createItem(cardByCode, code)
      saveV2(next)
      return next
    })
  }, [cardByCode])

  const remove = useCallback(code => {
    setWatchlistItems(prev => {
      if (!prev[code]) return prev
      const next = { ...prev }
      delete next[code]
      saveV2(next)
      return next
    })
  }, [])

  const updateItem = useCallback((code, patch) => {
    setWatchlistItems(prev => {
      const existing = prev[code] ?? createItem(cardByCode, code)
      const nextItem = {
        ...existing,
        quantity: patch.quantity == null ? existing.quantity : coerceQuantity(patch.quantity),
        entryPrice: patch.entryPrice == null ? existing.entryPrice : coerceEntryPrice(patch.entryPrice),
      }
      const next = { ...prev, [code]: nextItem }
      saveV2(next)
      return next
    })
  }, [cardByCode])

  const clear = useCallback(() => {
    setWatchlistItems({})
    if (!hasStorage()) return
    try {
      localStorage.removeItem(STORAGE_KEY_V1)
      localStorage.removeItem(STORAGE_KEY_V2)
    } catch {}
  }, [])

  return { watchedCodes, watchlistItems, toggle, remove, updateItem, clear }
}
