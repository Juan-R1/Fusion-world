// scripts/scrape-official-fw.js
// Usage:
//   node scripts/scrape-official-fw.js           → scrapes all 9 sets
//   node scripts/scrape-official-fw.js FB01 FB02  → scrapes specific sets (resume-friendly)
//
// Requirements:
//   npm install --no-save playwright
//   npx playwright install chromium --with-deps

import fs   from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const OUTPUT_DIR = path.resolve("./scripts/official-card-db");
const DEBUG_DIR  = path.resolve("./scripts/debug");

const SETS = {
  FB01: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583001&search=true" },
  FB02: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583002&search=true" },
  FB03: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583003&search=true" },
  FB04: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583004&search=true" },
  FB05: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583005&search=true" },
  FB06: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583006&search=true" },
  FB07: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583007&search=true" },
  FB08: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583008&search=true" },
  FB09: { url: "https://www.dbs-cardgame.com/fw/en/cardlist/?category%5B0%5D=583009&search=true" },
};

// ── Text / value normalizers ──────────────────────────────────────────────────

function cleanText(v) {
  return (v || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeRarity(v) {
  const s = cleanText(v).toUpperCase();
  if (["L","C","UC","R","SR","SCR","SPR"].includes(s)) return s;
  if (s.includes("LEADER"))   return "L";
  if (s.includes("UNCOMMON")) return "UC";
  if (s.includes("COMMON"))   return "C";
  if (s.includes("SUPER RARE"))  return "SR";
  if (s.includes("SECRET RARE")) return "SCR";
  if (s.includes("SPECIAL"))     return "SPR";
  if (s.includes("RARE"))        return "R";
  return s || "C";
}
function normalizeType(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes("leader")) return "Leader";
  if (s.includes("battle")) return "Battle";
  if (s.includes("extra"))  return "Extra";
  return cleanText(v) || "Battle";
}
function normalizeColor(v) {
  const s = cleanText(v).toLowerCase();
  const map = { red:"Red", blue:"Blue", green:"Green", yellow:"Yellow", black:"Black", purple:"Purple" };
  return map[s] || cleanText(v) || "Red";
}
function splitCharacter(name, type) {
  if (type === "Extra") return null;
  // Name format is usually "Character — Art Title"; take the part before " — " or " - "
  const sep = name?.match(/\s[—\-]\s/);
  return sep ? name.slice(0, sep.index).trim() : (name || null);
}

// ── Scroll helper — flush lazy-loaded content ─────────────────────────────────

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let lastH = 0;
      const id = setInterval(() => {
        window.scrollBy(0, 600);
        const h = document.body.scrollHeight;
        if (h === lastH) { clearInterval(id); resolve(); }
        lastH = h;
      }, 300);
      setTimeout(() => { clearInterval(id); resolve(); }, 20000); // max 20s
    });
  });
  // Scroll back to top so element positions are stable
  await page.evaluate(() => window.scrollTo(0, 0));
}

// ── Debug dump — saves HTML + screenshot when card detection fails ─────────────

async function saveDebugDump(page, setCode) {
  await fs.mkdir(DEBUG_DIR, { recursive: true });
  const html = await page.content();
  const htmlPath = path.join(DEBUG_DIR, `${setCode}.html`);
  const imgPath  = path.join(DEBUG_DIR, `${setCode}.png`);
  await fs.writeFile(htmlPath, html, "utf8");
  await page.screenshot({ path: imgPath, fullPage: true });
  console.error(`  DEBUG: saved ${htmlPath} and ${imgPath}`);
  console.error(`  Open ${htmlPath} in your browser, find a card link, and paste its HTML here.`);
}

// ── Multi-strategy card link extractor ───────────────────────────────────────
// Returns: [{code, name, href}]

async function getCardLinks(page, setCode) {
  // Log how many total anchors exist for debugging
  const totalAnchors = await page.evaluate(() => document.querySelectorAll("a[href]").length);
  console.log(`  ${setCode}: ${totalAnchors} total anchor tags found on page`);

  const links = await page.evaluate((prefix) => {
    const seen  = new Map();
    const code  = new RegExp(`(${prefix}-\\d{3})`, "i");
    const named = new RegExp(`(${prefix}-\\d{3})\\s+(.+)`, "i");

    // ── Strategy 1 (original): anchor text contains "FB01-001 Name", href has /cardlist/card/
    for (const a of document.querySelectorAll("a[href]")) {
      const text = cleanText(a.innerText || a.getAttribute("aria-label") || "");
      const href = a.href || "";
      const m = text.match(named);
      if (m && href.includes("/cardlist/card/") && !seen.has(m[1].toUpperCase())) {
        seen.set(m[1].toUpperCase(), { code: m[1].toUpperCase(), name: m[2].trim(), href });
      }
    }
    if (seen.size > 0) return { strategy: 1, links: [...seen.values()] };

    // ── Strategy 2 (original fallback): href contains FB01-001 and /cardlist/card/
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.href || "";
      const m = href.match(code);
      if (href.includes("/cardlist/card/") && m && !seen.has(m[1].toUpperCase())) {
        seen.set(m[1].toUpperCase(), { code: m[1].toUpperCase(), name: null, href });
      }
    }
    if (seen.size > 0) return { strategy: 2, links: [...seen.values()] };

    // ── Strategy 3: href contains FB01-001 in ANY link (URL pattern may have changed)
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.href || "";
      const m = href.match(code);
      if (m && !seen.has(m[1].toUpperCase())) {
        seen.set(m[1].toUpperCase(), { code: m[1].toUpperCase(), name: null, href });
      }
    }
    if (seen.size > 0) return { strategy: 3, links: [...seen.values()] };

    // ── Strategy 4: any element whose text contains FB01-001 (data attrs, spans, etc.)
    for (const el of document.querySelectorAll("*")) {
      const text = cleanText(el.innerText || el.textContent || "");
      const m = text.match(new RegExp(`^(${prefix}-\\d{3})$`));
      if (!m) continue;
      // Walk up to find a parent <a> or sibling link
      let node = el;
      let link = null;
      for (let i = 0; i < 6; i++) {
        if (!node) break;
        if (node.tagName === "A" && node.href) { link = node; break; }
        const a = node.querySelector?.("a[href]");
        if (a) { link = a; break; }
        node = node.parentElement;
      }
      const cardCode = m[1].toUpperCase();
      if (!seen.has(cardCode)) {
        seen.set(cardCode, { code: cardCode, name: null, href: link?.href || "" });
      }
    }
    if (seen.size > 0) return { strategy: 4, links: [...seen.values()] };

    // ── Strategy 5: scan all text nodes for card code pattern, take nearest link href
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = (node.textContent || "").trim();
      const m = text.match(code);
      if (!m) continue;
      const cardCode = m[1].toUpperCase();
      if (seen.has(cardCode)) continue;
      let el = node.parentElement;
      let link = null;
      for (let i = 0; i < 8; i++) {
        if (!el) break;
        if (el.tagName === "A" && el.href) { link = el; break; }
        const a = el.querySelector?.("a[href]");
        if (a) { link = a; break; }
        el = el.parentElement;
      }
      seen.set(cardCode, { code: cardCode, name: null, href: link?.href || "" });
    }
    if (seen.size > 0) return { strategy: 5, links: [...seen.values()] };

    return { strategy: 0, links: [] };

    function cleanText(v) {
      return (v || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    }
  }, setCode);

  if (links.links.length > 0) {
    console.log(`  ${setCode}: found ${links.links.length} card links via strategy ${links.strategy}`);
  }
  return links.links.sort((a, b) => a.code.localeCompare(b.code));
}

// ── Card detail scraper ───────────────────────────────────────────────────────

async function extractLabelValueBlock(page) {
  const pairs = await page.evaluate(() => {
    const out = [];
    const els = Array.from(document.querySelectorAll("body *"));
    for (let i = 0; i < els.length - 1; i++) {
      const a = (els[i].innerText || "").trim();
      const b = (els[i + 1].innerText || "").trim();
      if (/^(Title|Color|Rarity|Card\s*type|Features?|Trait|Source|Cost|Power|Combo\s*Power)$/i.test(a))
        out.push([a, b]);
    }
    return out;
  });
  const map = {};
  for (const [k, v] of pairs)
    map[cleanText(k).toLowerCase()] = cleanText(v);
  return map;
}

async function scrapeCardDetail(context, card) {
  if (!card.href) {
    console.warn(`  WARN: no href for ${card.code} — skipping detail page`);
    return { code: card.code, name: card.name || card.code, character: null, rarity: "C", color: "Red", type: "Battle", trait: null };
  }

  const page = await context.newPage();
  try {
    await page.goto(card.href, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const header = cleanText(
      await page.locator("h1").first().innerText().catch(() => `${card.code} ${card.name || ""}`)
    );
    const labelMap = await extractLabelValueBlock(page);

    const title = card.name ||
      cleanText(header.replace(new RegExp(`^${card.code}\\s*`), "")) ||
      card.code;

    const rarity = normalizeRarity(labelMap["rarity"] || "");
    const color  = normalizeColor(labelMap["color"] || "");
    const type   = normalizeType(labelMap["card type"] || labelMap["cardtype"] || "");
    const trait  = cleanText(
      labelMap["features"] || labelMap["feature"] || labelMap["trait"] || ""
    ) || null;

    return {
      code: card.code,
      name: title,
      character: splitCharacter(title, type),
      rarity, color, type, trait,
    };
  } finally {
    await page.close();
  }
}

// ── Set scraper ───────────────────────────────────────────────────────────────

async function scrapeSet(browser, setCode, config) {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  console.log(`  Loading ${config.url}`);
  await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 90000 });

  // Accept cookie banner if present
  for (const label of ["Accept", "Accept All", "Accept Cookies", "OK", "同意"]) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click().catch(() => {});
      console.log(`  Accepted cookie banner ("${label}")`);
      break;
    }
  }

  // Wait for page to settle, then scroll to flush lazy-loaded cards
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log(`  Scrolling page to flush lazy-loaded content...`);
  await scrollToBottom(page);
  await page.waitForTimeout(1000);

  // Try to find card links
  const cards = await getCardLinks(page, setCode);

  if (!cards.length) {
    console.error(`  ERROR: No card links found for ${setCode}.`);
    await saveDebugDump(page, setCode);
    await context.close();
    throw new Error(
      `No card links found for ${setCode}. ` +
      `Debug files saved to scripts/debug/${setCode}.html and .png. ` +
      `Open the HTML file, find a card link, and paste its HTML to Claude for a selector fix.`
    );
  }

  console.log(`  ${setCode}: scraping ${cards.length} card detail pages...`);
  const results = [];
  for (const card of cards) {
    const row = await scrapeCardDetail(context, card);
    results.push(row);
    process.stdout.write(`    ${row.code}  ${row.name}\n`);
    await page.waitForTimeout(300); // polite delay between detail pages
  }

  await context.close();
  return results.sort((a, b) => a.code.localeCompare(b.code));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const setsToScrape = process.argv.slice(2).length
    ? Object.fromEntries(Object.entries(SETS).filter(([k]) => process.argv.slice(2).includes(k)))
    : SETS;

  console.log(`Scraping sets: ${Object.keys(setsToScrape).join(", ")}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const [setCode, config] of Object.entries(setsToScrape)) {
      console.log(`\n── ${setCode} ──`);
      try {
        const rows = await scrapeSet(browser, setCode, config);
        const outFile = path.join(OUTPUT_DIR, `${setCode}.json`);
        await fs.writeFile(outFile, JSON.stringify(rows, null, 2), "utf8");
        console.log(`  Saved ${rows.length} cards → ${outFile}`);
      } catch (err) {
        console.error(`  FAILED: ${err.message}`);
        console.error(`  Skipping ${setCode} — run "node scripts/scrape-official-fw.js ${setCode}" to retry after fixing selectors.`);
      }
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log("\n── Summary ──");
  for (const setCode of Object.keys(setsToScrape)) {
    const f = path.join(OUTPUT_DIR, `${setCode}.json`);
    try {
      const data = JSON.parse(await fs.readFile(f, "utf8"));
      console.log(`  ${setCode}: ${data.length} cards`);
    } catch {
      console.log(`  ${setCode}: MISSING (failed)`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
