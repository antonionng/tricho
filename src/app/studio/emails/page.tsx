import { PageHeader, Section, Tag, NoAccess } from "@/components/studio/ui";
import { renderEmail } from "@/lib/mail/layout";
import { ownerEmails } from "@/lib/mail/send";
import { emailGroups } from "@/lib/mail/samples";
import { studioPage } from "../_lib/guard";
import { TestSendButton } from "./TestSendButton";

export const dynamic = "force-dynamic";

const audienceLabel = {
  owners: "Owners",
  members: "Members",
  practitioners: "Practitioners",
  public: "Visitors",
  everyone: "Everyone",
} as const;

export default async function EmailsPage() {
  if (!(await studioPage("/studio/emails", "emails.view"))) return <NoAccess what="emails" />;
  const total = emailGroups.reduce((n, g) => n + g.samples.length, 0);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Emails"
        intro={
          <>
            Every one of the {total} emails Trichollective sends, shown exactly as people receive them, with sample details.
            Owner alerts go to {ownerEmails().join(" and ")}.
          </>
        }
      />

      {emailGroups.map((group) => (
        <Section key={group.title} title={group.title} intro={group.intro}>
          <div className="grid gap-6 xl:grid-cols-2">
            {group.samples.map((s) => {
              const { html } = renderEmail(s.content);
              return (
                <article key={s.id} id={s.id} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Tag>{audienceLabel[s.audience]}</Tag>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.trigger}</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Subject: </span>
                    {s.subject}
                  </p>
                  <iframe
                    title={s.name}
                    srcDoc={html}
                    sandbox=""
                    loading="lazy"
                    className="h-[560px] w-full rounded-xl border border-rule bg-[#f4f3f0]"
                  />
                  <TestSendButton id={s.id} />
                </article>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}
