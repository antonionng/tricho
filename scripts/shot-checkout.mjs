import { chromium } from "playwright";
import fs from "fs";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/shot-checkout.mjs <url>");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/checkout-result.png",
  fullPage: true,
});
const text = await page.locator("body").innerText();
fs.writeFileSync(
  "/opt/cursor/artifacts/checkout-snippet.txt",
  text.slice(0, 1000)
);
console.log(
  JSON.stringify({
    ok: /£12|12\.00|GBP|Subscribe|Experrt|Membership/i.test(text),
    snippet: text.slice(0, 400),
  })
);
await browser.close();
