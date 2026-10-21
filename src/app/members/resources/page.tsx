import { redirect } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { MemberPage, PageHeader } from "@/components/members/MemberPage";
import { getMemberContext } from "@/lib/member";
import { resourceKindLabel, resources } from "@/content/resources";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/resources");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Practice resources"
        body="Printable consultation records, referral templates and client handouts are part of membership."
      />
    );
  }

  return (
    <MemberPage>
      <PageHeader
        label="Resources"
        title="Practice resources"
        lede="Records, guides and handouts written for the consultation room. Print them, or keep them on a tablet, and use the same sheet every time so that your notes compare like with like."
      />


      <ul className="grid gap-4 md:grid-cols-2">
        {resources.map((r) => (
          <li key={r.slug} className="flex flex-col gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2">
                <FileText className="h-5 w-5 stroke-[1.5]" aria-hidden />
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                <Pill tone={r.kind === "handout" ? "ink" : "default"}>{resourceKindLabel[r.kind]}</Pill>
                <Pill>
                  {r.pages.length} {r.pages.length === 1 ? "page" : "pages"}, A4 {r.orientation}
                </Pill>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{r.title}</h2>
              <p className="text-[15px] leading-relaxed text-ink-2">{r.summary}</p>
            </div>
            <ul className="flex flex-col gap-1 text-sm text-ink-2">
              {r.inside.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm">
              <a
                href={`/api/resources/${r.slug}`}
                download={`${r.filename}.pdf`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 font-medium text-paper"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Download PDF
              </a>
              <a
                href={`/api/resources/${r.slug}?view=1`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-10 items-center gap-1.5 text-ink underline underline-offset-4"
              >
                Open in a new tab <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Every resource is a teaching aid for practitioners working within their training and scope. None is a
        validated diagnostic tool, and none replaces assessment by a clinician. If you would like a resource
        written for your discipline, ask in the community and we will add it to the list.
      </p>
    </MemberPage>
  );
}
