import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Tag, TextLink, dateOnly, dateTime, fieldClass } from "@/components/studio/ui";
import { audit } from "@/lib/staff";
import { concernLabels, consentLines } from "@/lib/consumers-admin";
import { consumerPublicName } from "@/lib/consumer";
import { consumerEnquiryStatus } from "@/lib/enquiry-status";
import { studioPage } from "../../_lib/guard";
import { deleteConsumerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ConsumerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const staff = await studioPage(`/studio/consumers/${id}`, "consumers.view");
  if (!staff) return <NoAccess what="consumer accounts" />;
  const sp = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      accountType: true,
      accessStatus: true,
      createdAt: true,
      lastSeenAt: true,
      emailUpdates: true,
      emailActivity: true,
      consumerProfile: true,
      savedListings: { orderBy: { createdAt: "desc" }, select: { createdAt: true, listing: { select: { name: true, slug: true, city: true } } } },
      enquiries: { orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, status: true, listing: { select: { name: true } } } },
    },
  });
  if (!user || user.accountType !== "consumer") notFound();
  const p = user.consumerProfile;

  await audit(staff, {
    action: "consumer.view",
    targetType: "consumer",
    targetId: user.id,
    summary: `Opened the consumer account ${user.email}.`,
  });

  const consent = p ? consentLines(p, user) : null;
  const concerns = p ? concernLabels(p) : [];

  return (
    <div className="space-y-10">
      <PageHeader
        title={user.name || user.email || "Consumer"}
        intro={
          <>
            A member of the public. Other people see them as <strong>{p ? consumerPublicName(p, user) : "–"}</strong>. This visit has been
            written to the audit log. <TextLink href="/studio/consumers">Back to consumers</TextLink>
          </>
        }
      />
      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 text-sm">
          <h2 className="text-base font-semibold text-ink">Account</h2>
          <p>Email: {user.email}</p>
          <p>Alias: {p?.alias ?? "–"}</p>
          <p>Shown to others as: {p?.displayMode === "name" ? "first name" : "alias"}</p>
          <p>Where: {[p?.region, p?.country].filter(Boolean).join(", ") || "Not given"}</p>
          <p>Joined: {dateOnly(user.createdAt)}</p>
          <p>Last seen: {user.lastSeenAt ? dateTime(user.lastSeenAt) : "Not recorded"}</p>
          {user.accessStatus !== "active" && <Tag tone="danger">{user.accessStatus}</Tag>}
        </Card>
        <Card className="space-y-2 text-sm">
          <h2 className="text-base font-semibold text-ink">Consent</h2>
          <p>
            News and the monthly digest:{" "}
            {consent?.news ? <Tag tone="positive">Yes, since {dateOnly(p!.marketingConsentAt)}</Tag> : <Tag>No</Tag>}
          </p>
          <p>Emails about their enquiries: {consent?.enquiryEmails ? <Tag tone="positive">Yes</Tag> : <Tag>No</Tag>}</p>
          <p>
            Health data: {consent?.health ? <Tag tone="positive">Given {dateOnly(p!.healthDataConsentAt)}</Tag> : <Tag>Not given</Tag>}
          </p>
          {consent?.health && (
            <p>
              What they want help with: {concerns.length ? concerns.join(", ") : "No categories chosen"}. Use this only to help them; never
              share it outside the team.
            </p>
          )}
        </Card>
      </div>

      <Section title="Enquiries" intro="The professionals see their real name and email, never the alias.">
        {user.enquiries.length === 0 ? (
          <Empty>They haven&apos;t sent an enquiry while signed in.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.enquiries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <Tag>{consumerEnquiryStatus(e.status, e.listing.name).label}</Tag>
                <span className="text-ink">{e.listing.name}</span>
                <span className="text-muted-foreground">{dateOnly(e.createdAt)}</span>
              </li>
            ))}
            <li>
              <TextLink href="/studio/enquiries">Open every enquiry</TextLink>
            </li>
          </ul>
        )}
      </Section>

      <Section title="Saved professionals">
        {user.savedListings.length === 0 ? (
          <Empty>They haven&apos;t saved anyone yet.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {user.savedListings.map((s, i) => (
              <li key={i}>
                {s.listing.slug ? <TextLink href={`/directory/p/${s.listing.slug}`}>{s.listing.name}</TextLink> : s.listing.name}
                {s.listing.city && <span className="text-muted-foreground">, {s.listing.city}</span>}
                <span className="text-muted-foreground"> · saved {dateOnly(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {staff.perms.has("consumers.delete") && (
        <Section title="Delete this account" intro="For when they ask us to. Their enquiries stay with the professionals, unlinked. This can't be undone.">
          <form action={deleteConsumerAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={user.id} />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Type delete to confirm</span>
              <input name="confirm" className={fieldClass} autoComplete="off" />
            </label>
            <SubmitButton variant="destructive" pendingLabel="Deleting…">
              Delete account
            </SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}
