"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, FileCheck2, Lock, PencilLine, Plus, Settings2 } from "lucide-react";
import type { CourseContent, Lesson } from "@/content/course-types";
import { RESERVED_LESSON_SLUGS, readinessIssues, type CourseMeta } from "@/content/course-schema";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockList, type UploadFn } from "./BlockEditor";
import { QuestionList } from "./QuestionEditor";
import { Field, ItemControls, LinesField, NumberInput, TextArea, TextInput, inputClass, move, slugFrom } from "./fields";

export type SaveFn = (id: string, payload: { meta: CourseMeta; content: CourseContent }) => Promise<{ ok: true; savedAt: string } | { ok: false; error: string }>;

type Section = { kind: "details" } | { kind: "lesson"; index: number } | { kind: "assessment" };
type SaveState = { state: "saved" | "dirty" | "saving" | "error"; at?: string; error?: string };

const AUTOSAVE_MS = 2000;

/**
 * The course builder. Everything is edited in the browser and saved as a draft
 * a couple of seconds after each change; nothing reaches learners until a
 * version is sent for review and approved.
 */
export function CourseBuilder({
  courseId,
  slug,
  initialMeta,
  initialContent,
  lockedSlugs,
  images,
  initialImageUrls,
  save,
  upload,
  readOnly = false,
  submit,
}: {
  courseId: string;
  slug: string;
  initialMeta: CourseMeta;
  initialContent: CourseContent;
  lockedSlugs: string[];
  images: { key: string; src: string; alt: string }[];
  initialImageUrls: Record<string, string>;
  save: SaveFn;
  upload: UploadFn;
  readOnly?: boolean;
  /** The form action that sends the saved draft for review. Shown once nothing is left to fix. */
  submit?: (form: FormData) => Promise<void>;
}) {
  const [meta, setMeta] = useState(initialMeta);
  const [content, setContent] = useState(initialContent);
  const [section, setSection] = useState<Section>({ kind: "details" });
  const [preview, setPreview] = useState(false);
  const [imageUrls, setImageUrls] = useState(initialImageUrls);
  const [saveState, setSaveState] = useState<SaveState>({ state: "saved" });
  const changed = useRef(false);
  const locked = useMemo(() => new Set(lockedSlugs), [lockedSlugs]);
  const issues = useMemo(() => readinessIssues(meta, content), [meta, content]);

  const doSave = useCallback(async () => {
    setSaveState({ state: "saving" });
    const res = await save(courseId, { meta, content }).catch(() => ({ ok: false as const, error: "We couldn't reach the server. Your changes are still here; we'll try again." }));
    setSaveState(res.ok ? { state: "saved", at: res.savedAt } : { state: "error", error: res.error });
  }, [courseId, meta, content, save]);

  useEffect(() => {
    if (!changed.current || readOnly) return;
    const t = setTimeout(doSave, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [meta, content, doSave, readOnly]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState.state === "dirty" || saveState.state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState.state]);

  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    changed.current = true;
    setSaveState((s) => (s.state === "saving" ? s : { state: "dirty" }));
    set(v);
  };
  const editMeta = edit<CourseMeta>(setMeta);
  const editContent = edit<CourseContent>(setContent);

  const setLesson = (index: number, lesson: Lesson) => editContent({ ...content, lessons: content.lessons.map((l, i) => (i === index ? lesson : l)) });

  const uniqueLessonSlug = (title: string, index: number) => {
    const taken = new Set([...content.lessons.filter((_, i) => i !== index).map((l) => l.slug), ...RESERVED_LESSON_SLUGS]);
    const base = slugFrom(title) || `lesson-${index + 1}`;
    if (!taken.has(base)) return base;
    for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  };

  const addLesson = () => {
    const index = content.lessons.length;
    const lesson: Lesson = { slug: uniqueLessonSlug(`lesson-${index + 1}`, index), title: "", detail: "", minutes: 20, objectives: [""], blocks: [], check: [], reflection: "", takeaways: ["", "", ""] };
    editContent({ ...content, lessons: [...content.lessons, lesson] });
    setSection({ kind: "lesson", index });
  };

  const current = section.kind === "lesson" ? content.lessons[section.index] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Save bar */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="inline-flex items-center gap-2 text-[14px]" aria-live="polite">
          {saveState.state === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-4 w-4" /> {saveState.error}
            </span>
          ) : saveState.state === "saving" ? (
            <span className="text-muted-foreground">Saving…</span>
          ) : saveState.state === "dirty" ? (
            <span className="text-muted-foreground">Unsaved changes</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-positive" />
              {saveState.at ? `Draft saved at ${new Date(saveState.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Draft saved"}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {section.kind === "lesson" && (
            <Button type="button" variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? <PencilLine /> : <Eye />} {preview ? "Edit" : "Preview"}
            </Button>
          )}
          {!readOnly && (
            <Button type="button" size="sm" onClick={doSave} disabled={saveState.state === "saving" || saveState.state === "saved"}>
              Save draft
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Outline */}
        <nav aria-label="Course outline" className="flex flex-col gap-1 lg:sticky lg:top-20 lg:self-start">
          <OutlineButton active={section.kind === "details"} onClick={() => setSection({ kind: "details" })}>
            <Settings2 className="h-4 w-4 shrink-0" /> Course details
          </OutlineButton>
          <p className="label mt-4 mb-1 px-3 text-muted-foreground">Lessons</p>
          {content.lessons.map((l, i) => (
            <OutlineButton key={l.slug} active={section.kind === "lesson" && section.index === i} onClick={() => setSection({ kind: "lesson", index: i })}>
              <span className="w-5 shrink-0 text-[12px] tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{l.title || "Untitled lesson"}</span>
            </OutlineButton>
          ))}
          {!readOnly && (
            <button type="button" onClick={addLesson} className="mt-1 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-medium hover:bg-paper-2">
              <Plus className="h-4 w-4" /> Add a lesson
            </button>
          )}
          <OutlineButton active={section.kind === "assessment"} onClick={() => setSection({ kind: "assessment" })} className="mt-4">
            <FileCheck2 className="h-4 w-4 shrink-0" /> Final assessment
            <span className="ml-auto text-[12px] text-muted-foreground">{content.assessment.length}</span>
          </OutlineButton>

          <Readiness issues={issues} />
          {submit && issues.length === 0 && (
            <form action={submit} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={courseId} />
              <Button type="submit" disabled={saveState.state !== "saved"}>
                Send for review
              </Button>
              {saveState.state !== "saved" && <span className="text-[13px] text-muted-foreground">Save your changes first.</span>}
            </form>
          )}
        </nav>

        {/* Editor */}
        <fieldset disabled={readOnly} className="min-w-0">
          {section.kind === "details" && <DetailsEditor meta={meta} onChange={editMeta} images={images} />}

          {section.kind === "lesson" && current && (
            preview ? (
              <article className="flex max-w-[44rem] flex-col gap-6">
                <p className="label text-muted-foreground">Preview of lesson {section.index + 1}</p>
                <h2 className="display text-4xl leading-tight">{current.title || "Untitled lesson"}</h2>
                <LessonBlocks blocks={current.blocks} imageUrls={imageUrls} fileHref={(id) => `/api/courses/${slug}/files/${id}`} />
              </article>
            ) : (
              <LessonEditor
                lesson={current}
                index={section.index}
                total={content.lessons.length}
                slugLocked={locked.has(current.slug)}
                onChange={(l) => setLesson(section.index, l)}
                onTitle={(title) => setLesson(section.index, { ...current, title, slug: locked.has(current.slug) ? current.slug : uniqueLessonSlug(title, section.index) })}
                onMove={(by) => {
                  editContent({ ...content, lessons: move(content.lessons, section.index, by) });
                  setSection({ kind: "lesson", index: section.index + by });
                }}
                onRemove={
                  locked.has(current.slug)
                    ? undefined
                    : () => {
                        if (!window.confirm(`Delete "${current.title || "this lesson"}"? This can't be undone once the draft saves.`)) return;
                        editContent({ ...content, lessons: content.lessons.filter((_, i) => i !== section.index) });
                        setSection({ kind: "details" });
                      }
                }
                upload={upload}
                imageUrls={imageUrls}
                onImageUrl={(id, url) => setImageUrls((m) => ({ ...m, [id]: url }))}
              />
            )
          )}

          {section.kind === "assessment" && (
            <section className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-[-0.015em]">Final assessment</h2>
                <p className="max-w-2xl text-[15px] text-ink-2">
                  Learners take this once every lesson is complete, and need 80% to earn the certificate. Write at least five questions that test the course as a whole, ideally as short client scenarios.
                </p>
              </header>
              <QuestionList questions={content.assessment} onChange={(assessment) => editContent({ ...content, assessment })} idPrefix="a" addLabel="Add a question" />
            </section>
          )}
        </fieldset>
      </div>
    </div>
  );
}

function OutlineButton({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] transition-colors", active ? "bg-ink text-paper" : "hover:bg-paper-2", className)}
    >
      {children}
    </button>
  );
}

function Readiness({ issues }: { issues: string[] }) {
  return (
    <div className={cn("mt-6 rounded-2xl border p-4 text-[13px] leading-snug", issues.length ? "border-rule bg-card" : "border-positive/30 bg-positive/10")}>
      {issues.length === 0 ? (
        <p className="inline-flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-4 w-4 text-positive" /> Ready to send for review.
        </p>
      ) : (
        <>
          <p className="mb-2 font-medium">Before it can go for review</p>
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-auto text-ink-2">
            {issues.slice(0, 12).map((i) => (
              <li key={i}>{i}</li>
            ))}
            {issues.length > 12 && <li>And {issues.length - 12} more.</li>}
          </ul>
        </>
      )}
    </div>
  );
}

function DetailsEditor({ meta, onChange, images }: { meta: CourseMeta; onChange: (m: CourseMeta) => void; images: { key: string; src: string; alt: string }[] }) {
  const set = (patch: Partial<CourseMeta>) => onChange({ ...meta, ...patch });
  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h2 className="text-2xl font-semibold tracking-[-0.015em]">Course details</h2>
      <Field label="Title">
        <TextInput value={meta.title} onChange={(title) => set({ title })} />
      </Field>
      <Field label="Summary" hint="One or two sentences on the course page and in the catalogue. Lead with what the learner will be able to do.">
        <TextArea value={meta.summary} onChange={(summary) => set({ summary })} rows={3} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Who it's for">
          <TextInput value={meta.audience} onChange={(audience) => set({ audience })} placeholder="Stylists and head spa therapists" />
        </Field>
        <Field label="Discipline">
          <select value={meta.discipline} onChange={(e) => set({ discipline: e.target.value as CourseMeta["discipline"] })} className={inputClass}>
            <option value="everyone">Everyone</option>
            <option value="cosmetic">Cosmetic</option>
            <option value="clinical">Clinical</option>
            <option value="medical">Medical</option>
          </select>
        </Field>
      </div>
      <Field label="Format" hint='Shown on the course page, e.g. "Six lessons with case studies and a final assessment".'>
        <TextInput value={meta.format} onChange={(format) => set({ format })} />
      </Field>
      <Field label="What learners will be able to do" hint="One outcome per line. Start each with a verb.">
        <LinesField value={meta.outcomes} onChange={(outcomes) => set({ outcomes })} rows={4} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Study hours" hint="Printed on the certificate.">
          <NumberInput value={meta.hours} onChange={(hours) => set({ hours })} min={1} max={100} />
        </Field>
        <Field label="Price (£)">
          <NumberInput value={meta.priceGBP} onChange={(priceGBP) => set({ priceGBP })} max={5000} />
        </Field>
        <Field label="Member price (£)">
          <NumberInput value={meta.memberPriceGBP} onChange={(memberPriceGBP) => set({ memberPriceGBP })} max={5000} />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[14px] font-medium">Cover image</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <button
              key={img.key}
              type="button"
              onClick={() => set({ imageKey: img.key })}
              aria-pressed={meta.imageKey === img.key}
              aria-label={img.alt}
              className={cn("relative aspect-[4/3] overflow-hidden rounded-lg border-2", meta.imageKey === img.key ? "border-ink" : "border-transparent opacity-80 hover:opacity-100")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails */}
              <img src={img.src} alt="" className="h-full w-full object-cover grayscale-[20%]" loading="lazy" />
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function LessonEditor({
  lesson,
  index,
  total,
  slugLocked,
  onChange,
  onTitle,
  onMove,
  onRemove,
  upload,
  imageUrls,
  onImageUrl,
}: {
  lesson: Lesson;
  index: number;
  total: number;
  slugLocked: boolean;
  onChange: (l: Lesson) => void;
  onTitle: (title: string) => void;
  onMove: (by: -1 | 1) => void;
  onRemove?: () => void;
  upload: UploadFn;
  imageUrls: Record<string, string>;
  onImageUrl: (id: string, url: string) => void;
}) {
  const set = (patch: Partial<Lesson>) => onChange({ ...lesson, ...patch });
  return (
    <section className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="label text-muted-foreground">Lesson {index + 1} of {total}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground">
            {slugLocked && <Lock className="h-3 w-3" />} …/{lesson.slug}
          </p>
        </div>
        <ItemControls label="lesson" onUp={index > 0 ? () => onMove(-1) : undefined} onDown={index < total - 1 ? () => onMove(1) : undefined} onRemove={onRemove} />
      </header>

      <div className="grid max-w-2xl gap-5">
        <Field label="Title" hint={slugLocked ? "Learners have already seen this lesson, so its web address stays the same." : undefined}>
          <TextInput value={lesson.title} onChange={onTitle} />
        </Field>
        <Field label="One-line description" hint="Shown in the syllabus.">
          <TextInput value={lesson.detail} onChange={(detail) => set({ detail })} />
        </Field>
        <Field label="Minutes to complete" className="max-w-40">
          <NumberInput value={lesson.minutes} onChange={(minutes) => set({ minutes })} min={1} max={240} />
        </Field>
        <Field label="By the end of this lesson, learners will be able to" hint="One objective per line.">
          <LinesField value={lesson.objectives} onChange={(objectives) => set({ objectives })} rows={3} />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold tracking-tight">Teaching content</h3>
        <BlockList blocks={lesson.blocks} onChange={(blocks) => set({ blocks })} upload={upload} imageUrls={imageUrls} onImageUrl={onImageUrl} />
      </div>

      <div className="grid max-w-2xl gap-5">
        <Field label="Three things to remember" hint="One takeaway per line, shown at the end of the lesson.">
          <LinesField value={lesson.takeaways} onChange={(takeaways) => set({ takeaways })} rows={3} />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold tracking-tight">Knowledge check</h3>
        <p className="max-w-2xl text-[15px] text-ink-2">Two to four questions. Answering them completes the lesson, and learners see each explanation straight away.</p>
        <QuestionList questions={lesson.check} onChange={(check) => set({ check })} idPrefix={`l${index + 1}`} addLabel="Add a question" />
      </div>

      <div className="grid max-w-2xl gap-5">
        <Field label="Reflection question" hint="Learners answer this privately, and it goes into their CPD record.">
          <TextArea value={lesson.reflection} onChange={(reflection) => set({ reflection })} rows={2} />
        </Field>
      </div>
    </section>
  );
}
