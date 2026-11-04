import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../../_lib/guard";
import { courseBuild, buildTierById } from "@/config/course-build";
import { buildFeeSettled, requestSharePct } from "@/lib/course-build";
import { saveQuoteAction, startRequestCourseAction, updateRequestAction, waiveFeeAction, withdrawQuoteAction } from "./actions";

const STATUS: Record<string, { label: string; tone: "default" | "warn" | "positive" | "danger" | "ink" }> = {
  new: { label: "New", tone: "warn" },
  scoping: { label: "Scoping", tone: "default" },
  building: { label: "Building", tone: "ink" },
  with_educator: { label: "With the educator", tone: "default" },
  done: { label: "Done", tone: "positive" },
  declined: { label: "Declined", tone: "danger" },
};

const QUOTE: Record<string, { label: string; tone: "default" | "warn" | "positive" | "danger" | "ink" }> = {
  none: { label: "Not quoted", tone: "warn" },
  draft: { label: "Quote not sent", tone: "warn" },
  sent: { label: "Quote sent, not paid", tone: "default" },
  paid: { label: "Paid", tone: "positive" },
  waived: { label: "Fee waived", tone: "ink" },
  withdrawn: { label: "Quote withdrawn", tone: "danger" },
};

const pounds = (pence: number) => (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });

export default async function CourseRequestsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/educators/requests", "courses.view");
  if (!staff) return <NoAccess what="course requests" />;
  const { notice, tone } = await searchParams;
  const canEdit = staff.perms.has("courses.edit");
  const requests = await prisma.courseRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { educator: { select: { id: true, displayName: true, sharePct: true, user: { select: { email: true } } } }, course: { select: { id: true, title: true, status: true } } },
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
        intro="Educators asking the team to build or tailor a course with them. Quote the build and send it; the educator accepts and pays from their dashboard, and the request moves to Building once the payment is in (or once you waive the fee). Start the course here and it belongs to the educator from the start: you build it in Studio, they review it in their builder, and it goes through the same review before it's sold."
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
                      <Tag tone={QUOTE[r.quoteStatus]?.tone ?? "default"}>{QUOTE[r.quoteStatus]?.label ?? r.quoteStatus}</Tag>
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
                    canEdit &&
                    (buildFeeSettled(r) ? (
                      <form action={startRequestCourseAction} className="shrink-0">
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85">
                          Start the course for them
                        </button>
                      </form>
                    ) : (
                      <p className="shrink-0 text-sm text-muted-foreground">You can start the course once the fee is paid or waived.</p>
                    ))
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
                <QuotePanel r={r} canEdit={canEdit} />
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

type QuoteRow = {
  id: string;
  tier: string | null;
  quoteStatus: string;
  quoteAmount: number | null;
  quoteNote: string | null;
  quoteSentAt: Date | null;
  sharePct: number | null;
  waivedReason: string | null;
  paidAt: Date | null;
  educator: { sharePct: number };
};

/** The build fee: quote it, send it, waive it, or see that it's paid. Work starts only once it's settled. */
function QuotePanel({ r, canEdit }: { r: QuoteRow; canEdit: boolean }) {
  const tier = buildTierById(r.tier);
  const share = requestSharePct(r, r.educator.sharePct);
  if (r.quoteStatus === "paid" || r.quoteStatus === "waived") {
    return (
      <p className="rounded-xl bg-paper-2 px-4 py-3 text-sm">
        {r.quoteStatus === "paid"
          ? `${tier?.name ?? "Build"} paid: ${r.quoteAmount ? pounds(r.quoteAmount) : ""} on ${r.paidAt ? dateOnly(r.paidAt) : "a date Stripe didn't give"}.`
          : `Fee waived${r.waivedReason ? `: ${r.waivedReason}` : "."}`}{" "}
        The educator keeps {share}% of each sale of this course.
      </p>
    );
  }
  if (!canEdit) {
    return r.quoteAmount ? (
      <p className="text-sm text-ink-2">
        Quote: {tier?.name} at {pounds(r.quoteAmount)} ({QUOTE[r.quoteStatus]?.label.toLowerCase()}).
      </p>
    ) : null;
  }
  return (
    <details className="rounded-xl border border-rule" open={r.quoteStatus === "none" || r.quoteStatus === "draft"}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        {r.quoteAmount ? `Quote: ${tier?.name ?? ""} at ${pounds(r.quoteAmount)}` : "Quote for the build"}
        {r.quoteSentAt && r.quoteStatus === "sent" ? ` · sent ${dateOnly(r.quoteSentAt)}` : ""}
      </summary>
      <div className="space-y-3 border-t border-rule p-4">
        <form action={saveQuoteAction} className="grid gap-2 sm:grid-cols-[12rem_9rem_7rem_1fr]">
          <input type="hidden" name="id" value={r.id} />
          <select name="tier" defaultValue={r.tier ?? ""} required aria-label="Service" className="h-9 rounded-lg border border-rule bg-paper px-2 text-sm">
            <option value="" disabled>
              Choose the service
            </option>
            {courseBuild.tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (from £{t.fromPrice.toLocaleString("en-GB")}
                {t.defaultSharePct ? `, ${t.defaultSharePct}% share` : ""})
              </option>
            ))}
          </select>
          <input name="amount" required inputMode="decimal" defaultValue={r.quoteAmount ? String(r.quoteAmount / 100) : ""} placeholder="Fee in £, inc. VAT" aria-label="Fee in pounds, including VAT" className="h-9 rounded-lg border border-rule bg-paper px-2 text-sm" />
          <input name="sharePct" inputMode="numeric" defaultValue={r.sharePct ?? ""} placeholder={`Share ${share}%`} aria-label="Educator's share of each sale, in percent" className="h-9 rounded-lg border border-rule bg-paper px-2 text-sm" />
          <p className="self-center text-xs text-muted-foreground">Leave the share empty to use the tier&apos;s default, then the educator&apos;s own rate.</p>
          <textarea name="quoteNote" rows={3} defaultValue={r.quoteNote ?? ""} placeholder="What the quote covers, in a few sentences. The educator sees this." className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm sm:col-span-4" />
          <div className="flex flex-wrap gap-2 sm:col-span-4">
            <button type="submit" name="intent" value="send" className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper hover:bg-ink/85">
              {r.quoteStatus === "sent" ? "Send the updated quote" : "Send to the educator"}
            </button>
            <button type="submit" name="intent" value="save" className="rounded-full border border-ink/20 px-4 py-1.5 text-sm font-medium hover:border-ink">
              Save without sending
            </button>
          </div>
        </form>
        <div className="flex flex-col gap-2 border-t border-rule pt-3 sm:flex-row sm:items-start sm:justify-between">
          <form action={waiveFeeAction} className="flex flex-1 flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={r.id} />
            <input name="reason" required minLength={10} placeholder="Why the fee is waived, for the record" aria-label="Why the fee is waived" className="h-9 flex-1 rounded-lg border border-rule bg-paper px-2 text-sm" />
            <button type="submit" className="rounded-full border border-ink/20 px-3 py-1.5 text-sm font-medium hover:border-ink">
              Waive the fee and allow work to start
            </button>
          </form>
          {(r.quoteStatus === "sent" || r.quoteStatus === "draft") && (
            <form action={withdrawQuoteAction}>
              <input type="hidden" name="id" value={r.id} />
              <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-medium text-destructive hover:underline">
                Withdraw the quote
              </button>
            </form>
          )}
        </div>
      </div>
    </details>
  );
}
