let cache = null
let warnedSample = false

export async function loadEbayComps() {
  if (cache) return cache
  try {
    const res = await fetch('/ebayCompsSummary.json')
    if (!res.ok) return (cache = { byCardCode: {} })
    const json = await res.json()
    if (json && json._isSample === true) {
      if (typeof console !== 'undefined' && !warnedSample) {
        console.warn('[ebayComps] sample artifact refused; awaiting production fixture')
        warnedSample = true
      }
      return (cache = { byCardCode: {} })
    }
    return (cache = json && json.byCardCode ? json : { byCardCode: {} })
  } catch {
    return (cache = { byCardCode: {} })
  }
}
