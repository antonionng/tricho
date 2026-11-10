import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import { audit } from "@/lib/staff";
import { consentLines, consumerWhere } from "@/lib/consumers-admin";
import { HUB_LABEL } from "@/config/consumer";
import { studioPage } from "../_lib/guard";

export const dynamic = "force-dynamic";

export default async function ConsumersPage({ searchParams }: { searchParams: Promise<{ q?: string; notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/consumers", "consumers.view");
  if (!staff) return <NoAccess what="consumer accounts" />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const where = consumerWhere(q);

  const [rows, total, news, health, enquiries] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailUpdates: true,
        emailActivity: true,
        accessStatus: true,
        consumerProfile: { select: { alias: true, region: true, country: true, marketingConsentAt: true, healthDataConsentAt: true } },
        _count: { select: { savedListings: true, enquiries: true } },
      },
    }),
    prisma.user.count({ where: { accountType: "consumer" } }),
    prisma.user.count({ where: { accountType: "consumer", emailUpdates: true, consumerProfile: { marketingConsentAt: { not: null } } } }),
    prisma.user.count({ where: { accountType: "consumer", consumerProfile: { healthDataConsentAt: { not: null } } } }),
    prisma.enquiry.count({ where: { user: { accountType: "consumer" } } }),
  ]);

  await audit(staff, {
    action: "consumer.list_view",
    targetType: "consumer",
    summary: q ? `Searched consumer accounts for "${q}" (${rows.length} shown).` : `Opened the list of consumer accounts (${rows.length} shown).`,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Consumers"
        intro={`Members of the public with a free account for ${HUB_LABEL.toLowerCase()}. Only owners and support can open this page, and every visit is written to the audit log, because some of them have shared health information.`}
      />
      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Consumer accounts" value={total} />
        <Stat label="Opted in to news" value={news} note="They get the monthly hub digest." />
        <Stat label="Health-data consent" value={health} note="They chose concern categories." />
        <Stat label="Enquiries sent signed in" value={enquiries} />
      </div>

      <Section
        title="Accounts"
        intro={total > rows.length ? `Showing the newest ${rows.length}. Search to find anyone else.` : "Newest first."}
        actions={
          <form className="flex gap-2" action="/studio/consumers">
            <input name="q" defaultValue={q} placeholder="Email, name or alias" className={fieldClass} aria-label="Search consumers" />
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>{q ? `No consumer account matches "${q}".` : "Nobody has created a consumer account yet. They sign up at /signup/you."}</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Alias</th>
                  <th className="px-4 py-3 font-medium">Where</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Emails</th>
                  <th className="px-4 py-3 font-medium">Saved</th>
                  <th className="px-4 py-3 font-medium">Enquiries</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const p = u.consumerProfile;
                  const c = p ? consentLines(p, u) : null;
                  return (
                    <tr key={u.id} className="border-b border-rule last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/studio/consumers/${u.id}`} className="font-medium text-ink underline decoration-mute underline-offset-4 hover:decoration-ink">
                          {u.name || u.email}
                        </Link>
                        {u.name && <p className="text-xs text-muted-foreground">{u.email}</p>}
                        {u.accessStatus !== "active" && <Tag tone="danger" className="ml-2">{u.accessStatus}</Tag>}
                      </td>
                      <td className="px-4 py-3 text-ink-2">{p?.alias ?? "–"}</td>
                      <td className="px-4 py-3 text-ink-2">{[p?.region, p?.country].filter(Boolean).join(", ") || "–"}</td>
                      <td className="px-4 py-3 text-ink-2">{dateOnly(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c?.news ? <Tag tone="positive">News</Tag> : <Tag>No news</Tag>}
                          {c?.enquiryEmails ? <Tag>Enquiry emails</Tag> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{u._count.savedListings}</td>
                      <td className="px-4 py-3 tabular-nums">{u._count.enquiries}</td>
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
