// scripts/probe-history.js
// One-shot diagnostic. Do not commit permanently unless useful.
// Usage:
//   JUSTTCG_API_KEY=your_key node scripts/probe-history.js
//   JUSTTCG_API_KEY=your_key node scripts/probe-history.js FB01-001 FB05-120 FB09-121
const API_KEY = process.env.JUSTTCG_API_KEY;
const GAME = "dragon-ball-super-fusion-world";
const BASE_URL = "https://api.justtcg.com/v1/cards";
if (!API_KEY) {
  console.error("Missing JUSTTCG_API_KEY environment variable.");
  process.exit(1);
}
const cardNumbers = process.argv.slice(2);
const DEFAULT_CARD_NUMBERS = [
  "FB01-001",
  "FB01-139",
  "FB02-001",
  "FB05-120",
  "FB08-001",
  "FB09-121"
];
const targets = cardNumbers.length ? cardNumbers : DEFAULT_CARD_NUMBERS;
function summarizeHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      points: 0,
      firstDate: null,
      lastDate: null,
      sample: []
    };
  }
  // JustTCG history points use { p: price, t: unixSeconds }.
  // Older shapes (date / timestamp / createdAt / day) are tried as a fallback.
  const toIso = (point) => {
    const raw = point.t ?? point.timestamp ?? point.date ?? point.createdAt ?? point.day;
    if (raw == null) return null;
    if (typeof raw === "number") {
      const ms = raw > 1e12 ? raw : raw * 1000;
      return new Date(ms).toISOString();
    }
    return String(raw);
  };
  const dates = history.map(toIso).filter(Boolean);
  return {
    points: history.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    sample: history.slice(0, 3)
  };
}
function getVariants(card) {
  if (Array.isArray(card.variants)) return card.variants;
  if (Array.isArray(card.prices)) return card.prices;
  if (card.variant) return [card.variant];
  return [];
}
async function probeCard(number) {
  const url = new URL(BASE_URL);
  url.searchParams.set("game", GAME);
  url.searchParams.set("number", number);
  url.searchParams.set("include_price_history", "true");
  url.searchParams.set("priceHistoryDuration", "30d");
  url.searchParams.set("include_null_prices", "true");
  const res = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      "accept": "application/json"
    }
  });
  if (!res.ok) {
    const body = await res.text();
    return {
      number,
      ok: false,
      status: res.status,
      error: body.slice(0, 500)
    };
  }
  const json = await res.json();
  const cards = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  const cardSummaries = cards.map((card) => {
    const variants = getVariants(card);
    const variantSummaries = variants.map((variant) => {
      const history =
        variant.priceHistory ||
        variant.price_history ||
        card.priceHistory ||
        card.price_history ||
        [];
      return {
        variantId: variant.id || variant.variantId || variant.sku || null,
        condition: variant.condition || null,
        printing: variant.printing || null,
        marketPrice:
          variant.marketPrice ??
          variant.market_price ??
          variant.price ??
          variant.priceUsd ??
          null,
        history: summarizeHistory(history)
      };
    });
    return {
      cardId: card.id || null,
      name: card.name || null,
      number: card.number || number,
      set: card.set || card.set_name || card.setName || null,
      variantsFound: variants.length,
      variants: variantSummaries
    };
  });
  return {
    number,
    ok: true,
    cardsFound: cards.length,
    cards: cardSummaries
  };
}
async function main() {
  console.log("Probing JustTCG DBFW price history...");
  console.log(`Game: ${GAME}`);
  console.log(`Cards: ${targets.join(", ")}`);
  console.log("");
  const results = [];
  for (const number of targets) {
    const result = await probeCard(number);
    results.push(result);
    console.log("=".repeat(80));
    console.log(JSON.stringify(result, null, 2));
    // Free tier is 10 requests/min. Keep it conservative.
    await new Promise((resolve) => setTimeout(resolve, 7000));
  }
  const totalVariants = results
    .flatMap((r) => r.cards || [])
    .flatMap((c) => c.variants || []).length;
  const variantsWithHistory = results
    .flatMap((r) => r.cards || [])
    .flatMap((c) => c.variants || [])
    .filter((v) => v.history.points > 0).length;
  const maxHistoryPoints = Math.max(
    0,
    ...results
      .flatMap((r) => r.cards || [])
      .flatMap((c) => c.variants || [])
      .map((v) => v.history.points)
  );
  console.log("");
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log({
    cardsProbed: targets.length,
    totalVariants,
    variantsWithHistory,
    maxHistoryPoints,
    usableForSparklines: variantsWithHistory > 0 && maxHistoryPoints >= 7,
    verdict:
      variantsWithHistory === 0
        ? "No usable history returned. Keep collecting weekly snapshots."
        : maxHistoryPoints < 7
          ? "Some history exists, but not enough for meaningful sparklines yet."
          : "History appears usable. Replace synthetic sparklines for cards with real history."
  });
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
