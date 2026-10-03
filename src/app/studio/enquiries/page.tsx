import Link from "next/link";
import type { EnquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, TextLink, dateTime, fieldClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { setEnquiryStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "forwarded", "closed"] as const;
const STATUS_LABEL: Record<EnquiryStatus, string> = { new: "New", forwarded: "Forwarded", closed: "Closed" };
const REFERRAL_LABEL: Record<string, string> = { sent: "Sent", seen: "Seen", accepted: "Accepted", declined: "Declined" };

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; tone?: string }>;
}) {
  const staff = await studioPage("/studio/enquiries", "enquiries.view");
  if (!staff) return <NoAccess what="client enquiries" />;
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as EnquiryStatus) : null;
  const canEdit = staff.perms.has("crm.edit");

  const [enquiries, counts, referrals] = await Promise.all([
    prisma.enquiry.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        teamNote: true,
        createdAt: true,
        listing: { select: { name: true, slug: true, city: true, userId: true, user: { select: { name: true } } } },
      },
    }),
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        summary: true,
        reason: true,
        status: true,
        createdAt: true,
        respondedAt: true,
        from: { select: { id: true, name: true, email: true } },
        to: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);
  const count = (s: EnquiryStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = STATUSES.reduce((n, s) => n + count(s), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Enquiries"
        intro="Every message a member of the public has sent to a practitioner through the directory, so the team can make sure each one gets an answer."
      />
      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="All enquiries" value={total} />
        <Stat label="New" value={count("new")} note="These have not been forwarded or closed yet." />
        <Stat label="Forwarded" value={count("forwarded")} note="These were emailed on to the practitioner." />
        <Stat label="Closed" value={count("closed")} />
      </div>

      <Section
        title="Client enquiries"
        intro={status ? `Showing the ${STATUS_LABEL[status].toLowerCase()} enquiries, newest first.` : "Showing every enquiry, newest first."}
      >
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Status">
          {[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: `${STATUS_LABEL[s]} (${count(s)})` }))].map((o) => {
            const on = (status ?? "") === o.value;
            return (
              <Link
                key={o.value || "all"}
                href={o.value ? `/studio/enquiries?status=${o.value}` : "/studio/enquiries"}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  on ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink"
                )}
              >
                {o.label}
              </Link>
            );
          })}
        </div>

        {enquiries.length === 0 ? (
          <Empty>
            {status
              ? "There are no enquiries with this status. Choose another filter to see the rest."
              : "No one has sent an enquiry through the directory yet. They will appear here as soon as they arrive."}
          </Empty>
        ) : (
          <div className="space-y-2">
            {enquiries.map((e) => (
              <Card key={e.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5 text-sm">
                    <p className="font-medium text-ink">
                      {e.name} <span className="font-normal text-muted-foreground">({e.email})</span> wrote to{" "}
                      {e.listing.userId ? (
                        <TextLink href={`/studio/members/${e.listing.userId}`}>{e.listing.name}</TextLink>
                      ) : (
                        e.listing.name
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.listing.city}, {dateTime(e.createdAt)}
                      {e.listing.slug && (
                        <>
                          {" · "}
                          <Link href={`/directory/p/${e.listing.slug}`} className="underline underline-offset-4">
                            View the listing
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <Tag tone={e.status === "new" ? "warn" : e.status === "closed" ? "default" : "positive"}>{STATUS_LABEL[e.status]}</Tag>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-ink-2">
                    {e.message.length > 160 ? `${e.message.slice(0, 160)}…` : e.message}
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-ink">{e.message}</p>
                </details>
                {e.teamNote && <p className="text-xs text-ink-2">Team note: {e.teamNote}</p>}
                {canEdit && (
                  <form action={setEnquiryStatusAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="filter" value={status ?? ""} />
                    <input type="hidden" name="to" value={e.status === "closed" ? "new" : "closed"} />
                    <label htmlFor={`note-${e.id}`} className="sr-only">
                      Team note
                    </label>
                    <input
                      id={`note-${e.id}`}
                      name="teamNote"
                      maxLength={2000}
                      defaultValue={e.teamNote ?? ""}
                      placeholder="A note for the team, such as why it was closed"
                      className={cn(fieldClass, "max-w-md flex-1 py-2")}
                    />
                    <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                      {e.status === "closed" ? "Reopen enquiry" : "Close enquiry"}
                    </SubmitButton>
                  </form>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Referrals"
        intro="Clients one member has referred to another, newest first. The summary is clinical, so it stays folded away and should only be opened for a safety or moderation concern."
      >
        {referrals.length === 0 ? (
          <Empty>
            No referrals have been made yet. When members start referring clients to each other, each referral will appear here with who
            sent it, who received it and whether it was accepted.
          </Empty>
        ) : (
          <Card className="divide-y divide-rule p-0">
            {referrals.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-ink">
                    <TextLink href={`/studio/members/${r.from.id}`}>{r.from.name ?? r.from.email}</TextLink> referred a client to{" "}
                    <TextLink href={`/studio/members/${r.to.id}`}>{r.to.name ?? r.to.email}</TextLink>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {dateTime(r.createdAt)}
                    {r.respondedAt && `, ${r.status === "accepted" ? "accepted" : "declined"} ${dateTime(r.respondedAt)}`}
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-ink-2">Show the clinical summary</summary>
                    <div className="mt-2 space-y-1.5 text-ink">
                      {r.reason && <p>Reason: {r.reason}</p>}
                      <p className="whitespace-pre-line">{r.summary}</p>
                    </div>
                  </details>
                </div>
                <Tag tone={r.status === "accepted" ? "positive" : r.status === "declined" ? "danger" : "default"}>
                  {REFERRAL_LABEL[r.status] ?? r.status}
                </Tag>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}
