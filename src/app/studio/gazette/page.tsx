import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { allEditions, editionLabel } from "@/content/gazette";
import { Empty, Notice, PageHeader, Section, Tag, NoAccess, dateOnly, dateTime } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { STATUS_LABEL, STATUS_TONE, labelFields } from "./labels";

export const dynamic = "force-dynamic";

export default async function GazetteStudioPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/gazette", "gazette.view");
  if (!staff) return <NoAccess what="Trichozette" />;
  const sp = await searchParams;
  const canEdit = staff.perms.has("gazette.edit");

  const rows = await prisma.gazetteEdition.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      number: true,
      series: true,
      period: true,
      focus: true,
      title: true,
      status: true,
      pages: true,
      scheduledFor: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  const now = new Date();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Trichozette"
        intro="Write new editions of the magazine from a brief, edit every page, preview it as members will see it and publish when it is ready. The built-in editions are listed below for reference and can't be changed here."
        actions={
          canEdit && (
            <Button asChild>
              <Link href="/studio/gazette/new">
                <Plus /> New edition
              </Link>
            </Button>
          )
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <Section title="Editions written in Studio">
        {rows.length === 0 ? (
          <Empty>No editions have been written in Studio yet. Start one from a brief and the first draft will be written for you.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {rows.map((r) => {
              const pageCount = Array.isArray(r.pages) ? r.pages.length : 0;
              const due = r.status === "scheduled" && r.scheduledFor && r.scheduledFor <= now;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-ink">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.number > 0 ? editionLabel(labelFields(r)) : r.series === "archive" ? "Archive" : "Monthly"}
                      {" · "}
                      {pageCount} {pageCount === 1 ? "page" : "pages"}
                      {" · "}
                      {r.status === "published" && r.publishedAt
                        ? `Published ${dateOnly(r.publishedAt)}`
                        : r.status === "scheduled" && r.scheduledFor
                          ? `${due ? "Live since" : "Goes live"} ${dateTime(r.scheduledFor)}`
                          : `Updated ${dateTime(r.updatedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag tone={due ? "positive" : STATUS_TONE[r.status]}>{due ? "Live" : STATUS_LABEL[r.status]}</Tag>
                    <Button asChild size="xs" variant="outline">
                      <Link href={`/studio/gazette/${r.id}/preview`}>Preview</Link>
                    </Button>
                    <Button asChild size="xs" variant="outline">
                      <Link href={`/studio/gazette/${r.id}`}>{canEdit ? "Edit" : "Open"}</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Built-in editions" intro="These editions are part of the site's code. They are always shown, and a Studio edition can't reuse their web addresses.">
        <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {allEditions.map((e) => (
            <li key={e.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-ink">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {editionLabel(e)} · {e.pages.length} pages · Published {dateOnly(new Date(e.published))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Tag>Built in</Tag>
                <Button asChild size="xs" variant="outline">
                  <Link href={`/trichozette/${e.slug}`} target="_blank">
                    Read
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
