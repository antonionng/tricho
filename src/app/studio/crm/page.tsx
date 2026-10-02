import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import {
  KIND_LABEL,
  OPEN_STAGES,
  ORG_KINDS,
  ORG_STAGES,
  STAGE_LABEL,
  buildOrgWhere,
  crmFilterQuery,
  formatGBP,
  initials,
  isFollowUpDue,
  kindLabel,
  parseCrmFilters,
  pipelineTotals,
  type CrmFilters,
  type OrgStageId,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { organisationTags, teamMembers } from "./_lib/data";
import { StageTag } from "./_lib/StageTag";
import { setStageAction } from "./actions";

export const dynamic = "force-dynamic";

const LIMIT = 300;

export default async function CrmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await studioPage("/studio/crm", "crm.view");
  if (!staff) return <NoAccess what="the business CRM" />;
  const sp = await searchParams;
  const filters = parseCrmFilters(sp);
  const notice = typeof sp.notice === "string" ? sp.notice : null;
  const canEdit = staff.perms.has("crm.edit");
  const now = new Date();

  // Totals and the board cover every stage, so the stage filter only narrows the table.
  const allStages = buildOrgWhere({ ...filters, stage: "" }, now);
  const [team, tags, totalsRows, rows, dueCount] = await Promise.all([
    teamMembers(),
    organisationTags(),
    prisma.organisation.findMany({ where: allStages, select: { stage: true, valueGBP: true } }),
    prisma.organisation.findMany({
      where: filters.view === "board" ? allStages : buildOrgWhere(filters, now),
      orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
      take: LIMIT,
      select: {
        id: true,
        name: true,
        kind: true,
        stage: true,
        interest: true,
        valueGBP: true,
        followUpAt: true,
        ownerStaffId: true,
        tags: true,
        email: true,
        city: true,
        partnerId: true,
        updatedAt: true,
        contacts: { where: { isPrimary: true }, take: 1, select: { name: true, email: true } },
      },
    }),
    prisma.organisation.count({ where: { followUpAt: { lte: now }, stage: { in: [...OPEN_STAGES, "won"] } } }),
  ]);
  const totals = pipelineTotals(totalsRows);
  const ownerName = new Map(team.map((t) => [t.id, t.name]));
  const here = `/studio/crm${crmFilterQuery(filters)}`;
  const filtered = !!(filters.q || filters.stage || filters.kind || filters.tag || filters.owner || filters.due);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Businesses"
        intro="Every brand, clinic and supplier we are talking to or working with, from the first enquiry to a live partner page."
        actions={
          <>
            {canEdit && (
              <Button asChild size="sm" variant="outline">
                <a href={`/studio/crm/export${crmFilterQuery({ ...filters, view: "table" })}`}>Download as a spreadsheet</a>
              </Button>
            )}
            {canEdit && (
              <Button asChild size="sm">
                <Link href="/studio/crm/new">New business</Link>
              </Button>
            )}
          </>
        }
      />

      {notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{notice}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open pipeline" value={formatGBP(totals.open.value)} note={`${totals.open.count} businesses are at lead, contacted or proposal.`} />
        <Stat label="Won" value={totals.byStage.won.count} note={`${formatGBP(totals.byStage.won.value)} in agreed value.`} />
        <Stat label="Customers" value={totals.byStage.customer.count} note={`${formatGBP(totals.byStage.customer.value)} a year.`} />
        <Stat label="Follow-ups due" value={dueCount} note="Open deals whose follow-up date has arrived." />
      </div>

      <Section
        title={filters.view === "board" ? "Pipeline" : "All businesses"}
        intro={
          filtered
            ? `${totals.total} ${totals.total === 1 ? "business matches" : "businesses match"} these filters.`
            : `${totals.total} ${totals.total === 1 ? "business" : "businesses"} in the CRM, with the soonest follow-up first.`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <form action="/studio/crm" className="flex gap-2" role="search">
              {(["stage", "kind", "tag", "owner"] as const).map((k) =>
                filters[k] ? <input key={k} type="hidden" name={k} value={filters[k]} /> : null
              )}
              {filters.due && <input type="hidden" name="due" value="1" />}
              {filters.view === "board" && <input type="hidden" name="view" value="board" />}
              <label htmlFor="crm-search" className="sr-only">
                Search businesses
              </label>
              <input id="crm-search" name="q" defaultValue={filters.q} placeholder="Name, email or website" className={cn(fieldClass, "w-56 py-2")} />
              <Button type="submit" size="sm" variant="outline" className="h-auto">
                Search
              </Button>
            </form>
            <div className="flex rounded-full border border-rule p-0.5 text-xs" role="group" aria-label="View">
              {(["table", "board"] as const).map((v) => (
                <Link
                  key={v}
                  href={`/studio/crm${crmFilterQuery({ ...filters, view: v })}`}
                  aria-current={filters.view === v ? "true" : undefined}
                  className={cn("rounded-full px-3 py-1.5", filters.view === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
                >
                  {v === "table" ? "Table" : "Board"}
                </Link>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {filters.view === "table" && (
            <Chips
              label="Stage"
              current={filters.stage}
              options={[
                { value: "", label: "Any stage" },
                { value: "open", label: "Open deals" },
                ...ORG_STAGES.map((s) => ({ value: s, label: `${STAGE_LABEL[s].label} (${totals.byStage[s].count})` })),
              ]}
              href={(v) => `/studio/crm${crmFilterQuery({ ...filters, stage: v as CrmFilters["stage"] })}`}
            />
          )}
          <Chips
            label="Kind"
            current={filters.kind}
            options={[{ value: "", label: "Any kind" }, ...ORG_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))]}
            href={(v) => `/studio/crm${crmFilterQuery({ ...filters, kind: v as CrmFilters["kind"] })}`}
          />
          <Chips
            label="Owner"
            current={filters.owner}
            options={[
              { value: "", label: "Anyone" },
              { value: staff.userId, label: "Looked after by me" },
              ...team.filter((t) => t.id !== staff.userId).map((t) => ({ value: t.id, label: t.name })),
              { value: "none", label: "Nobody yet" },
            ]}
            href={(v) => `/studio/crm${crmFilterQuery({ ...filters, owner: v })}`}
          />
          {tags.length > 0 && (
            <Chips
              label="Tag"
              current={filters.tag}
              options={[{ value: "", label: "Any tag" }, ...tags.slice(0, 30).map((t) => ({ value: t, label: t }))]}
              href={(v) => `/studio/crm${crmFilterQuery({ ...filters, tag: v })}`}
            />
          )}
          <Chips
            label="Follow-up"
            current={filters.due ? "1" : ""}
            options={[
              { value: "", label: "Any date" },
              { value: "1", label: "Due now" },
            ]}
            href={(v) => `/studio/crm${crmFilterQuery({ ...filters, due: v === "1" })}`}
          />
        </div>

        {rows.length === 0 ? (
          <Empty>
            {filtered
              ? "No businesses match these filters. Try a shorter search or clear a filter."
              : "There are no businesses in the CRM yet. Partner applications appear here automatically, and you can add a business yourself."}
          </Empty>
        ) : filters.view === "board" ? (
          <div className="space-y-4">
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <div className="grid min-w-[880px] grid-cols-5 gap-3">
                {BOARD_STAGES.map((stage) => {
                  const cards = rows.filter((r) => r.stage === stage);
                  return (
                    <div key={stage} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-rule bg-paper-2/60 p-2.5">
                      <div className="flex items-baseline justify-between gap-2 px-1 pb-1">
                        <p className="text-sm font-semibold text-ink">{STAGE_LABEL[stage].label}</p>
                        <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          {totals.byStage[stage].count} · {formatGBP(totals.byStage[stage].value)}
                        </p>
                      </div>
                      {cards.length === 0 && <p className="px-1 pb-2 text-xs text-muted-foreground">Nothing at this stage.</p>}
                      {cards.map((o) => (
                        <div key={o.id} className="min-w-0 space-y-2 rounded-xl border border-rule bg-card p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/studio/crm/${o.id}`} className="min-w-0 break-words text-sm font-medium leading-snug text-ink hover:underline">
                              {o.name}
                            </Link>
                            {o.ownerStaffId && (
                              <span
                                title={`Looked after by ${ownerName.get(o.ownerStaffId) ?? "a former team member"}`}
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper"
                              >
                                {initials(ownerName.get(o.ownerStaffId))}
                              </span>
                            )}
                          </div>
                          {o.interest && <p className="line-clamp-2 text-ink-2">{o.interest}</p>}
                          {(o.valueGBP !== null || o.followUpAt) && (
                            <div className="flex flex-wrap gap-1">
                              {o.valueGBP !== null && <Tag>{formatGBP(o.valueGBP)}</Tag>}
                              {o.followUpAt && (
                                <Tag tone={isFollowUpDue(o.followUpAt, now) ? "warn" : "default"}>{dateOnly(o.followUpAt)}</Tag>
                              )}
                            </div>
                          )}
                          {canEdit && <StageMover id={o.id} name={o.name} stage={o.stage} here={here} />}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-rule bg-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3">
                <p className="text-sm font-semibold text-ink">Closed</p>
                <p className="text-xs text-muted-foreground">
                  {totals.byStage.lost.count} lost and {totals.byStage.churned.count} churned. They stay on record for a later conversation.
                </p>
              </div>
              {rows.filter((r) => r.stage === "lost" || r.stage === "churned").length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">No businesses have been lost or have cancelled.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {rows
                    .filter((r) => r.stage === "lost" || r.stage === "churned")
                    .map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <Link href={`/studio/crm/${o.id}`} className="truncate font-medium text-ink hover:underline">
                            {o.name}
                          </Link>
                          <StageTag stage={o.stage} />
                        </span>
                        {canEdit && <StageMover id={o.id} name={o.name} stage={o.stage} here={here} inline />}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Interest</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Looked after by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const contact = o.contacts[0];
                  return (
                    <tr key={o.id} className="border-b border-rule align-top last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/studio/crm/${o.id}`} className="font-medium text-ink hover:underline">
                          {o.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {[kindLabel(o.kind), o.city, contact ? contact.name : o.email].filter(Boolean).join(" · ")}
                        </p>
                        {(o.tags.length > 0 || o.partnerId) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {o.partnerId && <Tag tone="ink">Brand page</Tag>}
                            {o.tags.map((t) => (
                              <Tag key={t}>{t}</Tag>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StageTag stage={o.stage as OrgStageId} />
                      </td>
                      <td className="px-4 py-3 text-ink-2">{o.interest ?? "–"}</td>
                      <td className="px-4 py-3 tabular-nums">{o.valueGBP !== null ? formatGBP(o.valueGBP) : "–"}</td>
                      <td className="px-4 py-3">
                        {o.followUpAt ? (
                          <span className={cn(isFollowUpDue(o.followUpAt, now) && "font-medium text-amber-800")}>{dateOnly(o.followUpAt)}</span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-2">
                        {o.ownerStaffId ? ownerName.get(o.ownerStaffId) ?? "A former team member" : <span className="text-muted-foreground">Nobody yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length >= LIMIT && (
          <p className="text-xs text-muted-foreground">
            The first {LIMIT} businesses are shown. Search or filter to find the rest.
          </p>
        )}
      </Section>

      <details className="group rounded-2xl border border-rule bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-ink">
          What each stage means
          <span className="ml-2 font-normal text-muted-foreground group-open:hidden">Show the definitions</span>
        </summary>
        <dl className="grid gap-x-8 gap-y-4 border-t border-rule px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {ORG_STAGES.map((s) => (
            <div key={s}>
              <dt className="text-sm font-medium text-ink">{STAGE_LABEL[s].label}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-2">{STAGE_LABEL[s].description}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function Chips({
  label,
  current,
  options,
  href,
}: {
  label: string;
  current: string;
  options: { value: string; label: string }[];
  href: (value: string) => string;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={label}>
      <span className="mr-1 w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
      {options.map((o) => {
        const on = current === o.value;
        return (
          <Link
            key={o.value || "any"}
            href={href(o.value)}
            aria-current={on ? "true" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
              on ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink"
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

const BOARD_STAGES = ["lead", "contacted", "proposal", "won", "customer"] as const;

function StageMover({ id, name, stage, here, inline }: { id: string; name: string; stage: string; here: string; inline?: boolean }) {
  return (
    <form action={setStageAction} className={cn("flex gap-1.5", inline ? "items-center" : "flex-col")}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return" value={here} />
      <select name="stage" defaultValue={stage} aria-label={`Stage for ${name}`} className={cn(fieldClass, "w-full min-w-0 px-2 py-1.5 text-xs", inline && "w-36")}>
        {ORG_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s].label}
          </option>
        ))}
      </select>
      <SubmitButton size="sm" variant="outline" className="h-8 text-xs" pendingLabel="Moving…">
        Move
      </SubmitButton>
    </form>
  );
}
