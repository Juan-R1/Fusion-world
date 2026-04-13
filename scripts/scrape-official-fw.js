// scripts/scrape-official-fw.js
// npm i playwright
// npx playwright install chromium
// node scripts/scrape-official-fw.js

import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const OUTPUT_DIR = path.resolve("./scripts/official-card-db");

const SETS = {
  FB01: {
    label: "BOOSTER PACK -AWAKENED PULSE- [FB01]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583001&search=true",
  },
  FB02: {
    label: "BOOSTER PACK -BLAZING AURA- [FB02]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583002&search=true",
  },
  FB03: {
    label: "BOOSTER PACK -RAGING ROAR- [FB03]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583003&search=true",
  },
  FB04: {
    label: "BOOSTER PACK -ULTRA LIMIT- [FB04]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583004&search=true",
  },
  FB05: {
    label: "BOOSTER PACK -NEW ADVENTURE- [FB05]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583005&search=true",
  },
  FB06: {
    label: "BOOSTER PACK -RIVALS CLASH- [FB06]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583006&search=true",
  },
  FB07: {
    label: "BOOSTER PACK -WISH FOR SHENRON- [FB07]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583007&search=true",
  },
  FB08: {
    label: "BOOSTER PACK -SAIYAN'S PRIDE- [FB08]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583008&search=true",
  },
  FB09: {
    label: "BOOSTER PACK -DUAL EVOLUTION- [FB09]",
    url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583009&search=true",
  },
};

function cleanText(v) {
  return (v || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRarity(v) {
  const s = cleanText(v).toUpperCase();
  if (["L", "C", "UC", "R", "SR", "SCR", "SPR"].includes(s)) return s;
  if (s.includes("LEADER")) return "L";
  if (s.includes("COMMON")) return "C";
  if (s.includes("UNCOMMON")) return "UC";
  if (s.includes("SUPER RARE")) return "SR";
  if (s.includes("SECRET RARE")) return "SCR";
  if (s.includes("SPECIAL REPRINT") || s.includes("SPECIAL RARE")) return "SPR";
  return s;
}

function normalizeType(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes("leader")) return "Leader";
  if (s.includes("battle")) return "Battle";
  if (s.includes("extra")) return "Extra";
  return cleanText(v);
}

function normalizeColor(v) {
  const s = cleanText(v);
  const map = {
    red: "Red",
    blue: "Blue",
    green: "Green",
    yellow: "Yellow",
    black: "Black",
    purple: "Purple",
  };
  return map[s.toLowerCase()] || s;
}

function splitCharacter(name, type) {
  if (type === "Extra") return null;
  return name || null;
}

async function extractLabelValueBlock(page) {
  const pairs = await page.evaluate(() => {
    const out = [];
    const textNodes = Array.from(document.querySelectorAll("body *"))
      .map((el) => el.innerText?.trim())
      .filter(Boolean);

    for (let i = 0; i < textNodes.length - 1; i++) {
      const a = textNodes[i];
      const b = textNodes[i + 1];
      if (
        /^(Title|Color|Rarity|Card type|Features|Feature|Trait|Source|Cost|Power|Combo Power)$/i.test(a)
      ) {
        out.push([a, b]);
      }
    }
    return out;
  });

  const map = {};
  for (const [k, v] of pairs) {
    map[cleanText(k).toLowerCase()] = cleanText(v);
  }
  return map;
}

async function getCardLinks(page, setCode) {
  const links = await page.evaluate((prefix) => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const seen = new Map();

    for (const a of anchors) {
      const text = (a.innerText || a.getAttribute("aria-label") || "").trim();
      const href = a.href || "";
      const m = text.match(new RegExp(`(${prefix}-\\d{3})\\s+(.+)`));
      if (m && href.includes("/cardlist/card/")) {
        if (!seen.has(m[1])) {
          seen.set(m[1], { code: m[1], name: m[2].trim(), href });
        }
      }
    }

    if (seen.size === 0) {
      for (const a of anchors) {
        const href = a.href || "";
        const m = href.match(new RegExp(`(${prefix}-\\d{3})`, "i"));
        if (href.includes("/cardlist/card/") && m && !seen.has(m[1].toUpperCase())) {
          seen.set(m[1].toUpperCase(), { code: m[1].toUpperCase(), name: null, href });
        }
      }
    }

    return Array.from(seen.values()).sort((x, y) => x.code.localeCompare(y.code));
  }, setCode);

  return links;
}

async function scrapeCardDetail(context, card) {
  const page = await context.newPage();
  try {
    await page.goto(card.href, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const header = cleanText(
      await page.locator("h1").first().innerText().catch(() => `${card.code} ${card.name || ""}`)
    );

    const labelMap = await extractLabelValueBlock(page);

    const title =
      card.name ||
      cleanText(header.replace(new RegExp(`^${card.code}\\s*`), ""));

    const rarity = normalizeRarity(labelMap["rarity"] || "");
    const color = normalizeColor(labelMap["color"] || "");
    const type = normalizeType(labelMap["card type"] || "");
    const trait = cleanText(
      labelMap["features"] ||
      labelMap["feature"] ||
      labelMap["trait"] ||
      ""
    ) || null;

    return { code: card.code, name: title, character: splitCharacter(title, type), rarity, color, type, trait };
  } finally {
    await page.close();
  }
}

async function scrapeSet(browser, setCode, config) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  const cookieBtn = page.locator("text=Accept").first();
  if (await cookieBtn.isVisible().catch(() => false)) {
    await cookieBtn.click().catch(() => {});
  }

  const cards = await getCardLinks(page, setCode);
  if (!cards.length) {
    throw new Error(`No card links found for ${setCode}. Bandai may have changed the markup.`);
  }
  console.log(`${setCode}: found ${cards.length} card links`);

  const results = [];
  for (const card of cards) {
    const row = await scrapeCardDetail(context, card);
    results.push(row);
    process.stdout.write(`  ${row.code} ${row.name}\n`);
  }

  await context.close();
  results.sort((a, b) => a.code.localeCompare(b.code));
  return results;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const setsToScrape = process.argv.slice(2).length
    ? Object.fromEntries(Object.entries(SETS).filter(([k]) => process.argv.slice(2).includes(k)))
    : SETS;

  try {
    for (const [setCode, config] of Object.entries(setsToScrape)) {
      console.log(`\nScraping ${setCode}...`);
      const rows = await scrapeSet(browser, setCode, config);
      const outFile = path.join(OUTPUT_DIR, `${setCode}.json`);
      await fs.writeFile(outFile, JSON.stringify(rows, null, 2), "utf8");
      console.log(`Saved ${rows.length} cards → ${outFile}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
