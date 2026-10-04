import Link from "next/link";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Field, Notice, PageHeader, NoAccess, fieldClass } from "@/components/studio/ui";
import { DISCIPLINES, NEWS_TOPICS } from "@/content/gazette/schema";
import { news } from "@/content/news";
import { aiAvailable } from "@/agents/ai";
import { studioPage } from "../../_lib/guard";
import { createEditionAction } from "../actions";
import { ImagePicker } from "../ImagePicker";

export const dynamic = "force-dynamic";

const DISCIPLINE_LABEL = { cosmetic: "Cosmetic", clinical: "Clinical", medical: "Medical" } as const;

const TOPIC_LABEL: Record<(typeof NEWS_TOPICS)[number], string> = {
  "hair-loss": "Hair loss",
  regulation: "Regulation",
  products: "Products",
  devices: "Devices",
  research: "Research",
  "head-spa": "Head spa",
  business: "Business",
  events: "Events",
};

export default async function NewEditionPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  if (!(await studioPage("/studio/gazette/new", "gazette.edit"))) return <NoAccess what="writing Trichozette editions" />;
  const sp = await searchParams;
  const ai = aiAvailable();

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="New edition"
        intro={
          ai
            ? "Describe the edition you want. An outline is written first, then each page, and you can edit everything before it is published."
            : "AI isn't set up on this site, so the edition will start as template pages built from your brief for you to write by hand."
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <form action={createEditionAction} className="space-y-6">
        <Field
          label="Brief"
          hint="Say what the edition is about, who it is for and what readers should be able to do after reading it. Mention any angles, questions or practical tools you want included."
        >
          <textarea name="brief" required minLength={20} rows={7} className={fieldClass} placeholder="An edition on postpartum shedding that helps stylists, trichologists and nurses explain what is normal, what to watch for and when to refer." />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">Audience</legend>
          <div className="flex flex-wrap gap-4">
            {DISCIPLINES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="audience" value={d} defaultChecked /> {DISCIPLINE_LABEL[d]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Series">
            <select name="series" defaultValue="current" className={fieldClass}>
              <option value="current">Monthly magazine</option>
              <option value="archive">Archive look-back</option>
            </select>
          </Field>
          <Field label="Year covered" hint="For archive editions only.">
            <input name="period" inputMode="numeric" pattern="\d{4}" placeholder="2025" className={fieldClass} />
          </Field>
          <Field label="Number of pages" hint="Between six and ten, plus the news page.">
            <input name="pages" type="number" min={6} max={10} defaultValue={8} className={fieldClass} />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">News topics</legend>
          <p className="text-xs text-muted-foreground">
            The edition&apos;s news page and sources are chosen from the {news.length} verified news items on these topics. Nothing else is cited.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {NEWS_TOPICS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="newsTopics" value={t} /> {TOPIC_LABEL[t]}{" "}
                <span className="text-xs text-muted-foreground">({news.filter((n) => n.topics.includes(t)).length})</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink">Cover photograph</p>
          <ImagePicker name="coverImageKey" value="community" label="Cover" />
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton pendingLabel="Starting…">{ai ? "Write the first draft" : "Create the edition"}</SubmitButton>
          <Link href="/studio/gazette" className="text-sm text-muted-foreground underline underline-offset-4">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
