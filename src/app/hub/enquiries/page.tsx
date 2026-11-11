import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireConsumer } from "@/lib/consumer-session";
import { longDate } from "@/components/members/format";
import { Pill } from "@/components/site/primitives";
import { consumerEnquiryStatus } from "@/lib/enquiry-status";
import { shortName } from "@/lib/names";

export const metadata = { title: "Your enquiries" };

export default async function HubEnquiriesPage() {
  const me = await requireConsumer();
  const enquiries = await prisma.enquiry.findMany({
    where: { userId: me.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, status: true, message: true, listing: { select: { name: true, slug: true } } },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="display text-4xl sm:text-5xl">Your enquiries are all in one place.</h1>
        <p className="lede max-w-2xl">
          When you send an enquiry while signed in, it appears here. The professional replies to you by email.
        </p>
      </section>
      {enquiries.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-rule bg-card p-6">
          <p className="text-[15px] text-ink-2">You have not sent any enquiries yet. You can send one from a professional&apos;s profile in the directory.</p>
          <Link href="/directory" className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
            Search the directory
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {enquiries.map((e) => {
            const status = consumerEnquiryStatus(e.status, shortName(e.listing.name, "the professional"));
            return (
              <li key={e.id} className="space-y-2 rounded-3xl border border-rule bg-card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-ink">
                    {e.listing.slug ? (
                      <Link href={`/directory/p/${e.listing.slug}`} className="hover:underline">
                        {e.listing.name}
                      </Link>
                    ) : (
                      e.listing.name
                    )}
                  </h2>
                  <Pill tone={e.status === "forwarded" ? "positive" : "default"}>{status.label}</Pill>
                </div>
                <p className="text-sm text-ink-2">
                  Sent on {longDate(e.createdAt)}. {status.detail}
                </p>
                <p className="line-clamp-3 whitespace-pre-line text-[15px] text-ink-2">{e.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
