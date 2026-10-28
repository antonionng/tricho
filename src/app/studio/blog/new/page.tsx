import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Field, Notice, PageHeader, NoAccess, fieldClass } from "@/components/studio/ui";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { BLOG_CATEGORIES } from "@/content/blog";
import { SOURCE_LIBRARY } from "@/content/blog/sources";
import { aiAvailable } from "@/agents/ai";
import { studioPage } from "../../_lib/guard";
import { createBlogPost } from "../actions";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  "Can a hairdresser spot alopecia areata?",
  "What should a trichologist put in a referral letter to a GP?",
  "Is hair dye safe if you have a sensitive scalp?",
  "Why is my scalp itchy but not flaky?",
];

export default async function NewBlogPostPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const staff = await studioPage("/studio/blog/new", "gazette.edit");
  if (!staff) return <NoAccess what="writing blog posts" />;
  const sp = await searchParams;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Write a post with AI"
        intro="Give the writer one real question. It plans the post, reads trusted sources, writes a draft, fact-checks it against those sources and fixes what it finds. It takes two to four minutes, and nothing goes live until you publish it."
      />
      {!aiAvailable() && <Notice tone="danger">AI_GATEWAY_API_KEY isn&apos;t set, so this will create an empty draft for you to write by hand.</Notice>}
      {sp.notice && <Notice tone="danger">{sp.notice}</Notice>}

      <form action={createBlogPost} className="space-y-6">
        <Field label="What question should the post answer?" hint="Write it the way a client or colleague would ask it, or type it into Google.">
          <input name="targetQuery" required minLength={8} maxLength={200} className={`${fieldClass} text-base`} placeholder={EXAMPLES[0]} autoFocus />
        </Field>
        <p className="-mt-3 text-xs text-muted-foreground">Ideas: {EXAMPLES.slice(1).join(" · ")}</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Who is it for?">
            <select name="audience" defaultValue="both" className={fieldClass}>
              <option value="both">Professionals and the public</option>
              <option value="professional">Hair and scalp professionals</option>
              <option value="public">Clients and the public</option>
            </select>
          </Field>
          <Field label="Topic" hint="Leave on automatic and the writer will choose.">
            <select name="category" defaultValue="" className={fieldClass}>
              <option value="">Automatic</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Your angle (optional)" hint="What should it include, who has been asking, what do people get wrong? Notes are fine.">
          <textarea name="brief" rows={4} className={fieldClass} placeholder="Members keep asking about this after the Ireland conference. Include what to say to the client and what to write in the notes." />
        </Field>

        <Field label="Extra sources to read (optional)" hint="Full https addresses, one per line. The writer only cites pages it has read.">
          <textarea name="sourceUrls" rows={3} className={`${fieldClass} font-mono text-xs`} placeholder="https://www.bad.org.uk/pils/…" />
        </Field>

        <details className="rounded-2xl border border-rule bg-card px-5 py-4 text-sm">
          <summary className="cursor-pointer font-medium">The writer always has these {SOURCE_LIBRARY.length} trusted sources to choose from</summary>
          <ul className="mt-3 grid gap-1 text-muted-foreground sm:grid-cols-2">
            {SOURCE_LIBRARY.map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ul>
        </details>

        <div className="flex items-center gap-3">
          <SubmitButton pendingLabel="Starting the writer…">
            <Sparkles /> Start writing
          </SubmitButton>
          <Link href="/studio/blog" className="text-sm text-muted-foreground hover:text-ink">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
