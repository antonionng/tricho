import Link from "next/link";
import { tierById } from "@/config/subscriptions";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateOnly } from "@/components/studio/ui";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { RETENTION_SEGMENTS, SEGMENT_INFO, isRetentionSegment, keyDate, mayEmail, type RetentionSegment } from "@/lib/retention";
import { NUDGE_CAP, loadRetention } from "@/lib/retention-data";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { draftNudgesAction } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

export default async function RetentionPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; notice?: string; tone?: string }>;
}) {
  const staff = await studioPage("/studio/retention", "retention.view");
  if (!staff) return <NoAccess what="retention" />;
  const sp = await searchParams;
  const now = new Date();
  const { rows, counts } = await loadRetention(now);

  const firstWithPeople = RETENTION_SEGMENTS.find((s) => counts[s] > 0 && SEGMENT_INFO[s].attention);
  const segment: RetentionSegment = isRetentionSegment(sp.segment) ? sp.segment : firstWithPeople ?? "cancelling";
  const info = SEGMENT_INFO[segment];
  const members = rows.filter((r) => r.segments.includes(segment));
  const shown = members.slice(0, PAGE_SIZE);
  const canDraft = staff.perms.has("members.edit");
  const reachable = members.filter((m) => mayEmail(segment, m.emailUpdates)).length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Retention"
        intro="See which members may be about to leave, have already lapsed or have gone quiet, and draft a personal note to each of them for approval in the inbox."
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {RETENTION_SEGMENTS.map((s) => (
          <Link
            key={s}
            href={`/studio/retention?segment=${s}`}
            aria-current={s === segment ? "page" : undefined}
            className={cn("rounded-2xl", s === segment && "ring-2 ring-ink")}
          >
            <Stat label={SEGMENT_INFO[s].label} value={counts[s]} note={SEGMENT_INFO[s].attention ? undefined : "For information"} />
          </Link>
        ))}
      </div>

      <Section
        title={info.label}
        intro={`${info.description} ${info.action}`}
        actions={
          canDraft && members.length > 0 ? (
            <form action={draftNudgesAction}>
              <input type="hidden" name="segment" value={segment} />
              <SubmitButton size="sm" variant="outline" pendingLabel="Drafting…" disabled={reachable === 0}>
                {members.length > NUDGE_CAP ? `Draft nudges for the first ${NUDGE_CAP} in this list` : "Draft nudges for everyone in this list"}
              </SubmitButton>
            </form>
          ) : undefined
        }
      >
        <p className="text-xs text-muted-foreground">
          {info.service
            ? "These are service emails, so they can go to members who have opted out of optional updates."
            : "Members who have opted out of optional emails are left out when drafting."}{" "}
          Each member receives at most one note from this list a month, and every draft waits in the inbox until someone approves it.
          {!canDraft && " Drafting notes needs permission to edit members, which an owner can give you."}
        </p>

        {members.length === 0 ? (
          <Empty>Nobody is in this list at the moment, so no one here needs attention.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">{info.keyDateLabel}</th>
                  <th className="px-4 py-3 font-medium">Last seen</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => {
                  const comp = !!m.compPlan && (!m.compUntil || m.compUntil > now);
                  const plan = tierById(m.plan ?? (comp ? m.compPlan : null))?.name;
                  const emailable = mayEmail(segment, m.emailUpdates);
                  return (
                    <tr key={m.id} className="border-b border-rule align-top last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/studio/members/${m.id}`} className="font-medium text-ink hover:underline">
                          {m.name ?? "No name yet"}
                        </Link>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                        {m.segments.length > 1 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.segments
                              .filter((s) => s !== segment)
                              .map((s) => (
                                <Tag key={s}>{SEGMENT_INFO[s].label}</Tag>
                              ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span>{plan ?? "No plan"}</span>
                          {comp && <Tag tone="ink">Complimentary</Tag>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{dateOnly(keyDate(segment, m)) || "–"}</td>
                      <td className="px-4 py-3 text-ink-2">{dateOnly(m.lastSeenAt) || "Not recorded"}</td>
                      <td className="px-4 py-3 text-right">
                        {canDraft &&
                          (emailable ? (
                            <form action={draftNudgesAction}>
                              <input type="hidden" name="segment" value={segment} />
                              <input type="hidden" name="userId" value={m.id} />
                              <SubmitButton size="sm" variant="outline" pendingLabel="Drafting…">
                                Draft a nudge
                              </SubmitButton>
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground">Opted out of optional emails</span>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {members.length > shown.length && (
          <p className="text-xs text-muted-foreground">
            The first {PAGE_SIZE} of {members.length} members in this list are shown, newest accounts first.
          </p>
        )}
      </Section>
    </div>
  );
}
