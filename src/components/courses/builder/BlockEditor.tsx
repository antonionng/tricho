"use client";

import { useState } from "react";
import { FileText, ImageIcon, Loader2, PlayCircle } from "lucide-react";
import type { LessonBlock } from "@/content/course-types";
import { parseVideoUrl, videoEmbedUrl, videoPageUrl } from "@/lib/video-embed";
import { cn } from "@/lib/utils";
import { AddButton, Field, ItemControls, LinesField, PairsField, TextArea, TextInput, inputClass, move } from "./fields";

export type UploadFn = (form: FormData) => Promise<{ ok: true; fileId: string; url: string; name: string } | { ok: false; error: string }>;

type BlockType = LessonBlock["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: "p", label: "Paragraph", hint: "Body text" },
  { type: "h", label: "Heading", hint: "Starts a new section" },
  { type: "list", label: "List", hint: "Bullet or numbered points" },
  { type: "callout", label: "Callout", hint: "A tip, caution, red flag or scope note" },
  { type: "case", label: "Case study", hint: "A client scenario with a hidden discussion" },
  { type: "script", label: "What to say", hint: "Words to use with a client" },
  { type: "steps", label: "Steps", hint: "A numbered procedure" },
  { type: "table", label: "Table", hint: "Rows and columns" },
  { type: "terms", label: "Key terms", hint: "Words and what they mean" },
  { type: "template", label: "Template", hint: "Something to copy, like a letter or checklist" },
  { type: "video", label: "Video", hint: "A Vimeo or YouTube link" },
  { type: "image", label: "Image", hint: "A photo or diagram" },
  { type: "file", label: "PDF handout", hint: "A file learners can download" },
];

export function newBlock(type: BlockType): LessonBlock {
  switch (type) {
    case "p":
    case "h":
      return { type, text: "" };
    case "list":
      return { type, items: [""] };
    case "callout":
      return { type, tone: "tip", title: "", text: "" };
    case "case":
      return { type, title: "", scenario: "", question: "", discussion: "" };
    case "script":
      return { type, title: "What to say", lines: [""] };
    case "steps":
      return { type, title: "", steps: [{ title: "", detail: "" }] };
    case "table":
      return { type, caption: "", head: ["", ""], rows: [["", ""]] };
    case "terms":
      return { type, items: [{ term: "", meaning: "" }] };
    case "template":
      return { type, title: "", body: "" };
    case "video":
      return { type, provider: "youtube", id: "" };
    case "image":
      return { type, fileId: "", alt: "" };
    case "file":
      return { type, fileId: "", title: "" };
  }
}

export function BlockList({
  blocks,
  onChange,
  upload,
  imageUrls,
  onImageUrl,
}: {
  blocks: LessonBlock[];
  onChange: (b: LessonBlock[]) => void;
  upload: UploadFn;
  imageUrls: Record<string, string>;
  onImageUrl: (id: string, url: string) => void;
}) {
  const [adding, setAdding] = useState<number | null>(null);
  const insert = (at: number, type: BlockType) => {
    onChange([...blocks.slice(0, at), newBlock(type), ...blocks.slice(at)]);
    setAdding(null);
  };
  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && <p className="rounded-2xl border border-dashed border-rule p-5 text-[15px] text-muted-foreground">This lesson has no teaching content yet. Add your first block below.</p>}
      {blocks.map((block, i) => (
        <div key={i} className="rounded-2xl border border-rule bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{BLOCK_TYPES.find((b) => b.type === block.type)?.label}</p>
            <ItemControls
              label="block"
              onUp={i > 0 ? () => onChange(move(blocks, i, -1)) : undefined}
              onDown={i < blocks.length - 1 ? () => onChange(move(blocks, i, 1)) : undefined}
              onRemove={() => onChange(blocks.filter((_, j) => j !== i))}
            />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <BlockFields block={block} onChange={(b) => onChange(blocks.map((x, j) => (j === i ? b : x)))} upload={upload} imageUrls={imageUrls} onImageUrl={onImageUrl} />
          </div>
        </div>
      ))}
      {adding === null ? (
        <AddButton onClick={() => setAdding(blocks.length)}>Add a block</AddButton>
      ) : (
        <div className="rounded-2xl border border-rule bg-paper-2 p-3">
          <p className="mb-2 px-1 text-[14px] font-medium">Choose what to add</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {BLOCK_TYPES.map((b) => (
              <button key={b.type} type="button" onClick={() => insert(adding, b.type)} className="rounded-xl px-3 py-2 text-left transition-colors hover:bg-card">
                <span className="block text-[14px] font-medium">{b.label}</span>
                <span className="block text-[13px] text-muted-foreground">{b.hint}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAdding(null)} className="mt-2 px-1 text-[14px] text-muted-foreground underline underline-offset-4">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  upload,
  imageUrls,
  onImageUrl,
}: {
  block: LessonBlock;
  onChange: (b: LessonBlock) => void;
  upload: UploadFn;
  imageUrls: Record<string, string>;
  onImageUrl: (id: string, url: string) => void;
}) {
  switch (block.type) {
    case "p":
      return <TextArea value={block.text} onChange={(text) => onChange({ ...block, text })} rows={5} aria-label="Paragraph" placeholder="Write in full sentences, as you'd explain it to a colleague." />;
    case "h":
      return <TextInput value={block.text} onChange={(text) => onChange({ ...block, text })} aria-label="Heading" placeholder="Section heading" />;
    case "list":
      return (
        <>
          <Field label="One point per line">
            <LinesField value={block.items} onChange={(items) => onChange({ ...block, items })} />
          </Field>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={!!block.ordered} onChange={(e) => onChange({ ...block, ordered: e.target.checked })} /> Numbered list
          </label>
        </>
      );
    case "callout":
      return (
        <>
          <Field label="Kind">
            <select value={block.tone} onChange={(e) => onChange({ ...block, tone: e.target.value as typeof block.tone })} className={inputClass}>
              <option value="tip">In practice (a tip)</option>
              <option value="caution">Take care</option>
              <option value="redflag">Red flag</option>
              <option value="scope">Scope of practice</option>
            </select>
          </Field>
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} />
          </Field>
          <Field label="Text">
            <TextArea value={block.text} onChange={(text) => onChange({ ...block, text })} />
          </Field>
        </>
      );
    case "case":
      return (
        <>
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} placeholder="A client with sudden shedding" />
          </Field>
          <Field label="The scenario">
            <TextArea value={block.scenario} onChange={(scenario) => onChange({ ...block, scenario })} rows={4} />
          </Field>
          <Field label="The question for the learner">
            <TextInput value={block.question} onChange={(question) => onChange({ ...block, question })} placeholder="What would you do?" />
          </Field>
          <Field label="The discussion" hint="Hidden until the learner chooses to reveal it.">
            <TextArea value={block.discussion} onChange={(discussion) => onChange({ ...block, discussion })} rows={4} />
          </Field>
        </>
      );
    case "script":
      return (
        <>
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} />
          </Field>
          <Field label="What to say, one line each">
            <LinesField value={block.lines} onChange={(lines) => onChange({ ...block, lines })} />
          </Field>
        </>
      );
    case "steps":
      return (
        <>
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} />
          </Field>
          <PairsField
            value={block.steps.map((s) => ({ a: s.title, b: s.detail }))}
            onChange={(v) => onChange({ ...block, steps: v.map((p) => ({ title: p.a, detail: p.b })) })}
            firstLabel="Step"
            secondLabel="What to do, and why"
            addLabel="Add a step"
          />
        </>
      );
    case "terms":
      return (
        <PairsField
          value={block.items.map((t) => ({ a: t.term, b: t.meaning }))}
          onChange={(v) => onChange({ ...block, items: v.map((p) => ({ term: p.a, meaning: p.b })) })}
          firstLabel="Term"
          secondLabel="What it means"
          addLabel="Add a term"
        />
      );
    case "table":
      return (
        <>
          <Field label="Table" hint="One row per line, with cells separated by | . The first line is the header.">
            <TextArea
              value={[block.head, ...block.rows].map((r) => r.join(" | ")).join("\n")}
              onChange={(v) => {
                const lines = v.split("\n").map((l) => l.split("|").map((c) => c.trim()));
                onChange({ ...block, head: lines[0] ?? [], rows: lines.slice(1) });
              }}
              rows={6}
              className="font-mono text-[13.5px]"
            />
          </Field>
          <Field label="Caption">
            <TextInput value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
          </Field>
        </>
      );
    case "template":
      return (
        <>
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} placeholder="Referral letter" />
          </Field>
          <Field label="Template" hint="Learners can copy it or save it as a text file.">
            <TextArea value={block.body} onChange={(body) => onChange({ ...block, body })} rows={8} className="font-mono text-[13.5px]" />
          </Field>
        </>
      );
    case "video":
      return <VideoFields block={block} onChange={onChange} />;
    case "image":
      return (
        <>
          <UploadField
            kind="image"
            label={block.fileId ? "Replace the image" : "Upload an image"}
            upload={upload}
            onDone={(r) => {
              onImageUrl(r.fileId, r.url);
              onChange({ ...block, fileId: r.fileId });
            }}
          />
          {block.fileId && imageUrls[block.fileId] && (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an upload
            <img src={imageUrls[block.fileId]} alt="" className="max-h-56 w-auto self-start rounded-xl border border-rule" />
          )}
          <Field label="Description for screen readers" hint="Say what the image shows, as you would to someone who can't see it.">
            <TextInput value={block.alt} onChange={(alt) => onChange({ ...block, alt })} />
          </Field>
          <Field label="Caption (optional)">
            <TextInput value={block.caption ?? ""} onChange={(caption) => onChange({ ...block, caption })} />
          </Field>
        </>
      );
    case "file":
      return (
        <>
          <UploadField kind="file" label={block.fileId ? "Replace the PDF" : "Upload a PDF"} upload={upload} onDone={(r) => onChange({ ...block, fileId: r.fileId, title: block.title || r.name.replace(/\.pdf$/i, "") })} />
          {block.fileId && <p className="inline-flex items-center gap-2 text-[14px] text-ink-2"><FileText className="h-4 w-4" /> PDF uploaded. Only learners with a place can open it.</p>}
          <Field label="Title">
            <TextInput value={block.title} onChange={(title) => onChange({ ...block, title })} />
          </Field>
          <Field label="Description (optional)">
            <TextInput value={block.description ?? ""} onChange={(description) => onChange({ ...block, description })} />
          </Field>
        </>
      );
  }
}

function VideoFields({ block, onChange }: { block: Extract<LessonBlock, { type: "video" }>; onChange: (b: LessonBlock) => void }) {
  const [link, setLink] = useState(block.id ? videoPageUrl(block) : "");
  const parsed = parseVideoUrl(link);
  const embed = block.id ? videoEmbedUrl(block) : null;
  return (
    <>
      <Field label="Vimeo or YouTube link" hint="Host the video yourself on Vimeo or YouTube. On Vimeo, restrict embedding to trichollective.net so it can't be watched elsewhere.">
        <TextInput
          value={link}
          onChange={(v) => {
            setLink(v);
            const p = parseVideoUrl(v);
            if (p) onChange({ ...block, provider: p.provider, id: p.id });
          }}
          placeholder="https://vimeo.com/…"
          inputMode="url"
        />
      </Field>
      {link && !parsed && <p className="text-[14px] text-destructive">We can&apos;t read that link. Paste the address of the video page on Vimeo or YouTube.</p>}
      {embed ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
          <iframe src={embed} title="Video preview" className="absolute inset-0 h-full w-full" allow="fullscreen; picture-in-picture" loading="lazy" />
        </div>
      ) : (
        <p className="inline-flex items-center gap-2 text-[14px] text-muted-foreground">
          <PlayCircle className="h-4 w-4" /> The video will appear here once the link is read.
        </p>
      )}
      <Field label="Caption (optional)">
        <TextInput value={block.caption ?? ""} onChange={(caption) => onChange({ ...block, caption })} />
      </Field>
    </>
  );
}

function UploadField({ kind, label, upload, onDone }: { kind: "image" | "file"; label: string; upload: UploadFn; onDone: (r: { fileId: string; url: string; name: string }) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <label className={cn("inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-ink/20 px-4 py-2 text-[14px] font-medium hover:border-ink", busy && "pointer-events-none opacity-60")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : kind === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        {busy ? "Uploading…" : label}
        <input
          type="file"
          className="sr-only"
          accept={kind === "image" ? "image/png,image/jpeg,image/webp" : "application/pdf"}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError(null);
            const form = new FormData();
            form.set("file", file);
            form.set("as", kind);
            const res = await upload(form).catch(() => ({ ok: false as const, error: "The upload didn't finish. Please try again." }));
            setBusy(false);
            if (res.ok) onDone(res);
            else setError(res.error);
          }}
        />
      </label>
      <span className="text-[13px] text-muted-foreground">{kind === "image" ? "PNG, JPEG or WebP, up to 8MB." : "PDF, up to 9MB."}</span>
      {error && <p className="text-[14px] text-destructive">{error}</p>}
    </div>
  );
}
