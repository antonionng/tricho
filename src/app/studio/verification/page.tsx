import Link from "next/link";
import { BadgeCheck, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";
import { tierById } from "@/config/subscriptions";
import { verificationKindLabel } from "@/lib/verification";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { approveVerificationAction, rejectVerificationAction, revokeVerificationAction } from "./actions";

export const dynamic = "force-dynamic";

const DONE: Record<string, string> = {
  approved: "The member is now verified and has been emailed.",
  rejected: "The request was not approved, and the member has been emailed the reason.",
  revoked: "The verified badge has been removed from the member's profile and listings.",
};

const STATUS_TAG = {
  pending: { label: "Waiting", tone: "warn" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Not approved", tone: "danger" },
} as const;

function DocumentLink({ fileId }: { fileId: string | null }) {
  if (!fileId) return <span className="text-xs text-muted-foreground">No document attached</span>;
  return (
    <a
      href={`/api/files/${fileId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-ink underline decoration-mute underline-offset-4 hover:decoration-ink"
    >
      <FileText className="h-4 w-4" /> View document
    </a>
  );
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string; id?: string }>;
}) {
  if (!(await studioPage("/studio/verification", "verification.review"))) return <NoAccess what="verification" />;
  const { done, error, id: errorId } = await searchParams;

  const userSelect = {
    id: true,
    name: true,
    email: true,
    plan: true,
    profile: { select: { profession: true, isVerified: true } },
    listings: { select: { id: true, status: true, kind: true, slug: true, isVerified: true } },
  } as const;

  const [pending, reviewed, verifiedUsers] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: {
          select: {
            ...userSelect,
            verifications: {
              orderBy: { createdAt: "desc" },
              select: { id: true, kind: true, title: true, status: true, fileId: true, reviewNote: true, createdAt: true },
            },
          },
        },
      },
    }),
    prisma.verificationRequest.findMany({
      where: { status: { not: "pending" } },
      orderBy: { reviewedAt: "desc" },
      take: 30,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { OR: [{ profile: { isVerified: true } }, { listings: { some: { isVerified: true } } }] },
      orderBy: { name: "asc" },
      take: 300,
      select: userSelect,
    }),
  ]);

  const reviewerIds = [...new Set(reviewed.map((r) => r.reviewedById).filter((v): v is string => !!v))];
  const reviewers = new Map(
    (await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true, email: true } })).map((u) => [
      u.id,
      u.name || u.email || "Someone on the team",
    ])
  );

  return (
    <div className="space-y-12">
      <PageHeader
        title="Verification"
        intro="Members send evidence of their training or professional standing here. Approving a request adds the verified badge to their profile and every directory listing they own, and emails them. Documents are private and open only to the team members who review verification."
      />

      {done && DONE[done] && <Notice>{DONE[done]}</Notice>}

      <Section title={`Waiting for review (${pending.length})`} intro="The oldest requests are shown first.">
        {pending.length === 0 ? (
          <Empty>No requests are waiting for review.</Empty>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {pending.map((r) => {
              const u = r.user;
              const profession = u.profile?.profession ? professionById(u.profile.profession)?.label : null;
              const plan = tierById(u.plan)?.name ?? "Free account";
              const listing = u.listings.find((l) => l.status === "listed") ?? u.listings[0];
              const others = u.verifications.filter((v) => v.id !== r.id);
              return (
                <Card key={r.id} className="space-y-4">
                  <div id={`r-${r.id}`} className="flex scroll-mt-24 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-1.5 text-lg font-semibold text-ink">
                        <Link href={`/studio/members/${u.id}`} className="hover:underline">
                          {u.name || "No name given"}
                        </Link>
                        {u.profile?.isVerified && <BadgeCheck className="h-4 w-4 text-positive" aria-label="Already verified" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {u.email}
                        {" · "}
                        {profession ?? "Discipline not set"}
                        {" · "}
                        {plan}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing ? (
                          <>
                            {listing.kind === "member" ? "Claimed listing" : "Free listing"} ({listing.status})
                            {listing.slug && listing.status === "listed" && (
                              <>
                                {" · "}
                                <Link href={`/directory/p/${listing.slug}`} target="_blank" className="underline underline-offset-4">
                                  View
                                </Link>
                              </>
                            )}
                          </>
                        ) : (
                          "No directory listing yet"
                        )}
                      </p>
                    </div>
                    <Tag tone="warn">Sent {dateOnly(r.createdAt)}</Tag>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{verificationKindLabel(r.kind)}</p>
                    <p className="text-ink">{r.title}</p>
                    {r.note && <p className="whitespace-pre-wrap text-sm text-ink-2">{r.note}</p>}
                    <DocumentLink fileId={r.fileId} />
                  </div>

                  {others.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Their other requests ({others.length})
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {others.map((o) => (
                          <li key={o.id} className="flex flex-wrap items-center gap-2">
                            <Tag tone={STATUS_TAG[o.status].tone}>{STATUS_TAG[o.status].label}</Tag>
                            <span className="text-ink">{o.title}</span>
                            <span className="text-xs text-muted-foreground">{dateOnly(o.createdAt)}</span>
                            {o.fileId && (
                              <a href={`/api/files/${o.fileId}`} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4">
                                Document
                              </a>
                            )}
                            {o.reviewNote && <span className="w-full text-xs text-muted-foreground">Reason: {o.reviewNote}</span>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex flex-col gap-3 border-t border-rule pt-4">
                    <form action={approveVerificationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton size="sm" pendingLabel="Approving…">
                        Approve and verify
                      </SubmitButton>
                    </form>
                    <form action={rejectVerificationAction} className="space-y-2">
                      <input type="hidden" name="id" value={r.id} />
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink">Reason for not approving</span>
                        <textarea
                          name="reason"
                          rows={2}
                          required
                          minLength={5}
                          maxLength={1000}
                          className={fieldClass}
                          placeholder="The certificate is cropped, so we cannot see the awarding body or the date."
                        />
                        <span className="text-xs text-muted-foreground">The member sees this in their email and on their verification page.</span>
                      </label>
                      {error === "reason" && errorId === r.id && (
                        <p className="text-xs text-destructive">Please give the member a reason, so they know what to send instead.</p>
                      )}
                      <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                        Do not approve
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Recently reviewed" intro="The last 30 decisions, newest first.">
        {reviewed.length === 0 ? (
          <Empty>Nothing has been reviewed yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {reviewed.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-ink">
                    <Link href={`/studio/members/${r.user.id}`} className="hover:underline">
                      {r.user.name || r.user.email}
                    </Link>
                    <span className="font-normal text-muted-foreground"> · {r.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {verificationKindLabel(r.kind)} · {dateOnly(r.reviewedAt)} by {(r.reviewedById && reviewers.get(r.reviewedById)) || "the team"}
                  </p>
                  {r.reviewNote && <p className="text-xs text-ink-2">Reason: {r.reviewNote}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <DocumentLink fileId={r.fileId} />
                  <Tag tone={STATUS_TAG[r.status].tone}>{STATUS_TAG[r.status].label}</Tag>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`Verified members (${verifiedUsers.length})`}
        intro="Removing the badge takes it off the member's profile and all of their directory listings. It is recorded in the audit log, and the member is not emailed."
      >
        {verifiedUsers.length === 0 ? (
          <Empty>No members are verified yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {verifiedUsers.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium text-ink">
                    <Link href={`/studio/members/${u.id}`} className="hover:underline">
                      {u.name || u.email}
                    </Link>
                    <BadgeCheck className="h-4 w-4 text-positive" aria-label="Verified" />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.profile?.profession ? professionById(u.profile.profession)?.label : "Discipline not set"} ·{" "}
                    {tierById(u.plan)?.name ?? "Free account"}
                  </p>
                </div>
                <form action={revokeVerificationAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <SubmitButton size="xs" variant="outline" pendingLabel="Removing…">
                    Remove badge
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
