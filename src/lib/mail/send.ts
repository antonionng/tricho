import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { absoluteUrl, renderEmail, type EmailContent } from "./layout";

/**
 * Email lists a person can leave. Transactional email (sign-in links, receipts,
 * replies to something they did) is always sent and has no list.
 *  - updates: the newsletter and announcements of new Trichozette editions, courses and events
 *  - activity: replies, messages and enquiries from inside the platform
 */
export type EmailList = "updates" | "activity";

function secret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-email-secret";
}

export function unsubscribeToken(email: string, list: EmailList) {
  return createHmac("sha256", secret()).update(`${email.toLowerCase()}:${list}`).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, list: EmailList, token: string) {
  const a = Buffer.from(unsubscribeToken(email, list));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function unsubscribeQuery(email: string, list: EmailList) {
  return new URLSearchParams({ e: email.toLowerCase(), l: list, t: unsubscribeToken(email, list) });
}

/** The link in the footer: a page that explains and asks the person to confirm. */
export function unsubscribeUrl(email: string, list: EmailList) {
  return absoluteUrl(`/email/unsubscribe?${unsubscribeQuery(email, list)}`);
}

/**
 * The List-Unsubscribe header URL. Mail apps POST to it for one-click
 * unsubscribe (RFC 8058), so it points at the API route, not the page.
 */
export function oneClickUnsubscribeUrl(email: string, list: EmailList) {
  return absoluteUrl(`/api/email/unsubscribe?${unsubscribeQuery(email, list)}`);
}

export function isEmailList(value: unknown): value is EmailList {
  return value === "updates" || value === "activity";
}

/** Whether this address still wants a list. Unknown addresses are treated as subscribed. */
export async function wantsList(email: string, list: EmailList) {
  const e = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: e }, select: { emailUpdates: true, emailActivity: true } });
  if (list === "activity") return user?.emailActivity ?? true;
  if (user && !user.emailUpdates) return false;
  const sub = await prisma.subscriber.findUnique({ where: { email: e }, select: { unsubscribedAt: true } });
  return !sub?.unsubscribedAt;
}

export async function leaveList(email: string, list: EmailList) {
  const e = email.toLowerCase();
  if (list === "activity") {
    await prisma.user.updateMany({ where: { email: e }, data: { emailActivity: false } });
    return;
  }
  await prisma.user.updateMany({ where: { email: e }, data: { emailUpdates: false } });
  await prisma.subscriber.updateMany({ where: { email: e, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
}

export type DeliverOptions = {
  /** Set for anything optional; the person is skipped if they've left the list. */
  list?: EmailList;
  replyTo?: string;
  tag?: string;
};

/**
 * Render a branded email and send it. Never throws: an email failing must
 * never break the sign-up, payment or form that triggered it.
 */
export async function deliver(to: string, subject: string, content: EmailContent, opts: DeliverOptions = {}) {
  try {
    if (!to || !to.includes("@")) return false;
    if (opts.list && !(await wantsList(to, opts.list))) return false;
    const unsub = opts.list ? unsubscribeUrl(to, opts.list) : undefined;
    const oneClick = opts.list ? oneClickUnsubscribeUrl(to, opts.list) : undefined;
    const { html, text } = renderEmail({ ...content, unsubscribeUrl: content.unsubscribeUrl ?? unsub });
    await sendEmail({ to, subject, html, text, replyTo: opts.replyTo, unsubscribeUrl: oneClick, tag: opts.tag });
    return true;
  } catch (err) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

/** The platform owners, who get every alert. Comma-separated OWNER_EMAILS. */
export function ownerEmails() {
  return (process.env.OWNER_EMAILS || "ag@experrt.com,karley@trichollective.net")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export type OwnerAlert = {
  subject: string;
  heading: string;
  body?: string;
  facts?: [string, string][];
  cta?: { label: string; href: string };
  /** Replies go straight to the person, so an owner can answer from their inbox. */
  replyTo?: string;
};

/** How an owner alert looks, shared by alertOwners and the Studio email previews. */
export function ownerAlertContent(a: OwnerAlert): EmailContent {
  return {
    preheader: a.heading,
    eyebrow: "Studio alert",
    heading: a.heading,
    body: a.body ?? "",
    facts: a.facts,
    cta: a.cta,
    signoff: null,
    reason: "You receive this because you own Trichollective. Change who gets alerts with the OWNER_EMAILS setting.",
  };
}

/** Tell the owners something happened. Sent to each owner separately; never throws. */
export async function alertOwners(a: OwnerAlert) {
  const content = ownerAlertContent(a);
  await Promise.all(
    ownerEmails().map((o) => deliver(o, `[Trichollective] ${a.subject}`, content, { replyTo: a.replyTo, tag: "owner-alert" }))
  );
}

/**
 * Send at most once per ref (e.g. "event-reminder:{eventId}:{userId}").
 * The ref is claimed first, so two overlapping runs can't both send.
 */
export async function deliverOnce(ref: string, to: string, subject: string, content: EmailContent, opts: DeliverOptions = {}) {
  try {
    await prisma.emailLog.create({ data: { ref, to: to.toLowerCase() } });
  } catch {
    return false; // already sent
  }
  const sent = await deliver(to, subject, content, opts);
  if (!sent) await prisma.emailLog.deleteMany({ where: { ref } }).catch(() => {});
  return sent;
}
