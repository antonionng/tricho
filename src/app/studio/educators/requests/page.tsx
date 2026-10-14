import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../../_lib/guard";
import { startRequestCourseAction, updateRequestAction } from "./actions";

const STATUS: Record<string, { label: string; tone: "default" | "warn" | "positive" | "danger" | "ink" }> = {
  new: { label: "New", tone: "warn" },
  scoping: { label: "Scoping", tone: "default" },
  building: { label: "Building", tone: "ink" },
  with_educator: { label: "With the educator", tone: "default" },
  done: { label: "Done", tone: "positive" },
  declined: { label: "Declined", tone: "danger" },
};

export default async function CourseRequestsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/educators/requests", "courses.view");
  if (!staff) return <NoAccess what="course requests" />;
  const { notice, tone } = await searchParams;
  const canEdit = staff.perms.has("courses.edit");
  const requests = await prisma.courseRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { educator: { select: { id: true, displayName: true, user: { select: { email: true } } } }, course: { select: { id: true, title: true, status: true } } },
  });
  const team = await prisma.user.findMany({ where: { id: { in: requests.flatMap((r) => (r.assignedToId ? [r.assignedToId] : [])) } }, select: { id: true, name: true } });
  const nameOf = new Map(team.map((t) => [t.id, t.name ?? "a team member"]));
  const files = await prisma.storedFile.findMany({ where: { id: { in: requests.flatMap((r) => r.fileIds) } }, select: { id: true, name: true } });
  const fileName = new Map(files.map((f) => [f.id, f.name ?? "PDF"]));

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/studio/educators" className="hover:text-ink">
          Educators
        </Link>{" "}
        / <span className="text-ink">Tailored course requests</span>
      </nav>
      <PageHeader
        title="Tailored courses"
        intro="Educators asking the team to build or tailor a course with them. Start the course here and it belongs to the educator from the start: you build it in Studio, they review it in their builder, and it goes through the same review before it's sold."
      />
      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}
      <Section title={`${requests.filter((r) => r.status === "new").length} new`}>
        {requests.length === 0 ? (
          <Empty>No educator has asked for a tailored course yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} id={`r-${r.id}`} className="scroll-mt-20 space-y-3 rounded-2xl border border-rule bg-card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      <Tag tone={STATUS[r.status]?.tone ?? "default"}>{STATUS[r.status]?.label ?? r.status}</Tag>
                      {r.assignedToId && <Tag>{nameOf.get(r.assignedToId)}</Tag>}
                    </div>
                    <p className="mt-1.5 text-lg font-medium">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.educator.displayName} ({r.educator.user.email}) · sent {dateOnly(r.createdAt)}
                      {r.timeline ? ` · wanted: ${r.timeline}` : ""}
                    </p>
                  </div>
                  {r.course ? (
                    <Link href={`/studio/courses/${r.course.id}`} className="shrink-0 text-sm font-medium underline underline-offset-4">
                      Open the course ({r.course.status.replace("_", " ")})
                    </Link>
                  ) : (
                    canEdit && (
                      <form action={startRequestCourseAction} className="shrink-0">
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85">
                          Start the course for them
                        </button>
                      </form>
                    )
                  )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed">{r.brief}</p>
                {r.audience && <p className="text-sm text-ink-2">For: {r.audience}</p>}
                {r.fileIds.length > 0 && (
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {r.fileIds.map((f) => (
                      <a key={f} href={`/studio/educators/requests/file/${r.id}/${f}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                        {fileName.get(f) ?? "PDF"}
                      </a>
                    ))}
                  </p>
                )}
                {canEdit && (
                  <form action={updateRequestAction} className="grid gap-2 border-t border-rule pt-3 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} className="h-9 rounded-lg border border-rule bg-paper px-2 text-sm" aria-label="Status">
                      {Object.entries(STATUS).map(([value, s]) => (
                        <option key={value} value={value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <textarea name="notes" rows={2} defaultValue={r.notes ?? ""} placeholder="Notes for the team (the educator doesn't see these)" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                    <div className="flex flex-col gap-1.5">
                      <button type="submit" className="rounded-full border border-ink/20 px-3 py-1.5 text-sm font-medium hover:border-ink">
                        Save
                      </button>
                      {!r.assignedToId && (
                        <label className="flex items-center gap-1.5 text-xs text-ink-2">
                          <input type="checkbox" name="assign" value="me" /> Assign to me
                        </label>
                      )}
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
