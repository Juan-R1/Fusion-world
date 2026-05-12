let cache = null
let warnedSample = false

export async function loadPremiumMetadata() {
  if (cache) return cache
  try {
    const res = await fetch('/premiumMetadata.json')
    if (!res.ok) return (cache = { items: {} })
    const json = await res.json()
    if (json && json._isSample === true) {
      if (typeof console !== 'undefined' && !warnedSample) {
        console.warn('[premiumMetadata] sample artifact refused; awaiting production fixture')
        warnedSample = true
      }
      return (cache = { items: {} })
    }
    return (cache = json && json.items ? json : { items: {} })
  } catch {
    return (cache = { items: {} })
  }
}
