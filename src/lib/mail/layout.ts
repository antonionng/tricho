/**
 * The Trichollective email design. Every email, from a sign-in link to the
 * monthly newsletter, renders through renderEmail so the brand is identical
 * everywhere. Table-based, inline styles, no web fonts: it holds up in
 * Gmail, Outlook and Apple Mail, in light and dark.
 */
import { site } from "@/config/site";
import { images } from "@/content/images";

const C = {
  paper: "#f4f3f0",
  card: "#ffffff",
  ink: "#0b0b0b",
  ink2: "#3a3a3a",
  muted: "#5c5c59",
  fade: "#a3a29d",
  rule: "#e2e1dc",
};
const SANS = "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Bodoni 72',Didot,'Bodoni MT',Georgia,serif";

export type EmailImage = keyof typeof images | { src: string; alt: string };

export type EmailContent = {
  /** Shown in the inbox list after the subject. One sentence. */
  preheader: string;
  /** Small uppercase label above the heading, e.g. "Trichozette" or "Your listing". */
  eyebrow?: string;
  heading: string;
  /** House text format: blank-line paragraphs, "## " subheadings, "- " bullets. */
  body: string;
  cta?: { label: string; href: string };
  /** A quieter link under the button. */
  secondary?: { label: string; href: string };
  /** A black-and-white editorial image above the heading. */
  image?: EmailImage;
  /** Label/value rows, used by owner alerts and receipts. */
  facts?: [string, string][];
  /** Sign-off line. Defaults to "Karley and the Trichollective team". */
  signoff?: string | null;
  /** Why this person is receiving it, shown in the footer. */
  reason?: string;
  /** Present on anything that isn't strictly transactional. */
  unsubscribeUrl?: string;
};

export function absoluteUrl(href: string) {
  if (/^https?:\/\//.test(href) || href.startsWith("mailto:")) return href;
  return `${site.url.replace(/\/$/, "")}${href.startsWith("/") ? "" : "/"}${href}`;
}

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bare URLs in body text become links; everything else is escaped. */
function inline(text: string) {
  return esc(text).replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
    (url) => `<a href="${url}" style="color:${C.ink};text-decoration:underline">${url}</a>`
  );
}

export function bodyToHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("## ")) {
        return `<h2 style="font-family:${SANS};font-size:13px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${C.ink};margin:28px 0 10px">${esc(t.slice(3))}</h2>`;
      }
      const lines = t.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul style="padding-left:20px;margin:0 0 18px">${lines
          .map((l) => `<li style="margin:0 0 8px">${inline(l.trim().slice(2))}</li>`)
          .join("")}</ul>`;
      }
      return `<p style="margin:0 0 18px">${lines.map(inline).join("<br>")}</p>`;
    })
    .join("\n");
}

function imageOf(img: EmailImage) {
  const { src, alt } = typeof img === "string" ? images[img] : img;
  // Unsplash (imgix) renders black and white server-side, so the email matches the site.
  const url = src.includes("images.unsplash.com") ? `${src}?w=1120&h=640&fit=crop&crop=faces,top&auto=format&q=75&sat=-100` : src;
  return { url, alt };
}

function textVersion(c: EmailContent) {
  const parts = [c.heading, "", c.body.trim()];
  if (c.facts?.length) parts.push("", ...c.facts.map(([k, v]) => `${k}: ${v}`));
  if (c.cta) parts.push("", `${c.cta.label}: ${absoluteUrl(c.cta.href)}`);
  if (c.secondary) parts.push(`${c.secondary.label}: ${absoluteUrl(c.secondary.href)}`);
  if (c.signoff !== null) parts.push("", c.signoff ?? `${site.founder} and the Trichollective team`);
  parts.push("", "--", "Trichollective, the private home for hair and scalp professionals.", site.url);
  if (c.reason) parts.push(c.reason);
  if (c.unsubscribeUrl) parts.push(`Unsubscribe: ${c.unsubscribeUrl}`);
  return parts.join("\n");
}

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const home = absoluteUrl("/");
  const img = c.image ? imageOf(c.image) : null;
  const signoff = c.signoff === null ? "" : (c.signoff ?? `${site.founder} and the Trichollective team`);

  const facts = c.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.rule};margin:4px 0 22px">${c.facts
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.rule};font-family:${SANS};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};vertical-align:top;width:34%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${C.rule};font-family:${SANS};font-size:15px;color:${C.ink};vertical-align:top">${inline(v).replace(/\n/g, "<br>")}</td></tr>`
        )
        .join("")}</table>`
    : "";

  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px"><tr><td style="background:${C.ink};border-radius:999px"><a href="${esc(absoluteUrl(c.cta.href))}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(c.cta.label)} &rarr;</a></td></tr></table>`
    : "";
  const secondary = c.secondary
    ? `<p style="margin:14px 0 0;font-size:14px"><a href="${esc(absoluteUrl(c.secondary.href))}" style="color:${C.ink};text-decoration:underline">${esc(c.secondary.label)}</a></p>`
    : "";

  const footerLinks = [
    ["Trichozette", "/trichozette"],
    ["Directory", "/directory"],
    ["Events", "/events"],
    ["Courses", "/learn"],
  ]
    .map(([l, h]) => `<a href="${absoluteUrl(h)}" style="color:${C.ink2};text-decoration:none">${l}</a>`)
    .join(`<span style="color:${C.fade}">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(c.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(c.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 8px 22px">
  <a href="${home}" style="text-decoration:none;font-family:${SANS};font-size:24px;font-weight:800;letter-spacing:-0.06em;text-transform:uppercase;line-height:1"><span style="color:${C.ink}">Tricho</span><span style="color:${C.fade}">llective.</span></a>
</td></tr>
<tr><td style="background:${C.card};border-radius:18px;overflow:hidden">
  ${img ? `<img src="${esc(img.url)}" alt="${esc(img.alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:18px 18px 0 0">` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 36px 34px;font-family:${SANS};font-size:16px;line-height:1.65;color:${C.ink2}">
    ${c.eyebrow ? `<p style="margin:0 0 14px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:${C.muted}">${esc(c.eyebrow)}</p>` : ""}
    <h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.12;letter-spacing:-0.01em;color:${C.ink}">${esc(c.heading)}</h1>
    ${bodyToHtml(c.body)}
    ${facts}
    ${cta}
    ${secondary}
    ${signoff ? `<p style="margin:28px 0 0;color:${C.ink}">${esc(signoff)}</p>` : ""}
  </td></tr></table>
</td></tr>
<tr><td style="padding:26px 8px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted}">
  <p style="margin:0 0 10px">${footerLinks}</p>
  <p style="margin:0 0 10px">Trichollective is the private home for cosmetic, clinical and medical hair and scalp professionals, founded by ${esc(site.founderFull)}.</p>
  ${c.reason ? `<p style="margin:0 0 10px">${esc(c.reason)}</p>` : ""}
  ${c.unsubscribeUrl ? `<p style="margin:0 0 10px"><a href="${esc(c.unsubscribeUrl)}" style="color:${C.muted};text-decoration:underline">Unsubscribe or change which emails you receive</a></p>` : ""}
  <p style="margin:16px 0 0;color:${C.fade}">Designed and managed by <a href="https://experrt.com" style="color:${C.fade};text-decoration:underline">experrt.com</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { html, text: textVersion(c) };
}
