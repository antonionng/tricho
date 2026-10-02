import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import {
  Card,
  Empty,
  Field,
  NoAccess,
  Notice,
  PageHeader,
  Section,
  Stat,
  Tag,
  TextLink,
  dateOnly,
  dateTime,
  fieldClass,
} from "@/components/studio/ui";
import { STAFF_ROLE_LABEL, type StaffRoleId } from "@/config/staff";
import { subscriptionTiers } from "@/config/subscriptions";
import { isEnvOwner } from "@/lib/staff";
import { memberDetail } from "@/lib/members-admin";
import { ACCESS_LABEL, accessState } from "@/lib/members-filter";
import { studioPage } from "../../_lib/guard";
import {
  addNoteAction,
  banMemberAction,
  muteMemberAction,
  restoreMemberAction,
  setCompPlanAction,
  setMemberRoleAction,
  suspendMemberAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Search = { notice?: string; tone?: string; confirm?: string };

const ROLE_LABEL: Record<string, string> = {
  individual: "Individual",
  trichologist: "Practitioner",
  business: "Business",
  admin: "Admin (old role)",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

function Hidden({ id }: { id: string }) {
  return <input type="hidden" name="id" value={id} />;
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const staff = await studioPage(`/studio/members/${id}`, "members.view");
  if (!staff) return <NoAccess what="members" />;
  const sp = await searchParams;

  const detail = await memberDetail(id);
  if (!detail) notFound();
  const { user, posts, reports, rsvps, notes, activity, membership } = detail;

  const can = (p: Parameters<typeof staff.perms.has>[0]) => staff.perms.has(p);
  const now = new Date();
  const access = accessState(user, now);
  const onTeam = !!user.staffRole || isEnvOwner(user.email);
  const isSelf = user.id === staff.userId;
  const paying = !!user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now;
  const compActive = !!user.compPlan && (!user.compUntil || user.compUntil > now);
  const tierName = (plan: string | null | undefined) => subscriptionTiers.find((t) => t.id === plan)?.name ?? "None";
  const confirmingBan = sp.confirm === "ban" && can("members.ban") && !onTeam && !isSelf;

  return (
    <div className="space-y-10">
      <PageHeader
        title={user.name ?? user.email ?? "Member"}
        intro={
          <>
            {user.email}
            {user.profile?.location ? `, ${user.profile.location}` : ""}. Joined on {dateOnly(user.createdAt)}.
          </>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/studio/members">Back to members</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {membership.isActive ? <Tag tone="positive">{membership.tierName ?? "Member"}</Tag> : <Tag>No active membership</Tag>}
        {compActive && <Tag tone="ink">Complimentary</Tag>}
        {user.isFounding && <Tag>Founding</Tag>}
        {access !== "active" && <Tag tone={access === "muted" ? "warn" : "danger"}>{ACCESS_LABEL[access]}</Tag>}
        {user.staffRole && <Tag tone="ink">{STAFF_ROLE_LABEL[user.staffRole as StaffRoleId]}</Tag>}
      </div>

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {confirmingBan && (
        <div className="space-y-3 rounded-2xl border-2 border-destructive bg-card p-5">
          <p className="font-medium text-ink">Ban {user.name ?? user.email} from Trichollective?</p>
          <p className="text-sm leading-relaxed text-ink-2">
            They will be signed out straight away and will not be able to sign in again. Their posts stay where they are unless you
            hide them. Banning does not cancel their Stripe subscription, so if they pay for membership you need to cancel it in
            Stripe as well. They will receive a short email saying their account has been closed.
          </p>
          <form action={banMemberAction} className="space-y-3">
            <Hidden id={user.id} />
            <input type="hidden" name="confirm" value="yes" />
            <Field label="Reason" hint="Included in the email they receive and kept in the audit log.">
              <textarea name="reason" rows={2} maxLength={500} className={fieldClass} />
            </Field>
            <div className="flex gap-2">
              <SubmitButton variant="destructive" pendingLabel="Banning…">
                Yes, ban this member
              </SubmitButton>
              <Button asChild variant="outline">
                <Link href={`/studio/members/${user.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      )}

      <Section title="Membership" intro="What they pay for, and anything the team has given them.">
        <Card>
          <dl>
            <Row label="Plan">
              {membership.isActive ? membership.tierName : "No active membership"}
              {membership.via && !membership.complimentary ? `, provided by ${membership.via}` : ""}
              {membership.complimentary ? ", complimentary" : ""}
            </Row>
            <Row label="Plan on record">{tierName(user.plan)}</Row>
            <Row label="Stripe">
              {user.stripeSubscriptionId ? (paying ? "Paying" : "Subscription ended or unpaid") : "No subscription"}
              {user.stripeCustomerId && (
                <>
                  {" "}
                  <a
                    href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-mute underline-offset-4 hover:decoration-ink"
                  >
                    Open in Stripe
                  </a>
                </>
              )}
            </Row>
            <Row label="Paid until">{user.stripeCurrentPeriodEnd ? dateOnly(user.stripeCurrentPeriodEnd) : "Not applicable"}</Row>
            <Row label="Founding member">{user.isFounding ? "Yes" : "No"}</Row>
            <Row label="Complimentary plan">
              {user.compPlan
                ? `${tierName(user.compPlan)}${user.compUntil ? `, ${compActive ? "until" : "ended on"} ${dateOnly(user.compUntil)}` : ", with no end date"}`
                : "None"}
            </Row>
            <Row label="Member type">{ROLE_LABEL[user.role] ?? user.role}</Row>
            <Row label="Team role">
              {user.staffRole ? STAFF_ROLE_LABEL[user.staffRole as StaffRoleId] : "Not on the team"}
              {can("staff.manage") && (
                <>
                  {" "}
                  <TextLink href="/studio/team">Manage the team</TextLink>
                </>
              )}
            </Row>
          </dl>
        </Card>

        {can("members.edit") && (
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="space-y-3">
              <p className="font-medium text-ink">Give a complimentary plan</p>
              <p className="text-sm text-ink-2">
                A complimentary plan works like a paid one without Stripe, which suits speakers, partners and press. Leave the end
                date empty to keep it until you take it away.
              </p>
              <form action={setCompPlanAction} className="flex flex-wrap items-end gap-2">
                <Hidden id={user.id} />
                <Field label="Plan">
                  <select name="plan" defaultValue={user.compPlan ?? "none"} className={`${fieldClass} w-auto py-2`}>
                    <option value="none">No complimentary plan</option>
                    {subscriptionTiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ends on">
                  <input
                    type="date"
                    name="until"
                    defaultValue={user.compUntil ? user.compUntil.toISOString().slice(0, 10) : ""}
                    className={`${fieldClass} w-auto py-2`}
                  />
                </Field>
                <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                  Save plan
                </SubmitButton>
              </form>
            </Card>

            <Card className="space-y-3">
              <p className="font-medium text-ink">Member type</p>
              {user.role === "admin" ? (
                <p className="text-sm text-ink-2">
                  This account has the old admin role. Their access is managed on the Team page.
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-2">
                    The member type decides which rooms they can enter. It normally follows their plan, so change it only to correct a
                    mistake.
                  </p>
                  <form action={setMemberRoleAction} className="flex flex-wrap items-end gap-2">
                    <Hidden id={user.id} />
                    <select name="role" defaultValue={user.role} aria-label="Member type" className={`${fieldClass} w-auto py-2`}>
                      <option value="individual">Individual</option>
                      <option value="trichologist">Practitioner</option>
                      <option value="business">Business</option>
                    </select>
                    <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                      Save member type
                    </SubmitButton>
                  </form>
                </>
              )}
            </Card>
          </div>
        )}
      </Section>

      <Section title="Access" intro="Suspensions and mutes end on their own when the date passes.">
        <Card>
          {access === "active" ? (
            <p className="text-sm text-ink-2">They have full access to Trichollective.</p>
          ) : (
            <div className="space-y-1 text-sm text-ink-2">
              <p className="font-medium text-ink">
                {access === "banned"
                  ? "This account is closed and cannot sign in."
                  : access === "suspended"
                    ? `This account is suspended ${user.accessUntil ? `until ${dateTime(user.accessUntil)}` : "until the team lifts it"}.`
                    : `They can read the community but cannot post or reply until ${dateTime(user.mutedUntil)}.`}
              </p>
              {access !== "muted" && user.accessReason && <p>The reason given was: {user.accessReason}</p>}
            </div>
          )}
        </Card>

        {onTeam ? (
          <p className="text-sm text-muted-foreground">
            People on the team can&apos;t be suspended, muted or banned here. Remove them from the team on the Team page first.
          </p>
        ) : isSelf ? (
          <p className="text-sm text-muted-foreground">You can&apos;t change access to your own account.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {access !== "active" && (can("members.suspend") && (access !== "banned" || can("members.ban"))) && (
              <Card className="space-y-3">
                <p className="font-medium text-ink">Restore access</p>
                <p className="text-sm text-ink-2">
                  This lifts any suspension, ban or mute straight away.
                  {access !== "muted" ? " They will receive an email to say their account is open again." : ""}
                </p>
                <form action={restoreMemberAction}>
                  <Hidden id={user.id} />
                  <SubmitButton size="sm" pendingLabel="Restoring…">
                    Restore access
                  </SubmitButton>
                </form>
              </Card>
            )}

            {can("members.suspend") && access !== "banned" && (
              <Card className="space-y-3">
                <p className="font-medium text-ink">Suspend</p>
                <p className="text-sm text-ink-2">
                  A suspended member cannot open the member area. Their billing carries on as normal, and they receive an email with
                  the reason and the end date.
                </p>
                <form action={suspendMemberAction} className="space-y-3">
                  <Hidden id={user.id} />
                  <Field label="Reason" hint="Included in the email they receive.">
                    <textarea name="reason" rows={2} maxLength={500} className={fieldClass} />
                  </Field>
                  <div className="flex flex-wrap items-end gap-2">
                    <select name="days" defaultValue="7" aria-label="How long" className={`${fieldClass} w-auto py-2`}>
                      <option value="7">For 7 days</option>
                      <option value="30">For 30 days</option>
                      <option value="90">For 90 days</option>
                      <option value="0">Until the team lifts it</option>
                    </select>
                    <SubmitButton size="sm" variant="outline" pendingLabel="Suspending…">
                      Suspend member
                    </SubmitButton>
                  </div>
                </form>
              </Card>
            )}

            {can("members.suspend") && access === "active" && (
              <Card className="space-y-3">
                <p className="font-medium text-ink">Mute in the community</p>
                <p className="text-sm text-ink-2">
                  A muted member can still read everything but cannot post, reply or react until the mute ends. No email is sent.
                </p>
                <form action={muteMemberAction} className="flex flex-wrap items-end gap-2">
                  <Hidden id={user.id} />
                  <select name="days" defaultValue="1" aria-label="How long" className={`${fieldClass} w-auto py-2`}>
                    <option value="1">For 24 hours</option>
                    <option value="7">For 7 days</option>
                    <option value="30">For 30 days</option>
                  </select>
                  <SubmitButton size="sm" variant="outline" pendingLabel="Muting…">
                    Mute member
                  </SubmitButton>
                </form>
              </Card>
            )}

            {can("members.ban") && access !== "banned" && !confirmingBan && (
              <Card className="space-y-3">
                <p className="font-medium text-ink">Ban</p>
                <p className="text-sm text-ink-2">
                  A ban closes the account for good and signs them out. It does not cancel their Stripe subscription, so cancel that
                  in Stripe if they pay for membership.
                </p>
                <form action={banMemberAction}>
                  <Hidden id={user.id} />
                  <SubmitButton size="sm" variant="destructive" pendingLabel="Opening…">
                    Ban member
                  </SubmitButton>
                </form>
              </Card>
            )}
          </div>
        )}
      </Section>

      <Section title="Community" intro="What they have shared, and any reports about it.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Posts" value={user._count.posts} />
          <Stat label="Replies" value={user._count.comments} />
          <Stat label="Reports about them" value={reports.length} />
          <Stat label="Events booked" value={rsvps.length} />
        </div>

        {posts.length === 0 ? (
          <Empty>They haven&apos;t posted in the community yet.</Empty>
        ) : (
          <Card className="divide-y divide-rule p-0">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0 space-y-0.5">
                  <Link href={`/members/community/${p.id}`} className="font-medium text-ink hover:underline">
                    {p.title || (p.content.length > 90 ? `${p.content.slice(0, 90)}…` : p.content)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {dateTime(p.createdAt)}, {p._count.comments} {p._count.comments === 1 ? "reply" : "replies"}
                  </p>
                </div>
                {p.hiddenAt && <Tag tone="warn">Hidden</Tag>}
              </div>
            ))}
          </Card>
        )}

        {reports.length > 0 && (
          <Card className="divide-y divide-rule p-0">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-ink">{r.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.commentId ? "About a reply on " : "About "}
                    <Link href={`/members/community/${r.postId}`} className="underline underline-offset-4">
                      {r.post.title || (r.post.content.length > 60 ? `${r.post.content.slice(0, 60)}…` : r.post.content)}
                    </Link>
                    , {dateTime(r.createdAt)}
                  </p>
                </div>
                {r.resolvedAt ? <Tag>{r.resolution ? r.resolution[0].toUpperCase() + r.resolution.slice(1) : "Resolved"}</Tag> : <Tag tone="warn">Open</Tag>}
              </div>
            ))}
          </Card>
        )}

        {rsvps.length > 0 && (
          <p className="text-sm text-ink-2">
            Events they have booked:{" "}
            {rsvps.map((r, i) => (
              <span key={r.event.id}>
                {i > 0 && ", "}
                {r.event.title} on {dateOnly(r.event.startsAt)}
              </span>
            ))}
            .
          </p>
        )}

        {user.listings.length > 0 && (
          <p className="text-sm text-ink-2">
            Directory listings:{" "}
            {user.listings.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ", "}
                {l.name} in {l.city} ({l.status})
              </span>
            ))}
            .
          </p>
        )}
      </Section>

      <Section title="Notes" intro="Private notes for the team. Members never see them.">
        {can("members.notes") && (
          <form action={addNoteAction} className="space-y-2">
            <Hidden id={user.id} />
            <label htmlFor="note-body" className="sr-only">
              Note
            </label>
            <textarea id="note-body" name="body" rows={3} maxLength={4000} required className={fieldClass} placeholder="Write a note for the team." />
            <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
              Save note
            </SubmitButton>
          </form>
        )}
        {notes.length === 0 ? (
          <Empty>There are no notes about this member yet.</Empty>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <Card key={n.id} className="space-y-1">
                <p className="whitespace-pre-line text-sm text-ink">{n.body}</p>
                <p className="text-xs text-muted-foreground">
                  {n.author?.name ?? n.author?.email ?? "Someone who has since left the team"}, {dateTime(n.createdAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Activity" intro="Every change the team has made to this account, newest first.">
        {activity.length === 0 ? (
          <Empty>The team hasn&apos;t changed anything on this account yet.</Empty>
        ) : (
          <Card className="divide-y divide-rule p-0">
            {activity.map((a) => (
              <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-ink">{a.summary ?? a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actorEmail}, {dateTime(a.createdAt)}
                  </p>
                </div>
                <Tag>{a.action}</Tag>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}
