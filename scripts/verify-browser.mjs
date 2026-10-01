import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const SHOTS = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function note(flow, status, detail = "") {
  results.push({ flow, status, detail });
  console.log(`[${status}] ${flow}${detail ? " — " + detail : ""}`);
}

async function shot(page, name) {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Home
  await page.goto(BASE, { waitUntil: "networkidle" });
  const homeText = await page.locator("body").innerText();
  const nav = await page.locator("nav, header").first().innerText().catch(() => "");
  const hasFind = /Find someone/i.test(homeText);
  const hasMembership = /Membership|£12|Become a member|Join/i.test(homeText);
  const hasTricho = /Tricho-AI/i.test(homeText);
  const badNav = /Gazette|Podcast|Events/i.test(nav);
  await shot(page, "home.png");
  note(
    "marketing-home",
    hasFind && hasMembership && hasTricho && !badNav ? "PASS" : "FAIL",
    `find=${hasFind} membership=${hasMembership} tricho=${hasTricho} badNav=${badNav}`
  );

  // 2. Find
  await page.goto(`${BASE}/find`, { waitUntil: "networkidle" });
  const findText = await page.locator("body").innerText();
  const findOk =
    /stylist|trichologist|doctor/i.test(findText) &&
    /directory/i.test(findText);
  await shot(page, "find.png");
  note("find-guide", findOk ? "PASS" : "FAIL");

  // 3. Directory list form
  await page.goto(`${BASE}/directory/list`, { waitUntil: "networkidle" });
  const listCopy = await page.locator("body").innerText();
  const freeNotMember = /not membership|does not open membership|no account/i.test(listCopy);
  const email = `verify+browser-${Date.now()}@example.com`;
  await page.fill('input[name="name"]', "Browser Verify Clinician");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="city"]', "Bristol");
  await page.selectOption('select[name="profession"]', "clinical").catch(async () => {
    // radio or buttons
    const clinical = page.locator('input[name="profession"][value="clinical"]');
    if (await clinical.count()) await clinical.check();
  });
  await page.fill('input[name="specialization"]', "Scalp health");
  await page.fill('textarea[name="bio"]', "Browser verification listing for clinical practice.");
  await page.fill('input[name="website"]', "https://example.com/browser");
  await page.fill('input[name="phone"]', "+441170000000");
  await Promise.all([
    page.waitForURL(/submitted=1/, { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  const successText = await page.locator("body").innerText();
  const submitted = /Thanks|review/i.test(successText);
  await shot(page, "list-submitted.png");
  note(
    "free-listing-submit",
    freeNotMember && submitted ? "PASS" : "FAIL",
    `email=${email} freeCopy=${freeNotMember} submitted=${submitted}`
  );

  // 4. Directory before (may already have listed items)
  await page.goto(`${BASE}/directory`, { waitUntil: "networkidle" });
  const dirBefore = await page.locator("body").innerText();
  const hasListCta = /List your practice/i.test(dirBefore);
  await shot(page, "directory-before.png");
  note("directory-honesty", hasListCta ? "PASS" : "FAIL", `listCta=${hasListCta}`);

  // 5. Dev login as HQ admin
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "hq@trichollective.com");
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.count()) await nameInput.fill("Trichollective HQ");
  await Promise.all([
    page.waitForURL(/\/members/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await shot(page, "members-home.png");
  const membersText = await page.locator("body").innerText();
  const feedOk = /Share a case|composer|Start here|Useful|Comment|Everyone|Clinical/i.test(
    membersText
  );
  note("member-home-feed", feedOk ? "PASS" : "FAIL");

  // 6. Admin approve
  await page.goto(`${BASE}/admin/listings`, { waitUntil: "networkidle" });
  await shot(page, "admin-listings.png");
  const adminText = await page.locator("body").innerText();
  if (/Admin access required|Sign in/i.test(adminText) && !/Pending/i.test(adminText)) {
    note("admin-listings", "FAIL", "not admin or redirected");
  } else {
    const approveButtons = page.locator('button:has-text("Approve")');
    const count = await approveButtons.count();
    for (let i = 0; i < count; i++) {
      // Always click the first remaining Approve
      const btn = page.locator('button:has-text("Approve")').first();
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(800);
      }
    }
    note("admin-listings", "PASS", `approved=${count}`);
  }

  // 7. Directory after approve
  await page.goto(`${BASE}/directory`, { waitUntil: "networkidle" });
  const dirAfter = await page.locator("body").innerText();
  const showsListed =
    /Browser Verify Clinician|Aisha Okonkwo/i.test(dirAfter) && /Listed/i.test(dirAfter);
  const phoneHidden = !/\+44117|\+44161/.test(dirAfter);
  await shot(page, "directory-listed.png");
  note(
    "directory-listed",
    showsListed && phoneHidden ? "PASS" : "FAIL",
    `showsListed=${showsListed} phoneHidden=${phoneHidden}`
  );

  // 8. Rooms / Learn / Exchange / Billing
  await page.goto(`${BASE}/members/community`, { waitUntil: "networkidle" });
  const roomsText = await page.locator("body").innerText();
  const roomsOk = /Everyone|Cosmetic|Clinical|Medical/i.test(roomsText);
  await shot(page, "members-rooms.png");
  note("rooms", roomsOk ? "PASS" : "FAIL");

  await page.goto(`${BASE}/members/learn`, { waitUntil: "networkidle" });
  const learnText = await page.locator("body").innerText();
  const learnOk = /How this network refers|first-consult|Learn/i.test(learnText);
  await shot(page, "members-learn.png");
  note("learn", learnOk ? "PASS" : "FAIL");

  // open first learn piece if link exists
  const learnLink = page.locator('a[href^="/members/learn/"]').first();
  if (await learnLink.count()) {
    await learnLink.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "members-learn-piece.png");
    const piece = await page.locator("body").innerText();
    note(
      "learn-piece",
      /Ask Tricho-AI|Tricho-AI/i.test(piece) || piece.length > 200 ? "PASS" : "FAIL"
    );
  } else {
    note("learn-piece", "FAIL", "no piece links");
  }

  await page.goto(`${BASE}/members/exchange`, { waitUntil: "networkidle" });
  const exchangeText = await page.locator("body").innerText();
  note("exchange", /Exchange|referral|consult/i.test(exchangeText) ? "PASS" : "FAIL");

  await page.goto(`${BASE}/members/billing`, { waitUntil: "networkidle" });
  const billingText = await page.locator("body").innerText();
  note(
    "billing",
    /Billing|Manage|cancel|plan|Stripe|membership/i.test(billingText) ? "PASS" : "FAIL"
  );

  // 9. Join + checkout
  await page.goto(`${BASE}/join`, { waitUntil: "networkidle" });
  const joinText = await page.locator("body").innerText();
  const joinOk = /£12|150|3,?500|Business/i.test(joinText);
  await shot(page, "join.png");
  note("join-page", joinOk ? "PASS" : "FAIL");

  // Try checkout via fetch with cookies
  const priceId = process.env.STRIPE_PRICE_ID_MEMBER;
  let checkoutDetail = "no price id in env for script";
  let checkoutStatus = "FAIL";
  if (priceId) {
    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await page.request.post(`${BASE}/api/checkout`, {
      data: { priceId, profession: "clinical" },
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    });
    const status = res.status();
    let body = "";
    try {
      body = await res.text();
    } catch {}
    let url = "";
    try {
      url = JSON.parse(body).url || "";
    } catch {}
    if (status === 200 && /checkout\.stripe\.com/i.test(url)) {
      checkoutStatus = "PASS";
      checkoutDetail = url.slice(0, 80);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      await shot(page, "checkout-result.png");
    } else {
      checkoutDetail = `status=${status} body=${body.slice(0, 200)}`;
      await shot(page, "checkout-result.png");
    }
  }
  note("stripe-checkout", checkoutStatus, checkoutDetail);

  await browser.close();

  const failed = results.filter((r) => r.status === "FAIL");
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  fs.writeFileSync(
    "/opt/cursor/artifacts/verify-report.json",
    JSON.stringify({ results, failed: failed.length }, null, 2)
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
