import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isEnvOwner } from "@/lib/staff";
import { STAFF_ROLES, STAFF_ROLE_DESCRIPTION, STAFF_ROLE_LABEL, ROLE_PERMISSIONS, type StaffRoleId } from "@/config/staff";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Tag, fieldClass } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { assignStaffRoleAction, findMemberAction, revokeStaffRoleAction } from "./actions";

export const dynamic = "force-dynamic";

type Search = { notice?: string; tone?: string; add?: string; confirmRevoke?: string };

function RolePicker({ id, current, label }: { id: string; current?: StaffRoleId | null; label: string }) {
  return (
    <form action={assignStaffRoleAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="role" defaultValue={current ?? "editor"} className={`${fieldClass} w-auto py-1.5`} aria-label="Role">
        {STAFF_ROLES.map((r) => (
          <option key={r} value={r}>
            {STAFF_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
        {label}
      </SubmitButton>
    </form>
  );
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<Search> }) {
  const me = await studioPage("/studio/team", "staff.manage");
  if (!me) return <NoAccess what="managing the team" />;
  const sp = await searchParams;

  const [team, adding, revoking] = await Promise.all([
    prisma.user.findMany({
      where: { staffRole: { not: null } },
      orderBy: [{ staffRole: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, staffRole: true, createdAt: true },
    }),
    sp.add ? prisma.user.findUnique({ where: { id: sp.add }, select: { id: true, name: true, email: true, staffRole: true } }) : null,
    sp.confirmRevoke
      ? prisma.user.findUnique({ where: { id: sp.confirmRevoke }, select: { id: true, name: true, email: true } })
      : null,
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Team"
        intro="Choose who works in Studio and what each person looks after. Every change is recorded in the audit log."
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {revoking && (
        <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-5">
          <p className="font-medium text-ink">Remove {revoking.name ?? revoking.email} from the team?</p>
          <p className="text-sm text-ink-2">
            They will keep their membership, but they will no longer be able to open Studio. You can add them back at any time.
          </p>
          <div className="flex gap-2">
            <form action={revokeStaffRoleAction}>
              <input type="hidden" name="id" value={revoking.id} />
              <input type="hidden" name="confirm" value="yes" />
              <SubmitButton pendingLabel="Removing…">Yes, remove their access</SubmitButton>
            </form>
            <Button asChild variant="outline">
              <Link href="/studio/team">Cancel</Link>
            </Button>
          </div>
        </div>
      )}

      <Section title="People on the team" intro="Owners named in the site settings always stay owners, so the team can never be locked out.">
        {team.length === 0 ? (
          <Empty>Nobody on the team has a role yet, so add someone below to give them access to Studio.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Change role</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {team.map((u) => {
                  const pinned = isEnvOwner(u.email);
                  const role = u.staffRole as StaffRoleId;
                  return (
                    <tr key={u.id} className="bg-card align-middle">
                      <td className="px-4 py-3">
                        <Link href={`/studio/members/${u.id}`} className="font-medium text-ink hover:underline">
                          {u.name ?? u.email}
                        </Link>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Tag tone={role === "owner" ? "ink" : "default"}>{STAFF_ROLE_LABEL[role]}</Tag>
                        {u.id === me.userId && <span className="ml-2 text-xs text-muted-foreground">You</span>}
                      </td>
                      <td className="px-4 py-3">
                        {pinned ? (
                          <span className="text-xs text-muted-foreground">Set in the site settings</span>
                        ) : (
                          <RolePicker id={u.id} current={role} label="Change" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!pinned && (
                          <Link href={`/studio/team?confirmRevoke=${u.id}`} className="text-sm text-ink-2 underline underline-offset-4">
                            Remove
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Add someone to the team" intro="They need to have signed in to Trichollective at least once. They will get an email explaining their role.">
        {adding ? (
          <Card className="space-y-3">
            <p className="text-sm text-ink">
              Choose a role for <strong>{adding.name ?? adding.email}</strong> ({adding.email}).
            </p>
            <RolePicker id={adding.id} current={(adding.staffRole as StaffRoleId) ?? null} label="Add to the team" />
          </Card>
        ) : (
          <form action={findMemberAction} className="flex max-w-lg gap-2">
            <input name="email" type="email" required placeholder="Their sign-in email" className={fieldClass} />
            <SubmitButton pendingLabel="Looking…">Find</SubmitButton>
          </form>
        )}
      </Section>

      <Section title="What each role can do">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STAFF_ROLES.map((r) => (
            <Card key={r} className="space-y-2">
              <p className="font-medium text-ink">{STAFF_ROLE_LABEL[r]}</p>
              <p className="text-sm leading-relaxed text-ink-2">{STAFF_ROLE_DESCRIPTION[r]}</p>
              <p className="text-xs text-muted-foreground">{ROLE_PERMISSIONS[r].length} permissions</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
