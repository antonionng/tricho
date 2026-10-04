import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Field, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass, NoAccess } from "@/components/studio/ui";
import { LISTING_COUNTRIES } from "@/content/chapters";
import { studioPage } from "../_lib/guard";
import { createInvitesAction, sendInvitesAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "default" | "warn" | "positive" | "danger" }> = {
  [ListingStatus.invited]: { label: "Invited", tone: "default" },
  [ListingStatus.pending]: { label: "Responded", tone: "warn" },
  [ListingStatus.listed]: { label: "Live", tone: "positive" },
  [ListingStatus.rejected]: { label: "Not listed", tone: "danger" },
  [ListingStatus.draft]: { label: "Draft", tone: "default" },
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; tone?: string; skipped?: string; confirm?: string }>;
}) {
  if (!(await studioPage("/studio/invite", "invite.send"))) return <NoAccess what="invitations" />;
  const { notice, tone, skipped, confirm } = await searchParams;

  const [invites, waiting] = await Promise.all([
    prisma.directoryListing.findMany({
      where: { source: "invite" },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, name: true, email: true, country: true, city: true, status: true, createdAt: true },
    }),
    prisma.draft.count({ where: { status: "draft", kind: "email", payload: { path: ["invite"], equals: true } } }),
  ]);

  const count = (status: ListingStatus) => invites.filter((i) => i.status === status).length;
  const skippedLines = skipped ? skipped.split("\n").filter(Boolean) : [];

  return (
    <div className="space-y-12">
      <PageHeader
        title="Invite"
        intro="Invite practitioners you know to the founding directory. Each person gets a listing held for them and a personal invitation from Karley, drafted here for you to approve before anything is sent."
      />

      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}
      {skippedLines.length > 0 && (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-ink">Lines that were skipped</p>
          <ul className="space-y-1 text-sm text-ink-2">
            {skippedLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Invited" value={count(ListingStatus.invited)} note="Waiting to hear back" />
        <Stat label="Responded" value={count(ListingStatus.pending)} note="Listing sent in for review" />
        <Stat label="Live" value={count(ListingStatus.listed)} note="In the directory" />
        <Stat label="Emails to approve" value={waiting} note="Drafted but not sent" />
      </div>

      <Section
        title="Add people"
        intro={`One person per line: name, email, discipline, town, country. Only the name and email are needed. Discipline can be cosmetic, clinical or medical (trichologist, doctor, stylist and head spa work too) and defaults to clinical. Country defaults to Ireland and can be ${LISTING_COUNTRIES.join(", ")}.`}
      >
        <form action={createInvitesAction} className="space-y-4">
          <Field label="People to invite" hint="Anyone who already has an invitation or a listing is skipped.">
            <textarea
              name="lines"
              required
              rows={8}
              className={`${fieldClass} font-mono`}
              placeholder={"Aoife Byrne, aoife@example.ie, trichologist, Galway, Ireland\nSam Lee, sam@example.co.uk"}
            />
          </Field>
          <Field
            label="Personal note (optional)"
            hint="Added to every invitation as its own paragraph, exactly as you write it."
          >
            <textarea name="note" rows={3} maxLength={2000} className={fieldClass} />
          </Field>
          <SubmitButton pendingLabel="Drafting invitations…">Draft invitations</SubmitButton>
        </form>
      </Section>

      <Section
        title={`Waiting invitations (${waiting})`}
        intro="You can read and edit each one in the inbox first. Approving sends them all."
      >
        {waiting === 0 ? (
          <Empty>No invitations are waiting to be sent.</Empty>
        ) : confirm === "send" ? (
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-5">
            <p className="font-medium text-ink">
              Send {waiting} invitation{waiting === 1 ? "" : "s"} from Karley now?
            </p>
            <p className="text-sm text-ink-2">Each invitation is emailed straight away, and sent emails can&apos;t be recalled.</p>
            <div className="flex flex-wrap gap-2">
              <form action={sendInvitesAction}>
                <input type="hidden" name="confirm" value="yes" />
                <SubmitButton pendingLabel="Sending…">Yes, send them</SubmitButton>
              </form>
              <Button asChild variant="outline">
                <Link href="/studio/invite">Cancel</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <form action={sendInvitesAction}>
              <SubmitButton pendingLabel="Checking…">Approve and send all waiting invitations…</SubmitButton>
            </form>
            <Button asChild variant="ghost">
              <Link href="/studio/inbox?agent=membership&status=draft">Review them in the inbox</Link>
            </Button>
          </div>
        )}
      </Section>

      <Section title={`Invitations (${invites.length})`}>
        {invites.length === 0 ? (
          <Empty>Nobody has been invited yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-rule text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Invited</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {invites.map((i) => {
                  const st = STATUS[i.status] ?? { label: i.status, tone: "default" as const };
                  return (
                    <tr key={i.id}>
                      <td className="px-4 py-3 text-ink">
                        {i.name}
                        {i.city && <span className="text-muted-foreground"> · {i.city}</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-2">{i.email}</td>
                      <td className="px-4 py-3 text-ink-2">{i.country}</td>
                      <td className="px-4 py-3 text-ink-2">{dateOnly(i.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Tag tone={st.tone}>{st.label}</Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
