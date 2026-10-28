"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ExternalLink, Eye, Plus, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Tag, fieldClass } from "@/components/studio/ui";
import { PostBody } from "@/components/blog/PostBody";
import { scorePost, type CheckGroup } from "@/content/blog/quality";
import type { BlogPost } from "@/content/blog";
import type { WriterState } from "@/content/blog/writer";
import { cn } from "@/lib/utils";
import { archiveBlogPost, publishBlogPost, rewriteBlogPost, saveBlogPost, unpublishBlogPost, type SaveResult } from "../actions";
import type { EditorData } from "../types";

type Option = { value: string; label: string };
type Options = { categories: Option[]; authors: Option[]; images: (Option & { src: string })[]; guides: Option[]; glossary: Option[] };

const GROUPS: CheckGroup[] = ["Answer engines", "Search", "Trust", "Style"];

function Counter({ value, min, max, unit = "characters" }: { value: number; min: number; max: number; unit?: string }) {
  const ok = value >= min && value <= max;
  return (
    <span className={cn("tabular-nums", ok ? "text-positive" : "text-amber-700")}>
      {value} {unit} · aim for {min} to {max}
    </span>
  );
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function Editor({
  id,
  status,
  initial,
  ai,
  canEdit,
  canPublish,
  options,
}: {
  id: string;
  status: string;
  initial: EditorData;
  ai: WriterState | null;
  canEdit: boolean;
  canPublish: boolean;
  options: Options;
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, start] = useTransition();
  const [bodyTab, setBodyTab] = useState<"write" | "preview">("write");
  const [note, setNote] = useState("");
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const live = status === "published";

  const set = <K extends keyof EditorData>(key: K, value: EditorData[K]) => setD((prev) => ({ ...prev, [key]: value }));

  const { score, checks } = useMemo(
    () =>
      scorePost({
        title: d.title,
        description: d.description,
        slug: d.slug,
        answer: d.answer,
        takeaways: d.takeaways.split("\n").filter((t) => t.trim()),
        body: d.body,
        faqs: d.faqs,
        sources: d.sources,
        tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
        category: d.category as BlogPost["category"],
        reviewer: d.reviewerName ? { name: d.reviewerName, credentials: d.reviewerCredentials, reviewedOn: d.reviewedOn } : null,
        targetQuery: d.targetQuery,
      }),
    [d]
  );

  const save = useCallback(
    () =>
      new Promise<boolean>((resolve) =>
        start(async () => {
          const r = await saveBlogPost(id, d);
          setResult(r);
          if (r.ok) setSaved(d);
          router.refresh();
          resolve(r.ok);
        })
      ),
    [d, id, router]
  );

  const act = (fn: () => Promise<SaveResult>) =>
    start(async () => {
      if (dirty && !(await saveBlogPost(id, d)).ok) return setResult({ ok: false, message: "Save your changes first; they didn't pass the checks." });
      setSaved(d);
      const r = await fn();
      setResult(r);
      router.refresh();
    });

  // Cmd/Ctrl+S saves, and leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (canEdit) void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty, canEdit]);

  const image = options.images.find((i) => i.value === d.image);
  const review = ai?.review;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Tag tone={live ? "ink" : "default"}>{live ? "Live" : "Draft"}</Tag>
          <Tag tone={score >= 90 ? "positive" : score >= 70 ? "warn" : "danger"} className="tabular-nums">
            {score} / 100
          </Tag>
          {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/studio/blog/${id}/preview`} target="_blank">
              <Eye /> Preview
            </Link>
          </Button>
          {live && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/blog/${saved.slug}`} target="_blank">
                <ExternalLink /> View live
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" disabled={pending || !dirty} onClick={() => void save()}>
              {pending ? "Saving…" : "Save"}
            </Button>
          )}
          {canPublish &&
            (live ? (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => unpublishBlogPost(id))}>
                Unpublish
              </Button>
            ) : (
              <Button size="sm" disabled={pending} onClick={() => act(() => publishBlogPost(id))}>
                Publish
              </Button>
            ))}
        </div>
      </div>

      {result && (
        <div role="status" className={cn("rounded-2xl border px-4 py-3 text-sm", result.ok ? "border-positive/30 bg-positive/5 text-positive" : "border-destructive/30 bg-destructive/5 text-destructive")}>
          <p>{result.message}</p>
          {result.issues && (
            <ul className="mt-2 list-disc pl-5">
              {result.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-12">
        {/* The post */}
        <fieldset disabled={!canEdit} className="min-w-0 space-y-6 xl:col-span-8">
          <Field label="The question this post answers" hint="The scorer checks the title uses these words.">
            <input className={fieldClass} value={d.targetQuery} onChange={(e) => set("targetQuery", e.target.value)} />
          </Field>

          <Field label="Title">
            <input className={cn(fieldClass, "display text-2xl")} value={d.title} onChange={(e) => set("title", e.target.value)} />
            <Counter value={d.title.length} min={30} max={60} />
          </Field>
          {ai?.plan && ai.plan.titleOptions.length > 1 && (
            <div className="-mt-3 flex flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground">Other titles the writer suggested:</span>
              {ai.plan.titleOptions
                .filter((t) => t !== d.title)
                .map((t) => (
                  <button key={t} type="button" onClick={() => set("title", t)} className="rounded-full border border-rule bg-card px-2.5 py-1 hover:border-ink/40">
                    {t}
                  </button>
                ))}
            </div>
          )}

          <Field label="Description" hint="The snippet under the link in Google and when the post is shared.">
            <textarea rows={2} className={fieldClass} value={d.description} onChange={(e) => set("description", e.target.value)} />
            <Counter value={d.description.length} min={120} max={160} />
          </Field>

          {/* Search preview */}
          <div className="rounded-2xl border border-rule bg-card p-5">
            <p className="label mb-3 text-muted-foreground">How it looks in Google</p>
            <p className="text-[13px] text-ink-2">trichollective.net › blog › {d.slug}</p>
            <p className="mt-1 truncate text-xl text-[#1a0dab]">{d.title || "Title"} | Trichollective</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-2">{d.description || "Description"}</p>
          </div>

          <Field label="Standfirst" hint="Two or three sentences under the headline.">
            <textarea rows={3} className={fieldClass} value={d.standfirst} onChange={(e) => set("standfirst", e.target.value)} />
          </Field>

          <Field label="The short answer" hint="Shown first on the page in black. Written so Google and AI assistants can quote it whole.">
            <textarea rows={4} className={cn(fieldClass, "bg-ink text-paper")} value={d.answer} onChange={(e) => set("answer", e.target.value)} />
            <Counter value={words(d.answer)} min={40} max={75} unit="words" />
          </Field>

          <Field label="Key points" hint="One per line, three to five.">
            <textarea rows={5} className={fieldClass} value={d.takeaways} onChange={(e) => set("takeaways", e.target.value)} />
          </Field>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Body</p>
              <div className="flex rounded-full border border-rule bg-card p-0.5 text-sm">
                {(["write", "preview"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setBodyTab(t)} className={cn("rounded-full px-3 py-1 capitalize", bodyTab === t ? "bg-ink text-paper" : "text-ink-2")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {bodyTab === "write" ? (
              <textarea rows={30} className={cn(fieldClass, "font-mono text-[13px] leading-relaxed")} value={d.body} onChange={(e) => set("body", e.target.value)} />
            ) : (
              <div className="rounded-2xl border border-rule bg-paper p-6">
                <PostBody markdown={d.body} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {words(d.body)} words. Use &quot;## &quot; for section headings (questions work best), &quot;- &quot; for lists and [words](/guides/…) for links.
            </p>
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Common questions</p>
            {d.faqs.map((f, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-rule bg-card p-4">
                <div className="flex gap-2">
                  <input className={fieldClass} placeholder="Question?" value={f.q} onChange={(e) => set("faqs", d.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => set("faqs", d.faqs.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </Button>
                </div>
                <textarea rows={2} className={fieldClass} placeholder="Answer" value={f.a} onChange={(e) => set("faqs", d.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("faqs", [...d.faqs, { q: "", a: "" }])}>
              <Plus /> Add a question
            </Button>
          </div>

          {/* Sources */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Sources</p>
            {d.sources.map((s, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row">
                <input className={cn(fieldClass, "sm:w-2/5")} placeholder="NHS: Hair loss" value={s.label} onChange={(e) => set("sources", d.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className={cn(fieldClass, "font-mono text-xs")} placeholder="https://" value={s.url} onChange={(e) => set("sources", d.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove source" onClick={() => set("sources", d.sources.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("sources", [...d.sources, { label: "", url: "" }])}>
              <Plus /> Add a source
            </Button>
          </div>

          {/* Details */}
          <details className="rounded-2xl border border-rule bg-card p-5" open={!d.slug}>
            <summary className="cursor-pointer font-medium">Address, topic, author, photo and related pages</summary>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Web address" hint={live ? "Unpublish to change it, so existing links keep working." : "/blog/…"}>
                <input className={cn(fieldClass, "font-mono text-xs")} value={d.slug} disabled={live} onChange={(e) => set("slug", e.target.value)} />
              </Field>
              <Field label="Tags" hint="Comma separated, three to eight.">
                <input className={fieldClass} value={d.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
              <Field label="Topic">
                <select className={fieldClass} value={d.category} onChange={(e) => set("category", e.target.value)}>
                  {options.categories.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Written for">
                <select className={fieldClass} value={d.audience} onChange={(e) => set("audience", e.target.value)}>
                  <option value="both">Professionals and the public</option>
                  <option value="professional">Professionals</option>
                  <option value="public">The public</option>
                </select>
              </Field>
              <Field label="Author">
                <select className={fieldClass} value={d.author} onChange={(e) => set("author", e.target.value)}>
                  {options.authors.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Find someone in the directory">
                <select className={fieldClass} value={d.discipline} onChange={(e) => set("discipline", e.target.value)}>
                  <option value="">Don&apos;t show</option>
                  <option value="cosmetic">Cosmetic professionals</option>
                  <option value="clinical">Trichologists</option>
                  <option value="medical">Doctors and nurses</option>
                </select>
              </Field>
              <Field label="Photo" className="sm:col-span-2">
                <div className="flex gap-3">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${image.src}?w=240&q=60&auto=format&fit=crop`} alt="" className="mag-bw h-20 w-28 shrink-0 rounded-xl object-cover" />
                  )}
                  <select className={fieldClass} value={d.image} onChange={(e) => set("image", e.target.value)}>
                    {options.images.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label.slice(0, 90)}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="Related guides" hint="Hold Cmd or Ctrl to choose more than one.">
                <select multiple size={5} className={fieldClass} value={d.relatedGuides} onChange={(e) => set("relatedGuides", [...e.target.selectedOptions].map((o) => o.value))}>
                  {options.guides.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Glossary terms">
                <select multiple size={5} className={fieldClass} value={d.relatedGlossary} onChange={(e) => set("relatedGlossary", [...e.target.selectedOptions].map((o) => o.value))}>
                  {options.glossary.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} /> Lead the blog page with this post
              </label>
            </div>
          </details>

          <details className="rounded-2xl border border-rule bg-card p-5" open={!!d.reviewerName}>
            <summary className="cursor-pointer font-medium">Clinical review</summary>
            <p className="mt-2 text-sm text-muted-foreground">Only fill this in once a named clinician has actually read the post. It is shown on the page and in the structured data.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Name">
                <input className={fieldClass} value={d.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} />
              </Field>
              <Field label="Credentials">
                <input className={fieldClass} value={d.reviewerCredentials} placeholder="Consultant dermatologist" onChange={(e) => set("reviewerCredentials", e.target.value)} />
              </Field>
              <Field label="Reviewed on">
                <input type="date" className={fieldClass} value={d.reviewedOn} onChange={(e) => set("reviewedOn", e.target.value)} />
              </Field>
            </div>
          </details>
        </fieldset>

        {/* Sidebar */}
        <aside className="space-y-5 xl:col-span-4">
          <div className="space-y-5 xl:sticky xl:top-20">
            {/* Score */}
            <section className="rounded-3xl border border-rule bg-card p-5">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
                  style={{ background: `conic-gradient(var(--ink) ${score * 3.6}deg, var(--paper-3) 0deg)` }}
                  aria-hidden
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-lg font-semibold tabular-nums">{score}</span>
                </div>
                <div>
                  <p className="font-semibold">Ready for search and AI answers</p>
                  <p className="text-sm text-muted-foreground">Updates as you type. Aim for 90 or more.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {GROUPS.map((g) => (
                  <div key={g}>
                    <p className="label mb-2 text-muted-foreground">{g}</p>
                    <ul className="space-y-1.5">
                      {checks
                        .filter((c) => c.group === g)
                        .map((c) => (
                          <li key={c.id} className="flex gap-2 text-[13px] leading-snug">
                            {c.ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />}
                            <span className={c.ok ? "text-ink-2" : "text-ink"}>
                              {c.label}
                              {!c.ok && <span className="block text-muted-foreground">{c.hint}</span>}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Fact check */}
            {review && (
              <section className="space-y-3 rounded-3xl border border-rule bg-card p-5">
                <div className="flex items-center gap-2">
                  {review.verdict === "ready" && !ai?.fixed ? <ShieldCheck className="h-5 w-5 text-positive" /> : <AlertTriangle className="h-5 w-5 text-amber-700" />}
                  <p className="font-semibold">AI fact-check</p>
                </div>
                <p className="text-sm text-ink-2">{review.summary}</p>
                {ai?.fixed && ai.fixed.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-positive">The writer revised the draft to fix {ai.fixed.length} {ai.fixed.length === 1 ? "issue" : "issues"}</summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                      {ai.fixed.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <p className="text-xs text-muted-foreground">
                  The check compares the draft with the pages the writer read. It is a second pair of eyes, not a clinical review: read the post yourself before publishing.
                </p>
                {ai?.research && (
                  <details className="text-sm">
                    <summary className="cursor-pointer">Pages the writer read ({ai.research.filter((r) => r.ok).length})</summary>
                    <ul className="mt-2 space-y-1">
                      {ai.research.map((r) => (
                        <li key={r.url} className={r.ok ? "" : "text-muted-foreground line-through"}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline decoration-mute underline-offset-2">
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}

            {/* Rewrite */}
            {canEdit && !live && (
              <section className="space-y-3 rounded-3xl border border-rule bg-card p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <p className="font-semibold">Rewrite with AI</p>
                </div>
                <textarea
                  rows={3}
                  className={fieldClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Make it more practical for barbers, and add what to write in the case notes."
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (dirty && !confirm("Rewriting replaces your unsaved changes. Carry on?")) return;
                      const r = await rewriteBlogPost(id, note);
                      setResult(r);
                      router.refresh();
                    })
                  }
                >
                  Rewrite the draft
                </Button>
                <p className="text-xs text-muted-foreground">The writer plans again, rereads the sources, rewrites with your note, then fact-checks the new version.</p>
              </section>
            )}

            {canEdit && !live && (
              <form action={archiveBlogPost.bind(null, id)}>
                <button type="submit" className="text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline">
                  Archive this draft
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
