import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { hasEducatorAccess } from "@/lib/educator-rules";
import { studioPage } from "../_lib/guard";
import { decideEducatorAction, setEducatorShareAction } from "./actions";

const STATUS: Record<string, { label: string; tone: "default" | "positive" | "warn" | "danger" }> = {
  pending_review: { label: "Waiting for approval", tone: "warn" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Rejected", tone: "danger" },
  suspended: { label: "Suspended", tone: "danger" },
  lapsed: { label: "Membership ended", tone: "default" },
};

const ORDER = ["pending_review", "approved", "suspended", "lapsed", "rejected"];

export default async function StudioEducatorsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/educators", "courses.view");
  if (!staff) return <NoAccess what="educators" />;
  const { notice, tone } = await searchParams;
  const canDecide = staff.perms.has("courses.review");

  const educators = await prisma.educatorProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, email: true } }, courses: { select: { id: true, title: true, status: true } } },
  });
  educators.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const waiting = educators.filter((e) => e.status === "pending_review").length;
  const openRequests = await prisma.courseRequest.count({ where: { status: "new" } }).catch(() => 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Educators"
        intro="Educators pay for the year when they join, then wait for approval. Approve the ones who can teach within their scope of practice; rejecting someone refunds their fee. Only approved educators can send courses for review."
        actions={
          <Link href="/studio/educators/requests" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:border-ink">
            Tailored course requests{openRequests ? ` (${openRequests})` : ""}
          </Link>
        }
      />
      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}
      <Section title={waiting ? `${waiting} waiting for approval` : "All educators"}>
        {educators.length === 0 ? (
          <Empty>No one has joined as an Educator yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {educators.map((e) => (
              <li key={e.id} id={`e-${e.id}`} className="scroll-mt-20 rounded-2xl border border-rule bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag tone={STATUS[e.status]?.tone ?? "default"}>{STATUS[e.status]?.label ?? e.status}</Tag>
                      {!hasEducatorAccess(e) && e.status !== "rejected" && <Tag>Not paid up</Tag>}
                      {e.cancelAtPeriodEnd && <Tag>Cancelling</Tag>}
                    </div>
                    <p className="text-lg font-medium">
                      <Link href={`/studio/members/${e.user.id}`} className="underline-offset-4 hover:underline">
                        {e.displayName}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {e.user.email} · joined {dateOnly(e.createdAt)} · {e.currentPeriodEnd ? `paid to ${dateOnly(e.currentPeriodEnd)}` : "no payment recorded"} · terms {e.termsVersion ?? "not recorded"}
                    </p>
                    {e.headline && <p className="text-sm">{e.headline}</p>}
                  </div>
                  {canDecide && (
                    <form action={setEducatorShareAction} className="flex shrink-0 items-center gap-2 text-sm">
                      <input type="hidden" name="id" value={e.id} />
                      <label htmlFor={`share-${e.id}`}>Share</label>
                      <input id={`share-${e.id}`} name="sharePct" type="number" min={0} max={100} defaultValue={e.sharePct} className="h-9 w-16 rounded-lg border border-rule bg-paper px-2 tabular-nums" />
                      <span>%</span>
                      <button type="submit" className="rounded-full border border-ink/20 px-3 py-1.5 font-medium hover:border-ink">
                        Save
                      </button>
                    </form>
                  )}
                </div>

                {(e.credentials || e.bio) && (
                  <details className="mt-3 text-sm" open={e.status === "pending_review"}>
                    <summary className="cursor-pointer text-muted-foreground">Profile and credentials</summary>
                    {e.credentials && <p className="mt-2 whitespace-pre-line"><strong>Qualifications:</strong> {e.credentials}</p>}
                    {e.bio && <p className="mt-2 whitespace-pre-line text-ink-2">{e.bio}</p>}
                    {e.topics.length > 0 && <p className="mt-2 text-ink-2">Teaches: {e.topics.join(", ")}</p>}
                  </details>
                )}
                {e.status === "pending_review" && !e.credentials && <p className="mt-3 text-sm text-muted-foreground">They haven&apos;t added their qualifications yet.</p>}

                {e.courses.length > 0 && (
                  <p className="mt-3 text-sm text-ink-2">
                    Courses:{" "}
                    {e.courses.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ", "}
                        <Link href={`/studio/courses/${c.id}`} className="underline underline-offset-4">
                          {c.title}
                        </Link>{" "}
                        ({c.status.replace("_", " ")})
                      </span>
                    ))}
                  </p>
                )}
                {e.reviewNote && e.status !== "pending_review" && <p className="mt-2 text-sm text-muted-foreground">Note: {e.reviewNote}</p>}

                {canDecide && e.status === "pending_review" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-start">
                    <DecisionForm id={e.id} decision="approve" label="Approve" primary />
                    <DecisionForm id={e.id} decision="reject" label="Reject" note refund />
                  </div>
                )}
                {canDecide && e.status === "approved" && (
                  <div className="mt-4 border-t border-rule pt-4">
                    <DecisionForm id={e.id} decision="suspend" label="Suspend and take their courses off sale" note />
                  </div>
                )}
                {canDecide && e.status === "suspended" && (
                  <div className="mt-4 border-t border-rule pt-4">
                    <DecisionForm id={e.id} decision="reinstate" label="Reinstate" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** One decision per form, with the decision in a hidden field, so it never depends on which button the browser reports. */
function DecisionForm({ id, decision, label, primary, note, refund }: { id: string; decision: string; label: string; primary?: boolean; note?: boolean; refund?: boolean }) {
  return (
    <form action={decideEducatorAction} className={note ? "flex flex-1 flex-col gap-2" : "shrink-0"}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      {note && <textarea name="note" rows={2} required minLength={10} placeholder="Why? The educator sees this note." className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-sm" />}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className={
            primary
              ? "rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/85"
              : decision === "reinstate"
                ? "rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:border-ink"
                : "rounded-full border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
          }
        >
          {label}
        </button>
        {refund && (
          <label className="flex items-center gap-1.5 text-sm text-ink-2">
            <input type="checkbox" name="refund" defaultChecked /> Refund their fee and cancel the subscription
          </label>
        )}
      </div>
    </form>
  );
}
