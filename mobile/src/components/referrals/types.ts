/** Shapes from /api/mobile/v1/referrals. */

export type ReferralStatus = "sent" | "seen" | "accepted" | "declined";
export type Person = { id: string; name: string | null; image: string | null };

export type ReferralRow = {
  id: string;
  status: ReferralStatus;
  statusLabel: string;
  isNew: boolean;
  preview: string;
  createdAt: string;
  respondedAt: string | null;
  other: Person;
};

export type ReferralList = {
  tab: "received" | "sent";
  counts: { received: number; sent: number; waiting: number };
  professional: boolean;
  referrals: ReferralRow[];
};

export type ReferralDetail = {
  id: string;
  side: "received" | "sent";
  status: ReferralStatus;
  statusLabel: string;
  statusSentence: string;
  summary: string;
  reason: string | null;
  clientContext: string | null;
  responseNote: string | null;
  respondedAt: string | null;
  createdAt: string;
  other: Person & { shortName: string };
  canRespond: boolean;
};

export type Finding = { kind: string; severity: "block" | "warn"; message: string };

export type RecipientInfo = {
  recipient: (Person & { shortName: string }) | null;
  professional: boolean;
  blocker: string | null;
  limits: { summaryMin: number; summaryMax: number; reasonMax: number; contextMax: number; noteMax: number };
};

export type SendResult = { ok: true; id: string } | { ok: false; needsConfirm?: boolean; findings: Finding[]; error?: string };
