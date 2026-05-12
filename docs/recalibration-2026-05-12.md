# Quarterly Model Recalibration — 2026-05-12

## Scope

Quarterly recalibration against the current known-good live-price set:

- Cards with live prices: `1,156`
- Source file: `src/livePrices.json`
- Calibration script: `node scripts/calibrate-model.js`
- Data files regenerated: none
- Pricing formula structure changed: no

## Script Output Summary

```text
Dataset: 1156 cards with live prices

Rarity  Count   GeoMean    Median      P10      P90
C       1027    $0.16      $0.13       $0.08    $0.40
UC        27    $0.14      $0.13       $0.08    $0.18
R         30    $0.23      $0.21       $0.12    $0.74
SR        15    $1.21      $1.27       $0.18    $4.55
SCR       15    $12.32     $16.28      $0.79    $42.42
L         42    $0.23      $0.23       $0.15    $0.30

β (charPremium effect): 0.0731
mean charPremium:       5.9386
R²:                     0.3200
```

No live SPR samples were available, so the script did not emit an SPR
replacement base.

## Drift Table

| Constant | Previous | Script output | Drift | Applied |
|----------|---------:|--------------:|------:|--------:|
| `L` | `0.2304` | `0.2255` | `-2.13%` | `0.2255` |
| `C` | `0.1598` | `0.1584` | `-0.88%` | `0.1584` |
| `UC` | `0.2000` | `0.1416` | `-29.20%` | `0.2000` |
| `R` | `0.2440` | `0.2308` | `-5.41%` | `0.2308` |
| `SR` | `1.1144` | `1.2063` | `+8.25%` | `1.2063` |
| `SCR` | `12.9869` | `12.3184` | `-5.15%` | `12.3184` |
| `SPR` | `24.9900` | no sample | n/a | `24.9900` |
| `CHAR_PREMIUM_BETA` | `0.0803` | `0.0731` | `-8.97%` | `0.0731` |
| `MEAN_CHAR_PREMIUM` | `5.9386` | `5.9386` | `0.00%` | `5.9386` |

## R² Check

| Model variant | R² |
|---------------|---:|
| Previous constants | `0.3174` |
| Raw script output | `0.3200` |
| Applied constants | `0.3180` |

The applied constants retain the documented UC smoothing and SPR extrapolation
instead of blindly applying the noisy UC geometric mean or removing SPR.

## Decision

Apply the measured drift for `L`, `C`, `R`, `SR`, `SCR`, and
`CHAR_PREMIUM_BETA`.

Retain:

- `UC = 0.2000`, because the 27-card natural UC sample still prices below
  Common and would contradict the existing Methodology disclosure.
- `SPR = 24.99`, because there are still no live SPR samples.

The pricing formula structure was not changed.

## Validation

Required validation after the edit:

```bash
npm run build
node scripts/verify-data.js
```

Expected next recalibration date: **2026-08-12**.
