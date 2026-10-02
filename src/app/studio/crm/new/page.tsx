import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Field, NoAccess, Notice, PageHeader, fieldClass } from "@/components/studio/ui";
import { KIND_LABEL, OPEN_STAGES, ORG_KINDS, STAGE_LABEL } from "@/lib/crm";
import { studioPage } from "../../_lib/guard";
import { createOrganisationAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/crm/new", "crm.edit");
  if (!staff) return <NoAccess what="adding businesses to the CRM" />;
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <PageHeader
        title="New business"
        intro="Add a brand, clinic or supplier you have met or want to approach. You can fill in the rest of their details once they are saved."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/studio/crm">Back to businesses</Link>
          </Button>
        }
      />
      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <Card className="max-w-2xl">
        <form action={createOrganisationAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" className="sm:col-span-2">
            <input name="name" required minLength={2} maxLength={160} className={fieldClass} />
          </Field>
          <Field label="Kind">
            <select name="kind" defaultValue="brand" className={fieldClass}>
              {ORG_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stage">
            <select name="stage" defaultValue="lead" className={fieldClass}>
              {[...OPEN_STAGES, "won", "customer"].map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s as keyof typeof STAGE_LABEL].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Business email">
            <input name="email" type="email" maxLength={160} className={fieldClass} />
          </Field>
          <Field label="Website">
            <input name="website" maxLength={500} placeholder="example.com" className={fieldClass} />
          </Field>
          <Field label="What they are interested in" hint="For example Premium Business, advertising or a talk at an event.">
            <input name="interest" maxLength={120} className={fieldClass} />
          </Field>
          <Field label="Rough value a year, in pounds" hint="This feeds the pipeline totals.">
            <input name="valueGBP" inputMode="numeric" maxLength={12} className={fieldClass} />
          </Field>
          <Field label="Main contact's name">
            <input name="contactName" maxLength={160} className={fieldClass} />
          </Field>
          <Field label="Main contact's email" hint="If they have a member account, it will be linked automatically.">
            <input name="contactEmail" type="email" maxLength={160} className={fieldClass} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Adding…">Add business</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
