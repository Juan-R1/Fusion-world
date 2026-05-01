# Watchlist Demo Data Guide

Use this guide only to prepare local screenshots or a live portfolio demo.
It writes demo positions into your current browser's `localStorage`; it does
not change app code, generated JSON, the data pipeline, or any real account.

Do not treat these entries as real portfolio records.

## Suggested Demo Positions

| Card code | Why include it |
|-----------|----------------|
| `FB01-140` | Higher-value LIVE chase-style card from a recently refreshed set. |
| `FB03-009` | Recognizable LIVE card that also works well in CardDetail. |
| `FB02-081` | Low-price LIVE card for small-position math. |
| `FB04-129` | Carried-forward LIVE card from a set outside the latest FB01-FB03 proof group. |

The entry prices below are intentionally illustrative so Unrealized P/L has
visible positive and negative rows. They are not purchase recommendations.

## Seed Local Demo Positions

1. Open FusionMetrics in the browser.
2. Open the browser developer console.
3. Paste this snippet and press Enter.
4. Refresh the page.
5. Open Watchlist.

```js
localStorage.setItem(
  'fw-watchlist-v2',
  JSON.stringify({
    version: 2,
    items: {
      'FB01-140': {
        cardCode: 'FB01-140',
        quantity: 1,
        entryPrice: 8.5,
        addedAt: '2026-05-01T12:00:00.000Z'
      },
      'FB03-009': {
        cardCode: 'FB03-009',
        quantity: 3,
        entryPrice: 0.5,
        addedAt: '2026-05-01T12:00:00.000Z'
      },
      'FB02-081': {
        cardCode: 'FB02-081',
        quantity: 12,
        entryPrice: 0.02,
        addedAt: '2026-05-01T12:00:00.000Z'
      },
      'FB04-129': {
        cardCode: 'FB04-129',
        quantity: 1,
        entryPrice: 12,
        addedAt: '2026-05-01T12:00:00.000Z'
      }
    }
  })
);
```

## Reset Demo Data

Use the Watchlist **Clear all** control for the most realistic app flow.
If you need to reset manually from the browser console:

```js
localStorage.removeItem('fw-watchlist-v2');
localStorage.removeItem('fw-watchlist-v1');
```

Refresh after clearing.

## Screenshot Notes

- Capture the Watchlist summary cards and at least two rows.
- Keep LIVE/EST chips, freshness labels, quantity, entry price, current value,
  and Unrealized P/L visible.
- Say "Based on current FusionMetrics price" when presenting this screen.
- Do not describe the demo entries as real holdings or advice.
