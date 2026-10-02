import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { ownerAlertContent, type OwnerAlert } from "../send";
import { clip } from "./members";

/** Emails only the owners receive: reports from the community and the daily digest. */

export function postReportedAlert(p: { reason: string; postTitle: string; reporterName: string | null }): OwnerAlert {
  return {
    subject: "A post has been reported",
    heading: "A post has been reported in the community and is waiting for you to review it.",
    body: "Reports are confidential. The member who reported it is not told what you decide, and the author is not told who reported it.",
    facts: [
      ["Reason", p.reason],
      ["Post", clip(p.postTitle, 140)],
      ["Reported by", p.reporterName || "A member"],
    ],
    cta: { label: "Review reports", href: "/studio/community" },
  };
}

export function reportEscalatedAlert(p: { reason: string; content: string; escalatedBy: string; note?: string | null }): OwnerAlert {
  return {
    subject: "A community report needs an owner",
    heading: "A moderator has escalated a community report because it needs an owner's decision.",
    body: "The content is still visible unless it was hidden separately. Please review it in Studio and decide what should happen next.",
    facts: [
      ["Reason", p.reason],
      ["Content", clip(p.content, 140)],
      ["Escalated by", p.escalatedBy],
      ...(p.note ? ([["Note", clip(p.note, 300)]] as [string, string][]) : []),
    ],
    cta: { label: "Review reports", href: "/studio/community" },
  };
}

export function verificationSubmittedAlert(p: { name: string | null; email: string; title: string }): OwnerAlert {
  return {
    subject: "A member has sent evidence for verification",
    heading: "A member has sent evidence of their training and is waiting for the verified badge.",
    body: "The document is private. Open it from the verification queue in Studio, then approve it or explain what is missing.",
    facts: [
      ["Member", p.name || "No name given"],
      ["Email", p.email],
      ["Document", clip(p.title, 140)],
    ],
    cta: { label: "Review verification", href: "/studio/verification" },
    replyTo: p.email,
  };
}

export type DigestLead = { name: string | null; email: string; source: string };

export type OwnerDigest = {
  /** "Thursday 1 October 2026" */
  dateLabel: string;
  subscribersBySource: { source: string; count: number }[];
  freeAccounts: number;
  paidByPlan: { plan: string; count: number }[];
  listingsWaiting: number;
  enquiriesDelivered: number;
  enquiriesHeld: number;
  contactMessages: number;
  partnerApplications: number;
  reportsOpen: number;
  leads: DigestLead[];
};

const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0);

export function digestIsEmpty(d: OwnerDigest) {
  return (
    sum(d.subscribersBySource) +
      d.freeAccounts +
      sum(d.paidByPlan) +
      d.listingsWaiting +
      d.enquiriesDelivered +
      d.enquiriesHeld +
      d.contactMessages +
      d.partnerApplications +
      d.reportsOpen ===
    0
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ownerDigestEmail(d: OwnerDigest): { subject: string; content: EmailContent } {
  const subscribers = sum(d.subscribersBySource);
  const paid = sum(d.paidByPlan);
  const people = subscribers + d.freeAccounts + paid;
  const toReview = d.listingsWaiting + d.reportsOpen + d.contactMessages + d.partnerApplications;

  const heading =
    people > 0
      ? `${plural(people, "new person", "new people")} joined Trichollective in the last 24 hours.`
      : "Nobody new joined in the last 24 hours, but there are things waiting for you in the Studio.";

  const facts: [string, string][] = [
    [
      "New subscribers",
      subscribers ? `${subscribers} (${d.subscribersBySource.map((s) => `${s.source} ${s.count}`).join(", ")})` : "0",
    ],
    ["New free accounts", String(d.freeAccounts)],
    ["New paid members", paid ? `${paid} (${d.paidByPlan.map((p) => `${p.plan} ${p.count}`).join(", ")})` : "0"],
    ["Listings to review", String(d.listingsWaiting)],
    ["Directory enquiries", `${d.enquiriesDelivered} delivered, ${d.enquiriesHeld} held`],
    ["Contact messages", String(d.contactMessages)],
    ["Partner applications", String(d.partnerApplications)],
    ["Open reports", String(d.reportsOpen)],
  ];

  const body = [
    toReview
      ? `There ${toReview === 1 ? "is 1 thing" : `are ${toReview} things`} waiting for you in the Studio. Listings and reports are the totals still open; everything else covers the last 24 hours.`
      : "Nothing is waiting for review. Listings and reports are the totals still open; everything else covers the last 24 hours.",
  ];
  if (d.leads.length) {
    body.push("## Newest leads", d.leads.slice(0, 15).map((l) => `- ${l.name || "No name given"}, ${l.email} (${l.source})`).join("\n"));
  }

  return {
    subject: `[Trichollective] Your daily summary for ${d.dateLabel}`,
    content: {
      preheader: `${plural(people, "new person", "new people")}, ${plural(toReview, "thing", "things")} to review.`,
      eyebrow: "Daily summary",
      heading,
      body: body.join("\n\n"),
      facts,
      cta: { label: "Open the Studio", href: "/studio" },
      signoff: null,
      reason: "You receive this because you own Trichollective. It is only sent on days when something happened.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Samples for Studio, Emails                                          */
/* ------------------------------------------------------------------ */

const report = postReportedAlert({
  reason: "Shares information that could identify a client: the photo shows a client's face",
  postTitle: "Before and after: six months of treatment for traction alopecia",
  reporterName: "Niamh Byrne",
});

const digest = ownerDigestEmail({
  dateLabel: "Thursday 1 October 2026",
  subscribersBySource: [
    { source: "dublin", count: 4 },
    { source: "guide", count: 2 },
  ],
  freeAccounts: 3,
  paidByPlan: [{ plan: "Professional", count: 1 }],
  listingsWaiting: 2,
  enquiriesDelivered: 1,
  enquiriesHeld: 2,
  contactMessages: 1,
  partnerApplications: 0,
  reportsOpen: 1,
  leads: [
    { name: "Aoife Brennan", email: "aoife@example.com", source: "Free account" },
    { name: null, email: "hello@example.com", source: "Subscriber, dublin" },
    { name: "Dr Aisling Murphy", email: "aisling@example.com", source: "Professional member" },
  ],
});

const verificationSubmitted = verificationSubmittedAlert({
  name: "Niamh Byrne",
  email: "niamh@example.com",
  title: "IAT Diploma in Trichology, 2019",
});

export const samples: EmailSample[] = [
  {
    id: "owner-digest",
    name: "Daily summary",
    trigger: "Sent to the owners at 8am UTC each day, only when something happened in the last 24 hours.",
    audience: "owners",
    ...digest,
  },
  {
    id: "owner-post-reported",
    name: "A post has been reported",
    trigger: "Sent to the owners when a member reports a community post.",
    audience: "owners",
    subject: `[Trichollective] ${report.subject}`,
    content: ownerAlertContent(report),
  },
  {
    id: "owner-verification-submitted",
    name: "Evidence sent for verification",
    trigger: "Sent to the owners when a member sends a document for the verified badge.",
    audience: "owners",
    subject: `[Trichollective] ${verificationSubmitted.subject}`,
    content: ownerAlertContent(verificationSubmitted),
  },
];
