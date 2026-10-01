import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { professionById } from "@/config/rooms";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { reviewListingAction, toggleVerifiedAction } from "../actions";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function ListingsPage() {
  if (!(await studioPage("/studio/listings"))) return null;
  const now = new Date();

  const [pending, expiring, listed] = await Promise.all([
    prisma.directoryListing.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } }),
    prisma.directoryListing.findMany({
      where: { status: "listed", kind: "listed", freeUntil: { gte: now, lte: new Date(now.getTime() + 30 * DAY) } },
      orderBy: { freeUntil: "asc" },
      include: { _count: { select: { enquiries: { where: { status: "new" } } } } },
    }),
    prisma.directoryListing.findMany({
      where: { status: "listed" },
      orderBy: [{ isVerified: "asc" }, { name: "asc" }],
      take: 200,
      select: { id: true, name: true, city: true, profession: true, kind: true, isVerified: true, slug: true, freeUntil: true },
    }),
  ]);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Listings"
        intro={`New free listings wait here for you to check. Approving one puts it in the public directory free for ${FREE_LISTING_DAYS} days. Phone numbers are never shown publicly.`}
      />

      <Section title={`Waiting for review (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty>No listings waiting.</Empty>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {pending.map((item) => (
              <Card key={item.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {professionById(item.profession)?.label} · {item.city}, {item.country}
                    </p>
                  </div>
                  <Tag tone="warn">Sent {dateOnly(item.createdAt)}</Tag>
                </div>
                {item.specialization && <p className="text-sm text-ink">{item.specialization}</p>}
                {item.bio && <p className="whitespace-pre-wrap text-sm text-ink-2">{item.bio}</p>}
                <dl className="space-y-0.5 text-xs text-muted-foreground">
                  <div>Email: {item.email}</div>
                  {item.phone && <div>Phone (private): {item.phone}</div>}
                  {item.website && <div>Website: {item.website}</div>}
                </dl>
                <div className="flex gap-2 pt-1">
                  <form action={reviewListingAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <SubmitButton size="sm" pendingLabel="Approving…">
                      Approve
                    </SubmitButton>
                  </form>
                  <form action={reviewListingAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <SubmitButton size="sm" variant="outline" pendingLabel="Rejecting…">
                      Reject
                    </SubmitButton>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Free listings ending in the next 30 days"
        intro="The Membership helper drafts reminder emails for these at 30 days, 10 days and on the day."
      >
        {expiring.length === 0 ? (
          <Empty>No free listings end in the next 30 days.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {expiring.map((l) => {
              const days = Math.ceil(((l.freeUntil?.getTime() ?? 0) - now.getTime()) / DAY);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.city} · {l.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {l._count.enquiries > 0 && (
                      <Tag tone="ink">
                        {l._count.enquiries} enquir{l._count.enquiries === 1 ? "y" : "ies"} waiting
                      </Tag>
                    )}
                    <Tag tone={days <= 10 ? "warn" : "default"}>
                      {days} day{days === 1 ? "" : "s"} left · ends {dateOnly(l.freeUntil)}
                    </Tag>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Verified badge" intro="Tick a listing once you've checked their qualifications. The badge shows in the public directory.">
        {listed.length === 0 ? (
          <Empty>No live listings yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {listed.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium text-ink">
                    {l.name}
                    {l.isVerified && <BadgeCheck className="h-4 w-4 text-positive" aria-label="Verified" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {professionById(l.profession)?.label} · {l.city} · {l.kind === "member" ? "Claimed by a member" : "Free listing"}
                    {l.slug && (
                      <>
                        {" · "}
                        <Link href={`/directory/p/${l.slug}`} target="_blank" className="underline underline-offset-4">
                          View
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <form action={toggleVerifiedAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <SubmitButton size="xs" variant={l.isVerified ? "outline" : "default"} pendingLabel="Saving…">
                    {l.isVerified ? "Remove verified" : "Mark verified"}
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
