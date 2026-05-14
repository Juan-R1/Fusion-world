import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

async function importLoaders() {
  const premium = await import('../src/lib/premiumMetadata.js')
  const ebay = await import('../src/lib/ebayComps.js')
  return {
    loadPremiumMetadata: premium.loadPremiumMetadata,
    loadEbayComps: ebay.loadEbayComps,
  }
}

describe('sample-gated public artifact loaders', () => {
  test('refuse sample-flagged artifacts', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    globalThis.fetch = vi.fn(async url => ({
      ok: true,
      json: async () => String(url).includes('premiumMetadata')
        ? { _isSample: true, items: { 'FB01-001': { premiumFlags: ['altArt'] } } }
        : { _isSample: true, byCardCode: { 'FB01-001': [{ soldPrice: 1 }] } },
    }))

    const { loadPremiumMetadata, loadEbayComps } = await importLoaders()

    await expect(loadPremiumMetadata()).resolves.toEqual({ items: {} })
    await expect(loadEbayComps()).resolves.toEqual({ byCardCode: {} })
  })

  test('return empty production shapes when artifacts are missing', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404 }))

    const { loadPremiumMetadata, loadEbayComps } = await importLoaders()

    await expect(loadPremiumMetadata()).resolves.toEqual({ items: {} })
    await expect(loadEbayComps()).resolves.toEqual({ byCardCode: {} })
  })
})
