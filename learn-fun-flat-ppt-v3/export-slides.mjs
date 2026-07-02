import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "slides");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(root, "deck.html")).href);
await page.evaluate(() => document.fonts.ready);

const slides = await page.locator(".slide").count();
for (let i = 0; i < slides; i += 1) {
  const locator = page.locator(".slide").nth(i);
  await locator.screenshot({
    path: join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`),
  });
}

await browser.close();
console.log(JSON.stringify({ slides, outDir }, null, 2));
