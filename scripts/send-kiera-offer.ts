/**
 * Sends the Kiera SI member offer email (src/lib/mail/templates/kiera.ts).
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-kiera-offer.ts --to you@example.com
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-kiera-offer.ts --all            # dry run: lists recipients
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-kiera-offer.ts --all --send     # sends to every active member
 *   ... --everyone [--send]   every account in good standing, free or paid, instead of members only
 *
 * Images are loaded from the live site (public/partners/kiera). Add --inline to attach them to the
 * email instead, so they show before the files are deployed and where remote images are blocked.
 * --assets <dir> reads the inline images from another folder (e.g. placeholder stills), and a
 * missing .gif falls back to a .png, .jpg or .webp of the same name.
 * Members who have left the "updates" list are skipped, and every email carries an unsubscribe link.
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
config({ path: process.env.ENV_FILE || ".env.local" });

const args = process.argv.slice(2);
const to = args[args.indexOf("--to") + 1];
const everyone = args.includes("--everyone");
const all = args.includes("--all") || everyone;
const send = args.includes("--send");
const inlineImages = args.includes("--inline");
const assetsArg = args.indexOf("--assets") >= 0 ? args[args.indexOf("--assets") + 1] : null;

const ASSETS = assetsArg ? path.resolve(assetsArg) : path.join(process.cwd(), "public/partners/kiera");
const TYPES: Record<string, string> = { ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function main() {
  if (!process.env.NEXT_PUBLIC_SITE_URL) throw new Error("Set NEXT_PUBLIC_SITE_URL so links point at the live site, not localhost.");
  const { deliver } = await import("../src/lib/mail/send");
  const { kieraOfferEmail, kieraImageSrc, KIERA_IMAGES } = await import("../src/lib/mail/templates/kiera");
  type Key = keyof typeof KIERA_IMAGES;

  // With --inline, every image that exists locally is attached and referenced by cid; the rest stay remote.
  const attachments = inlineImages
    ? (Object.keys(KIERA_IMAGES) as Key[]).flatMap((key) => {
        const base = KIERA_IMAGES[key].file.replace(/\.[a-z]+$/, "");
        const candidates = [KIERA_IMAGES[key].file, ...[".png", ".jpg", ".webp"].map((ext) => base + ext)];
        const file = candidates.find((f) => existsSync(path.join(ASSETS, f)));
        if (!file) return [];
        return [{ key, filename: file, content: readFileSync(path.join(ASSETS, file)).toString("base64"), contentType: TYPES[path.extname(file)], contentId: `kiera-${key}` }];
      })
    : [];
  const inlined = new Set(attachments.map((a) => a.key));
  const src = (key: Key) => (inlined.has(key) ? `cid:kiera-${key}` : kieraImageSrc(key));
  if (inlineImages) {
    const kb = Math.round(attachments.reduce((n, a) => n + Buffer.from(a.content, "base64").length, 0) / 1024);
    console.log(`Attaching ${attachments.length} images inline (${kb} KB): ${attachments.map((a) => a.filename).join(", ")}`);
    const missing = (Object.keys(KIERA_IMAGES) as Key[]).filter((k) => !inlined.has(k));
    if (missing.length) console.log(`Not yet in public/partners/kiera, so loaded from the live site: ${missing.map((k) => KIERA_IMAGES[k].file).join(", ")}`);
  }
  const opts = { list: "updates" as const, attachments };

  if (args.includes("--to") && to) {
    const { prisma } = await import("../src/lib/prisma");
    const user = await prisma.user.findUnique({ where: { email: to.toLowerCase() }, select: { name: true } });
    const email = kieraOfferEmail(user?.name, src);
    const ok = await deliver(to, `[Preview] ${email.subject}`, email.content, { ...opts, tag: "kiera-offer-preview" });
    console.log(ok ? `Sent preview to ${to}` : `Not sent to ${to} (left the updates list, or sending failed)`);
    return;
  }

  if (all) {
    const { activeMemberRecipients, everyoneRecipients } = await import("../src/lib/member-recipients");
    const recipients = everyone ? await everyoneRecipients() : await activeMemberRecipients();
    console.log(`${recipients.length} ${everyone ? "accounts in good standing, free and paid" : "active members"}`);
    if (!send) {
      for (const r of recipients) console.log(`  ${r.email}${r.name ? `  (${r.name})` : ""}`);
      console.log("\nDry run. Add --send to send.");
      return;
    }
    let sent = 0;
    for (const r of recipients) {
      const email = kieraOfferEmail(r.name, src);
      if (await deliver(r.email, email.subject, email.content, { ...opts, tag: "kiera-offer" })) sent++;
      else console.log(`  skipped ${r.email}`);
    }
    console.log(`Sent ${sent} of ${recipients.length}`);
    return;
  }

  console.log("Usage: --to someone@example.com | --all [--send] | --everyone [--send]   (add --inline to attach images)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 500));
